package main

import (
	"context"
	"log"

	"github.com/joho/godotenv"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"

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
		log.Fatal("Failed to initialize infrastructure:", err)
	}
	defer infra.Close()

	// Create user service
	userService := services.NewUserService(infra.DB)

	// Create demo user
	email := "demo@lokr.com"
	name := "Demo User"
	password := "demo123"

	log.Printf("Creating demo user: %s", email)
	user, err := userService.CreateUser(email, name, password)
	if err != nil {
		log.Printf("User might already exist or error occurred: %v", err)

		// Try to get existing user
		existingUser, getErr := userService.GetUserByEmail(email)
		if getErr != nil {
			log.Fatal("Failed to get or create user:", err)
		}

		// Update password of existing user
		hashedPassword, hashErr := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if hashErr != nil {
			log.Fatal("Failed to hash password:", hashErr)
		}

		query := `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2`
		_, updateErr := infra.DB.Exec(context.Background(), query, string(hashedPassword), email)
		if updateErr != nil {
			log.Fatal("Failed to update user password:", updateErr)
		}

		log.Printf("Updated existing user password: %s", existingUser.Email)
		return
	}

	log.Printf("Demo user created successfully: %s (ID: %s)", user.Email, user.ID)
}