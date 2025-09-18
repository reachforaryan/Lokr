package domain

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestUser_Creation(t *testing.T) {
	user := &User{
		ID:           uuid.New(),
		Email:        "test@example.com",
		Name:         "Test User",
		Role:         RoleUser,
		StorageUsed:  0,
		StorageQuota: 10485760, // 10MB
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if user.Email != "test@example.com" {
		t.Errorf("Expected email to be 'test@example.com', got '%s'", user.Email)
	}

	if user.Role != RoleUser {
		t.Errorf("Expected role to be 'USER', got '%s'", user.Role)
	}

	if user.StorageQuota != 10485760 {
		t.Errorf("Expected storage quota to be 10485760, got %d", user.StorageQuota)
	}
}

func TestCreateUserRequest_Validation(t *testing.T) {
	req := &CreateUserRequest{
		Email:    "test@example.com",
		Name:     "Test User",
		Password: "password123",
	}

	if req.Email == "" {
		t.Error("Email should not be empty")
	}

	if req.Name == "" {
		t.Error("Name should not be empty")
	}

	if req.Password == "" {
		t.Error("Password should not be empty")
	}
}

func TestRole_Constants(t *testing.T) {
	if RoleUser != "USER" {
		t.Errorf("Expected RoleUser to be 'USER', got '%s'", RoleUser)
	}

	if RoleAdmin != "ADMIN" {
		t.Errorf("Expected RoleAdmin to be 'ADMIN', got '%s'", RoleAdmin)
	}
}