package app

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	gcs "cloud.google.com/go/storage"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"golang.org/x/oauth2"
	"google.golang.org/api/iamcredentials/v1"
	"google.golang.org/api/option"
)

type Storage struct {
	mode     string
	dir      string
	bucket   string
	s3       *s3.Client
	presign  *s3.PresignClient
	gcs      *gcs.Client
	signer   *iamcredentials.Service
	signerID string
	db       *sql.DB
}

func OpenStorage(ctx context.Context, db *sql.DB) (*Storage, error) {
	mode := os.Getenv("STORAGE_MODE")
	if mode == "" {
		mode = "db"
	}
	if mode == "db" {
		return &Storage{mode: mode, db: db}, nil
	}
	if mode == "local" {
		dir := os.Getenv("STORAGE_DIR")
		if dir == "" {
			dir = "/tmp/trama-assets"
		}
		if err := os.MkdirAll(dir, 0700); err != nil {
			return nil, err
		}
		return &Storage{mode: mode, dir: dir}, nil
	}
	if mode == "gcs" {
		bucket := strings.TrimSpace(os.Getenv("GCS_BUCKET"))
		signerID := strings.TrimSpace(os.Getenv("GCS_SIGNING_SERVICE_ACCOUNT"))
		if bucket == "" || signerID == "" {
			return nil, errors.New("GCS_BUCKET and GCS_SIGNING_SERVICE_ACCOUNT are required")
		}
		var options []option.ClientOption
		if token := strings.TrimSpace(os.Getenv("GOOGLE_OAUTH_ACCESS_TOKEN")); token != "" {
			options = append(options, option.WithTokenSource(oauth2.StaticTokenSource(&oauth2.Token{AccessToken: token})))
		}
		client, err := gcs.NewClient(ctx, options...)
		if err != nil {
			return nil, err
		}
		signer, err := iamcredentials.NewService(ctx, options...)
		if err != nil {
			client.Close()
			return nil, err
		}
		return &Storage{mode: mode, bucket: bucket, gcs: client, signer: signer, signerID: signerID}, nil
	}
	if mode != "s3" {
		return nil, fmt.Errorf("unknown STORAGE_MODE %q", mode)
	}
	endpoint, bucket := os.Getenv("S3_ENDPOINT"), os.Getenv("S3_BUCKET")
	access, secret := os.Getenv("S3_ACCESS_KEY_ID"), os.Getenv("S3_SECRET_ACCESS_KEY")
	if endpoint == "" || bucket == "" || access == "" || secret == "" {
		return nil, errors.New("S3 endpoint, bucket, and credentials are required")
	}
	region := os.Getenv("S3_REGION")
	if region == "" {
		region = "auto"
	}
	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion(region), config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(access, secret, "")))
	if err != nil {
		return nil, err
	}
	usePathStyle := os.Getenv("S3_PATH_STYLE") != "false"
	s := s3.NewFromConfig(cfg, func(o *s3.Options) { o.BaseEndpoint = aws.String(endpoint); o.UsePathStyle = usePathStyle })
	return &Storage{mode: mode, bucket: bucket, s3: s, presign: s3.NewPresignClient(s)}, nil
}

func (s *Storage) Close() {
	if s.gcs != nil {
		_ = s.gcs.Close()
	}
}

func (s *Storage) safePath(key string) (string, error) {
	if strings.Contains(key, "..") || strings.HasPrefix(key, "/") {
		return "", errors.New("invalid storage key")
	}
	return filepath.Join(s.dir, filepath.FromSlash(key)), nil
}

func (s *Storage) Put(ctx context.Context, key, contentType string, body io.Reader) error {
	if s.mode == "db" {
		data, err := io.ReadAll(io.LimitReader(body, (20<<20)+1))
		if err != nil {
			return err
		}
		if len(data) > 20<<20 {
			return errors.New("image too large for prototype storage")
		}
		_, err = s.db.ExecContext(ctx, "INSERT INTO storage_objects(key,content_type,data) VALUES($1,$2,$3) ON CONFLICT(key) DO NOTHING", key, contentType, data)
		return err
	}
	if s.mode == "local" {
		path, err := s.safePath(key)
		if err != nil {
			return err
		}
		if err = os.MkdirAll(filepath.Dir(path), 0700); err != nil {
			return err
		}
		f, err := os.OpenFile(path, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0600)
		if err != nil {
			return err
		}
		_, copyErr := io.Copy(f, body)
		closeErr := f.Close()
		if copyErr != nil {
			os.Remove(path)
			return copyErr
		}
		return closeErr
	}
	if s.mode == "gcs" {
		writer := s.gcs.Bucket(s.bucket).Object(key).NewWriter(ctx)
		writer.ContentType = contentType
		_, copyErr := io.Copy(writer, body)
		closeErr := writer.Close()
		if copyErr != nil {
			return copyErr
		}
		return closeErr
	}
	_, err := s.s3.PutObject(ctx, &s3.PutObjectInput{Bucket: aws.String(s.bucket), Key: aws.String(key), ContentType: aws.String(contentType), Body: body})
	return err
}

func (s *Storage) Get(ctx context.Context, key string) (io.ReadCloser, error) {
	if s.mode == "db" {
		var data []byte
		if err := s.db.QueryRowContext(ctx, "SELECT data FROM storage_objects WHERE key=$1", key).Scan(&data); err != nil {
			return nil, err
		}
		return io.NopCloser(bytes.NewReader(data)), nil
	}
	if s.mode == "local" {
		path, err := s.safePath(key)
		if err != nil {
			return nil, err
		}
		return os.Open(path)
	}
	if s.mode == "gcs" {
		return s.gcs.Bucket(s.bucket).Object(key).NewReader(ctx)
	}
	out, err := s.s3.GetObject(ctx, &s3.GetObjectInput{Bucket: aws.String(s.bucket), Key: aws.String(key)})
	if err != nil {
		return nil, err
	}
	return out.Body, nil
}

func (s *Storage) PresignGet(ctx context.Context, key string, expiry time.Duration) (string, error) {
	if s.mode == "db" {
		base := os.Getenv("PUBLIC_BASE_URL")
		secret := os.Getenv("MODEL_ASSET_SECRET")
		if base == "" || secret == "" {
			return "", errors.New("PUBLIC_BASE_URL and MODEL_ASSET_SECRET are required for model access")
		}
		payload := make([]byte, 8+len(key))
		binary.BigEndian.PutUint64(payload[:8], uint64(time.Now().Add(expiry).Unix()))
		copy(payload[8:], key)
		mac := hmac.New(sha256.New, []byte(secret))
		mac.Write(payload)
		token := base64.RawURLEncoding.EncodeToString(payload) + "." + base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
		return strings.TrimSuffix(base, "/") + "/api/model-assets/" + url.PathEscape(token), nil
	}
	if s.mode == "gcs" {
		return gcs.SignedURL(s.bucket, key, &gcs.SignedURLOptions{
			Scheme:         gcs.SigningSchemeV4,
			Method:         "GET",
			Expires:        time.Now().Add(expiry),
			GoogleAccessID: s.signerID,
			SignBytes: func(payload []byte) ([]byte, error) {
				response, err := s.signer.Projects.ServiceAccounts.SignBlob(
					"projects/-/serviceAccounts/"+s.signerID,
					&iamcredentials.SignBlobRequest{Payload: base64.StdEncoding.EncodeToString(payload)},
				).Context(ctx).Do()
				if err != nil {
					return nil, err
				}
				return base64.StdEncoding.DecodeString(response.SignedBlob)
			},
		})
	}
	if s.mode != "s3" {
		return "", errors.New("model access requires durable storage")
	}
	out, err := s.presign.PresignGetObject(ctx, &s3.GetObjectInput{Bucket: aws.String(s.bucket), Key: aws.String(key)}, func(o *s3.PresignOptions) { o.Expires = expiry })
	if err != nil {
		return "", err
	}
	return out.URL, nil
}

func (s *Storage) VerifyModelToken(token string) (string, error) {
	if s.mode != "db" {
		return "", errors.New("invalid storage mode")
	}
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return "", errors.New("invalid token")
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil || len(payload) < 9 {
		return "", errors.New("invalid token")
	}
	signature, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return "", errors.New("invalid token")
	}
	mac := hmac.New(sha256.New, []byte(os.Getenv("MODEL_ASSET_SECRET")))
	mac.Write(payload)
	if !hmac.Equal(signature, mac.Sum(nil)) || time.Now().Unix() > int64(binary.BigEndian.Uint64(payload[:8])) {
		return "", errors.New("expired or invalid token")
	}
	return string(payload[8:]), nil
}
