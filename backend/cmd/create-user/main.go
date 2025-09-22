package main

import (
	"fmt"
	"log"

	"github.com/joho/godotenv"
	"go.uber.org/zap"

	"lokr-backend/internal/infrastructure"
	"lokr-backend/internal/services"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found: %v", err)
	}

	// Initialize logger
	logger, err := zap.NewProduction()
	if err != nil {
		log.Fatal("Failed to initialize logger:", err)
	}
	defer logger.Sync()

	// Initialize infrastructure
	infra, err := infrastructure.NewInfrastructure(logger)
	if err != nil {
		logger.Fatal("Failed to initialize infrastructure", zap.Error(err))
	}
	defer infra.Close()

	// Initialize user service
	userService := services.NewUserService(infra.DB)

	// Create demo user
	email := "demo@lokr.com"
	name := "Demo User"
	password := "password123"

	fmt.Printf("Creating demo user: %s\n", email)
	fmt.Printf("Password: %s\n", password)

	// Check if user already exists
	existingUser, err := userService.GetUserByEmail(email)
	if err == nil && existingUser != nil {
		fmt.Println("✅ Demo user already exists!")
		fmt.Printf("   Email: %s\n", existingUser.Email)
		fmt.Printf("   Name: %s\n", existingUser.Name)
		fmt.Printf("   ID: %s\n", existingUser.ID.String())
		return
	}

	// Create new user
	user, err := userService.CreateUser(email, name, password)
	if err != nil {
		logger.Fatal("Failed to create user", zap.Error(err))
	}

	fmt.Println("✅ Demo user created successfully!")
	fmt.Printf("   Email: %s\n", user.Email)
	fmt.Printf("   Name: %s\n", user.Name)
	fmt.Printf("   ID: %s\n", user.ID.String())
	fmt.Println("\n🔑 Login Credentials:")
	fmt.Printf("   Email: %s\n", email)
	fmt.Printf("   Password: %s\n", password)
}