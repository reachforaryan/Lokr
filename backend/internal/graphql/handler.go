package graphql

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"lokr-backend/internal/domain"
	"lokr-backend/pkg/auth"
)

type GraphQLRequest struct {
	Query     string                 `json:"query"`
	Variables map[string]interface{} `json:"variables"`
}

type GraphQLResponse struct {
	Data   interface{} `json:"data,omitempty"`
	Errors []GraphQLError `json:"errors,omitempty"`
}

type GraphQLError struct {
	Message string `json:"message"`
	Extensions map[string]interface{} `json:"extensions,omitempty"`
}

type Handler struct {
	resolver   *Resolver
	jwtManager *auth.JWTManager
}

func NewHandler(resolver *Resolver, jwtManager *auth.JWTManager) *Handler {
	return &Handler{
		resolver:   resolver,
		jwtManager: jwtManager,
	}
}

func (h *Handler) ServeHTTP(c *gin.Context) {
	var req GraphQLRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, GraphQLResponse{
			Errors: []GraphQLError{{Message: "Invalid request body"}},
		})
		return
	}

	// Create context with user info if authenticated
	ctx := c.Request.Context()
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
		token := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := h.jwtManager.ValidateToken(token)
		if err == nil {
			ctx = context.WithValue(ctx, "userID", claims.UserID)
			ctx = context.WithValue(ctx, "isAdmin", claims.Role == "ADMIN")
		}
	}

	// Process the GraphQL query
	response := h.processQuery(ctx, req.Query, req.Variables)

	c.JSON(http.StatusOK, response)
}

func (h *Handler) processQuery(ctx context.Context, query string, variables map[string]interface{}) GraphQLResponse {
	// This is a very simplified GraphQL parser/executor
	// In a real implementation, you'd use a proper GraphQL library

	query = strings.TrimSpace(query)

	// Handle introspection queries
	if strings.Contains(query, "__schema") {
		return GraphQLResponse{
			Data: map[string]interface{}{
				"__schema": map[string]interface{}{
					"queryType": map[string]interface{}{
						"name": "Query",
					},
				},
			},
		}
	}

	// Handle mutations
	if strings.HasPrefix(query, "mutation") {
		return h.processMutation(ctx, query, variables)
	}

	// Handle queries
	if strings.HasPrefix(query, "query") || strings.HasPrefix(query, "{") {
		return h.processQueryOperation(ctx, query, variables)
	}

	return GraphQLResponse{
		Errors: []GraphQLError{{Message: "Unsupported operation"}},
	}
}

func (h *Handler) processMutation(ctx context.Context, query string, variables map[string]interface{}) GraphQLResponse {
	// Login mutation
	if strings.Contains(query, "login(") {
		email, ok := variables["email"].(string)
		if !ok {
			return GraphQLResponse{
				Errors: []GraphQLError{{Message: "Email is required"}},
			}
		}
		password, ok := variables["password"].(string)
		if !ok {
			return GraphQLResponse{
				Errors: []GraphQLError{{Message: "Password is required"}},
			}
		}

		result, err := h.resolver.Login(ctx, email, password)
		if err != nil {
			return GraphQLResponse{
				Errors: []GraphQLError{{
					Message: err.Error(),
					Extensions: map[string]interface{}{
						"code": "UNAUTHENTICATED",
					},
				}},
			}
		}

		return GraphQLResponse{
			Data: map[string]interface{}{
				"login": map[string]interface{}{
					"token":        result.Token,
					"refreshToken": result.RefreshToken,
					"user": map[string]interface{}{
						"id":              result.User.ID.String(),
						"email":           result.User.Email,
						"name":            result.User.Name,
						"profileImage":    result.User.ProfileImage,
						"role":            result.User.Role,
						"storageUsed":     result.User.StorageUsed,
						"storageQuota":    result.User.StorageQuota,
						"emailVerified":   result.User.EmailVerified,
						"lastLoginAt":     result.User.LastLoginAt,
						"enterpriseId":    nil,
						"enterpriseRole":  nil,
						"enterprise":      nil,
						"createdAt":       result.User.CreatedAt,
						"updatedAt":       result.User.UpdatedAt,
					},
				},
			},
		}
	}

	// Register mutation
	if strings.Contains(query, "register(") {
		input, ok := variables["input"].(map[string]interface{})
		if !ok {
			return GraphQLResponse{
				Errors: []GraphQLError{{Message: "Input is required"}},
			}
		}

		createUserInput := CreateUserInput{
			Email:    input["email"].(string),
			Name:     input["name"].(string),
			Password: input["password"].(string),
		}

		result, err := h.resolver.Register(ctx, createUserInput)
		if err != nil {
			return GraphQLResponse{
				Errors: []GraphQLError{{Message: err.Error()}},
			}
		}

		return GraphQLResponse{
			Data: map[string]interface{}{
				"register": map[string]interface{}{
					"token":        result.Token,
					"refreshToken": result.RefreshToken,
					"user": map[string]interface{}{
						"id":              result.User.ID.String(),
						"email":           result.User.Email,
						"name":            result.User.Name,
						"profileImage":    result.User.ProfileImage,
						"role":            result.User.Role,
						"storageUsed":     result.User.StorageUsed,
						"storageQuota":    result.User.StorageQuota,
						"emailVerified":   result.User.EmailVerified,
						"lastLoginAt":     result.User.LastLoginAt,
						"enterpriseId":    nil,
						"enterpriseRole":  nil,
						"enterprise":      nil,
						"createdAt":       result.User.CreatedAt,
						"updatedAt":       result.User.UpdatedAt,
					},
				},
			},
		}
	}

	// Upload file mutation
	if strings.Contains(query, "uploadFile(") {
		input, ok := variables["input"].(map[string]interface{})
		if !ok {
			return GraphQLResponse{
				Errors: []GraphQLError{{Message: "Input is required"}},
			}
		}

		fileUploadInput := FileUploadInput{}
		if desc, ok := input["description"].(string); ok {
			fileUploadInput.Description = &desc
		}
		if vis, ok := input["visibility"].(string); ok {
			visibility := domain.FileVisibility(vis)
			fileUploadInput.Visibility = &visibility
		}
		if tags, ok := input["tags"].([]interface{}); ok {
			stringTags := make([]string, len(tags))
			for i, tag := range tags {
				stringTags[i] = tag.(string)
			}
			fileUploadInput.Tags = stringTags
		}

		// For now, we pass nil for the file parameter since we're not handling real file uploads
		result, err := h.resolver.UploadFile(ctx, nil, fileUploadInput)
		if err != nil {
			return GraphQLResponse{
				Errors: []GraphQLError{{Message: err.Error()}},
			}
		}

		return GraphQLResponse{
			Data: map[string]interface{}{
				"uploadFile": map[string]interface{}{
					"id":           result.ID.String(),
					"userId":       result.UserID.String(),
					"folderId":     result.FolderID,
					"filename":     result.Filename,
					"originalName": result.OriginalName,
					"mimeType":     result.MimeType,
					"fileSize":     result.FileSize,
					"contentHash":  result.ContentHash,
					"description":  result.Description,
					"tags":         result.Tags,
					"visibility":   result.Visibility,
					"shareToken":   result.ShareToken,
					"downloadCount": result.DownloadCount,
					"uploadDate":   result.UploadDate,
					"updatedAt":    result.UpdatedAt,
					"folder":       nil,
				},
			},
		}
	}

	// File sharing mutations
	if strings.Contains(query, "createPublicShare(") {
		fileID, ok := variables["fileId"].(string)
		if !ok {
			return GraphQLResponse{
				Errors: []GraphQLError{{Message: "File ID is required"}},
			}
		}

		result, err := h.resolver.CreatePublicShare(ctx, fileID)
		if err != nil {
			return GraphQLResponse{
				Errors: []GraphQLError{{Message: err.Error()}},
			}
		}

		return GraphQLResponse{
			Data: map[string]interface{}{
				"createPublicShare": map[string]interface{}{
					"shareToken": result.ShareToken,
					"shareUrl":   result.ShareURL,
				},
			},
		}
	}

	if strings.Contains(query, "removePublicShare(") {
		fileID, ok := variables["fileId"].(string)
		if !ok {
			return GraphQLResponse{
				Errors: []GraphQLError{{Message: "File ID is required"}},
			}
		}

		result, err := h.resolver.RemovePublicShare(ctx, fileID)
		if err != nil {
			return GraphQLResponse{
				Errors: []GraphQLError{{Message: err.Error()}},
			}
		}

		return GraphQLResponse{
			Data: map[string]interface{}{
				"removePublicShare": result,
			},
		}
	}

	if strings.Contains(query, "shareFileWithUser(") {
		input, ok := variables["input"].(map[string]interface{})
		if !ok {
			return GraphQLResponse{
				Errors: []GraphQLError{{Message: "Input is required"}},
			}
		}

		shareInput := ShareFileInput{
			FileID:           input["fileId"].(string),
			SharedWithUserID: input["sharedWithUserId"].(string),
			PermissionType:   input["permissionType"].(string),
		}

		result, err := h.resolver.ShareFileWithUser(ctx, shareInput)
		if err != nil {
			return GraphQLResponse{
				Errors: []GraphQLError{{Message: err.Error()}},
			}
		}

		return GraphQLResponse{
			Data: map[string]interface{}{
				"shareFileWithUser": map[string]interface{}{
					"id":                result.ID.String(),
					"fileId":            result.FileID.String(),
					"sharedByUserId":    result.SharedByUserID.String(),
					"sharedWithUserId":  result.SharedWithUserID.String(),
					"permissionType":    result.PermissionType,
					"expiresAt":         result.ExpiresAt,
					"lastAccessedAt":    result.LastAccessedAt,
					"accessCount":       result.AccessCount,
					"createdAt":         result.CreatedAt,
					"file":              nil,
					"sharedBy":          nil,
					"sharedWith":        nil,
				},
			},
		}
	}

	if strings.Contains(query, "removeFileShare(") {
		fileID, ok := variables["fileId"].(string)
		if !ok {
			return GraphQLResponse{
				Errors: []GraphQLError{{Message: "File ID is required"}},
			}
		}
		sharedWithUserID, ok := variables["sharedWithUserId"].(string)
		if !ok {
			return GraphQLResponse{
				Errors: []GraphQLError{{Message: "Shared with user ID is required"}},
			}
		}

		result, err := h.resolver.RemoveFileShare(ctx, fileID, sharedWithUserID)
		if err != nil {
			return GraphQLResponse{
				Errors: []GraphQLError{{Message: err.Error()}},
			}
		}

		return GraphQLResponse{
			Data: map[string]interface{}{
				"removeFileShare": result,
			},
		}
	}

	return GraphQLResponse{
		Errors: []GraphQLError{{Message: "Unknown mutation"}},
	}
}

func (h *Handler) processQueryOperation(ctx context.Context, query string, variables map[string]interface{}) GraphQLResponse {
	fmt.Printf("DEBUG: processQueryOperation called with query: %s\n", query)

	// myFiles query (check before "me" since "myFiles" contains "me")
	if strings.Contains(query, "myFiles") {
		var limit, offset *int
		if variables != nil {
			if l, ok := variables["limit"].(float64); ok {
				limitInt := int(l)
				limit = &limitInt
			}
			if o, ok := variables["offset"].(float64); ok {
				offsetInt := int(o)
				offset = &offsetInt
			}
		}

		files, err := h.resolver.GetMyFiles(ctx, limit, offset)
		if err != nil {
			return GraphQLResponse{
				Errors: []GraphQLError{{Message: err.Error()}},
			}
		}

		fileData := make([]map[string]interface{}, len(files))
		for i, file := range files {
			fileData[i] = map[string]interface{}{
				"id":           file.ID.String(),
				"userId":       file.UserID.String(),
				"folderId":     nil,
				"filename":     file.Filename,
				"originalName": file.OriginalName,
				"mimeType":     file.MimeType,
				"fileSize":     file.FileSize,
				"contentHash":  file.ContentHash,
				"description":  file.Description,
				"tags":         file.Tags,
				"visibility":   file.Visibility,
				"shareToken":   file.ShareToken,
				"downloadCount": file.DownloadCount,
				"uploadDate":   file.UploadDate,
				"updatedAt":    file.UpdatedAt,
				"user":         nil,
				"folder":       nil,
			}
		}

		return GraphQLResponse{
			Data: map[string]interface{}{
				"myFiles": fileData,
			},
		}
	}

	// Me query
	if strings.Contains(query, "me {") || (strings.Contains(query, "me") && !strings.Contains(query, "searchUsers") && !strings.Contains(query, "sharedWithMe")) {
		user, err := h.resolver.Me(ctx)
		if err != nil {
			return GraphQLResponse{
				Errors: []GraphQLError{{
					Message: err.Error(),
					Extensions: map[string]interface{}{
						"code": "UNAUTHENTICATED",
					},
				}},
			}
		}

		return GraphQLResponse{
			Data: map[string]interface{}{
				"me": map[string]interface{}{
					"id":              user.ID.String(),
					"email":           user.Email,
					"name":            user.Name,
					"profileImage":    user.ProfileImage,
					"role":            user.Role,
					"storageUsed":     user.StorageUsed,
					"storageQuota":    user.StorageQuota,
					"emailVerified":   user.EmailVerified,
					"lastLoginAt":     user.LastLoginAt,
					"enterpriseId":    nil,
					"enterpriseRole":  nil,
					"enterprise":      nil,
					"createdAt":       user.CreatedAt,
					"updatedAt":       user.UpdatedAt,
				},
			},
		}
	}

	// storageStats query
	if strings.Contains(query, "storageStats") {
		stats, err := h.resolver.GetStorageStats(ctx)
		if err != nil {
			return GraphQLResponse{
				Errors: []GraphQLError{{Message: err.Error()}},
			}
		}

		return GraphQLResponse{
			Data: map[string]interface{}{
				"storageStats": map[string]interface{}{
					"userId":                stats.UserID.String(),
					"totalUsed":            stats.TotalUsed,
					"originalSize":         stats.OriginalSize,
					"savings":              stats.Savings,
					"savingsPercentage":    stats.SavingsPercentage,
					"totalUsedFormatted":   stats.TotalUsedFormatted,
					"originalSizeFormatted": stats.OriginalSizeFormatted,
					"savingsFormatted":     stats.SavingsFormatted,
				},
			},
		}
	}

	// File sharing queries
	if strings.Contains(query, "fileShareInfo") {
		fileID, ok := variables["fileId"].(string)
		if !ok {
			return GraphQLResponse{
				Errors: []GraphQLError{{Message: "File ID is required"}},
			}
		}

		result, err := h.resolver.FileShareInfo(ctx, fileID)
		if err != nil {
			return GraphQLResponse{
				Errors: []GraphQLError{{Message: err.Error()}},
			}
		}

		sharedWithUsers := make([]map[string]interface{}, len(result.SharedWithUsers))
		for i, share := range result.SharedWithUsers {
			sharedWithUsers[i] = map[string]interface{}{
				"id":                   share.ID,
				"shared_with_user_id":  share.SharedWithUserID,
				"permission_type":      share.PermissionType,
				"created_at":           share.CreatedAt,
				"shared_with": map[string]interface{}{
					"id":    share.SharedWith.ID.String(),
					"name":  share.SharedWith.Name,
					"email": share.SharedWith.Email,
				},
			}
		}

		return GraphQLResponse{
			Data: map[string]interface{}{
				"fileShareInfo": map[string]interface{}{
					"isShared":         result.IsShared,
					"shareToken":       result.ShareToken,
					"shareUrl":         result.ShareURL,
					"downloadCount":    result.DownloadCount,
					"sharedWithUsers":  sharedWithUsers,
				},
			},
		}
	}

	if strings.Contains(query, "searchUsers") {
		queryStr, ok := variables["query"].(string)
		if !ok {
			return GraphQLResponse{
				Errors: []GraphQLError{{Message: "Query is required"}},
			}
		}

		var limit *int
		if l, ok := variables["limit"].(float64); ok {
			limitInt := int(l)
			limit = &limitInt
		}

		result, err := h.resolver.SearchUsers(ctx, queryStr, limit)
		if err != nil {
			return GraphQLResponse{
				Errors: []GraphQLError{{Message: err.Error()}},
			}
		}

		users := make([]map[string]interface{}, len(result))
		for i, user := range result {
			users[i] = map[string]interface{}{
				"id":    user.ID.String(),
				"name":  user.Name,
				"email": user.Email,
			}
		}

		return GraphQLResponse{
			Data: map[string]interface{}{
				"searchUsers": users,
			},
		}
	}

	if strings.Contains(query, "sharedWithMe") {
		var limit, offset *int
		if l, ok := variables["limit"].(float64); ok {
			limitInt := int(l)
			limit = &limitInt
		}
		if o, ok := variables["offset"].(float64); ok {
			offsetInt := int(o)
			offset = &offsetInt
		}

		result, err := h.resolver.SharedWithMe(ctx, limit, offset)
		if err != nil {
			return GraphQLResponse{
				Errors: []GraphQLError{{Message: err.Error()}},
			}
		}

		files := make([]map[string]interface{}, len(result))
		for i, file := range result {
			files[i] = map[string]interface{}{
				"id":           file.ID.String(),
				"userId":       file.UserID.String(),
				"folderId":     nil,
				"filename":     file.Filename,
				"originalName": file.OriginalName,
				"mimeType":     file.MimeType,
				"fileSize":     file.FileSize,
				"contentHash":  file.ContentHash,
				"description":  file.Description,
				"tags":         file.Tags,
				"visibility":   file.Visibility,
				"downloadCount": file.DownloadCount,
				"uploadDate":   file.UploadDate,
				"updatedAt":    file.UpdatedAt,
				"user":         nil,
				"folder":       nil,
			}
		}

		return GraphQLResponse{
			Data: map[string]interface{}{
				"sharedWithMe": files,
			},
		}
	}

	return GraphQLResponse{
		Errors: []GraphQLError{{Message: "Unknown query"}},
	}
}