package infrastructure

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

// Infrastructure holds all external dependencies
type Infrastructure struct {
	DB          *pgxpool.Pool
	Redis       *redis.Client
	Logger      *zap.Logger
	StoragePath string
}

// NewInfrastructure initializes all infrastructure components
func NewInfrastructure(logger *zap.Logger) (*Infrastructure, error) {
	infra := &Infrastructure{
		Logger:      logger,
		StoragePath: getEnv("STORAGE_PATH", "./storage"),
	}

	// Initialize database
	if err := infra.initDatabase(); err != nil {
		return nil, fmt.Errorf("failed to initialize database: %w", err)
	}

	// Initialize Redis
	if err := infra.initRedis(); err != nil {
		return nil, fmt.Errorf("failed to initialize redis: %w", err)
	}

	// Create storage directory
	if err := infra.initStorage(); err != nil {
		return nil, fmt.Errorf("failed to initialize storage: %w", err)
	}

	logger.Info("Infrastructure initialized successfully")
	return infra, nil
}

// initDatabase initializes PostgreSQL connection pool
func (i *Infrastructure) initDatabase() error {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return fmt.Errorf("DATABASE_URL environment variable is required")
	}

	// Parse connection pool settings
	maxConns := getEnvInt("DB_MAX_OPEN_CONNS", 25)
	minConns := getEnvInt("DB_MIN_CONNS", 5)
	maxIdleTime := getEnvDuration("DB_CONN_MAX_IDLE_TIME", 5*time.Minute)
	maxLifetime := getEnvDuration("DB_CONN_MAX_LIFETIME", 30*time.Minute)

	// Configure connection pool
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return fmt.Errorf("failed to parse database config: %w", err)
	}

	config.MaxConns = int32(maxConns)
	config.MinConns = int32(minConns)
	config.MaxConnIdleTime = maxIdleTime
	config.MaxConnLifetime = maxLifetime
	config.HealthCheckPeriod = 1 * time.Minute

	// Create connection pool
	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := pool.Ping(ctx); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	i.DB = pool
	i.Logger.Info("Database connection established",
		zap.Int("max_conns", maxConns),
		zap.Int("min_conns", minConns),
	)

	return nil
}

// initRedis initializes Redis connection
func (i *Infrastructure) initRedis() error {
	redisURL := getEnv("REDIS_URL", "redis://localhost:6379")

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return fmt.Errorf("failed to parse redis URL: %w", err)
	}

	// Configure Redis client
	opt.PoolSize = getEnvInt("REDIS_POOL_SIZE", 10)
	opt.MinIdleConns = getEnvInt("REDIS_MIN_IDLE_CONNS", 5)
	opt.MaxIdleConns = getEnvInt("REDIS_MAX_IDLE_CONNS", 20)
	opt.ConnMaxIdleTime = getEnvDuration("REDIS_CONN_MAX_IDLE_TIME", 30*time.Minute)

	client := redis.NewClient(opt)

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("failed to ping redis: %w", err)
	}

	i.Redis = client
	i.Logger.Info("Redis connection established")

	return nil
}

// initStorage creates storage directory if it doesn't exist
func (i *Infrastructure) initStorage() error {
	if err := os.MkdirAll(i.StoragePath, 0755); err != nil {
		return fmt.Errorf("failed to create storage directory: %w", err)
	}

	i.Logger.Info("Storage directory initialized", zap.String("path", i.StoragePath))
	return nil
}

// Close closes all connections
func (i *Infrastructure) Close() {
	if i.DB != nil {
		i.DB.Close()
		i.Logger.Info("Database connection closed")
	}

	if i.Redis != nil {
		if err := i.Redis.Close(); err != nil {
			i.Logger.Error("Failed to close Redis connection", zap.Error(err))
		} else {
			i.Logger.Info("Redis connection closed")
		}
	}
}

// Helper functions
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.Atoi(value); err == nil {
			return parsed
		}
	}
	return defaultValue
}

func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if parsed, err := time.ParseDuration(value); err == nil {
			return parsed
		}
	}
	return defaultValue
}