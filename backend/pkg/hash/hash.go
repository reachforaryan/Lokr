package hash

import (
	"crypto/sha256"
	"fmt"
	"io"
)

// SHA256Hash calculates SHA-256 hash of data
func SHA256Hash(data []byte) string {
	hash := sha256.Sum256(data)
	return fmt.Sprintf("%x", hash)
}

// SHA256HashReader calculates SHA-256 hash from a reader
func SHA256HashReader(reader io.Reader) (string, error) {
	hasher := sha256.New()
	if _, err := io.Copy(hasher, reader); err != nil {
		return "", fmt.Errorf("failed to calculate hash: %w", err)
	}
	return fmt.Sprintf("%x", hasher.Sum(nil)), nil
}

// ValidateHash validates if provided hash matches data
func ValidateHash(data []byte, expectedHash string) bool {
	actualHash := SHA256Hash(data)
	return actualHash == expectedHash
}