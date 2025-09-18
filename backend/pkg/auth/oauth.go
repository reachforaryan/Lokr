package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"os"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	oauth2api "google.golang.org/api/oauth2/v2"
	"google.golang.org/api/option"
)

// GoogleOAuthManager manages Google OAuth flow
type GoogleOAuthManager struct {
	config *oauth2.Config
}

// GoogleUserInfo represents user info from Google
type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Picture       string `json:"picture"`
	Locale        string `json:"locale"`
}

// NewGoogleOAuthManager creates a new Google OAuth manager
func NewGoogleOAuthManager() *GoogleOAuthManager {
	return &GoogleOAuthManager{
		config: &oauth2.Config{
			ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
			ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
			RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
			Scopes: []string{
				"https://www.googleapis.com/auth/userinfo.email",
				"https://www.googleapis.com/auth/userinfo.profile",
			},
			Endpoint: google.Endpoint,
		},
	}
}

// GetAuthURL generates OAuth authorization URL
func (m *GoogleOAuthManager) GetAuthURL(state string) string {
	return m.config.AuthCodeURL(state,
		oauth2.SetAuthURLParam("access_type", "offline"),
		oauth2.SetAuthURLParam("prompt", "consent"),
	)
}

// ExchangeCode exchanges authorization code for tokens
func (m *GoogleOAuthManager) ExchangeCode(ctx context.Context, code string) (*oauth2.Token, error) {
	token, err := m.config.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %w", err)
	}
	return token, nil
}

// GetUserInfo retrieves user information using the access token
func (m *GoogleOAuthManager) GetUserInfo(ctx context.Context, token *oauth2.Token) (*GoogleUserInfo, error) {
	client := m.config.Client(ctx, token)

	oauth2Service, err := oauth2api.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return nil, fmt.Errorf("failed to create oauth2 service: %w", err)
	}

	userInfo, err := oauth2Service.Userinfo.Get().Do()
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}

	verifiedEmail := false
	if userInfo.VerifiedEmail != nil {
		verifiedEmail = *userInfo.VerifiedEmail
	}

	return &GoogleUserInfo{
		ID:            userInfo.Id,
		Email:         userInfo.Email,
		VerifiedEmail: verifiedEmail,
		Name:          userInfo.Name,
		GivenName:     userInfo.GivenName,
		FamilyName:    userInfo.FamilyName,
		Picture:       userInfo.Picture,
		Locale:        userInfo.Locale,
	}, nil
}

// GenerateRandomState generates a random state parameter for OAuth
func GenerateRandomState() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("failed to generate random state: %w", err)
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// ValidateState validates the OAuth state parameter
func ValidateState(expected, received string) bool {
	return expected == received && expected != ""
}