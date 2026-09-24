package app

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type Storage struct {
	mode string
	dir string
	bucket string
	s3 *s3.Client
	presign *s3.PresignClient
}

func OpenStorage(ctx context.Context) (*Storage, error) {
	mode := os.Getenv("STORAGE_MODE")
	if mode == "" { mode = "local" }
	if mode == "local" {
		dir := os.Getenv("STORAGE_DIR")
		if dir == "" { dir = "/tmp/trama-assets" }
		if err := os.MkdirAll(dir, 0700); err != nil { return nil, err }
		return &Storage{mode: mode, dir: dir}, nil
	}
	if mode != "s3" { return nil, fmt.Errorf("unknown STORAGE_MODE %q", mode) }
	endpoint, bucket := os.Getenv("S3_ENDPOINT"), os.Getenv("S3_BUCKET")
	access, secret := os.Getenv("S3_ACCESS_KEY_ID"), os.Getenv("S3_SECRET_ACCESS_KEY")
	if endpoint == "" || bucket == "" || access == "" || secret == "" { return nil, errors.New("S3 endpoint, bucket, and credentials are required") }
	region := os.Getenv("S3_REGION")
	if region == "" { region = "auto" }
	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion(region), config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(access, secret, "")))
	if err != nil { return nil, err }
	s := s3.NewFromConfig(cfg, func(o *s3.Options) { o.BaseEndpoint = aws.String(endpoint); o.UsePathStyle = true })
	return &Storage{mode: mode, bucket: bucket, s3: s, presign: s3.NewPresignClient(s)}, nil
}

func (s *Storage) safePath(key string) (string, error) {
	if strings.Contains(key, "..") || strings.HasPrefix(key, "/") { return "", errors.New("invalid storage key") }
	return filepath.Join(s.dir, filepath.FromSlash(key)), nil
}

func (s *Storage) Put(ctx context.Context, key, contentType string, body io.Reader) error {
	if s.mode == "local" {
		path, err := s.safePath(key)
		if err != nil { return err }
		if err = os.MkdirAll(filepath.Dir(path), 0700); err != nil { return err }
		f, err := os.OpenFile(path, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0600)
		if err != nil { return err }
		_, copyErr := io.Copy(f, body)
		closeErr := f.Close()
		if copyErr != nil { os.Remove(path); return copyErr }
		return closeErr
	}
	_, err := s.s3.PutObject(ctx, &s3.PutObjectInput{Bucket: aws.String(s.bucket), Key: aws.String(key), ContentType: aws.String(contentType), Body: body})
	return err
}

func (s *Storage) Get(ctx context.Context, key string) (io.ReadCloser, error) {
	if s.mode == "local" {
		path, err := s.safePath(key)
		if err != nil { return nil, err }
		return os.Open(path)
	}
	out, err := s.s3.GetObject(ctx, &s3.GetObjectInput{Bucket: aws.String(s.bucket), Key: aws.String(key)})
	if err != nil { return nil, err }
	return out.Body, nil
}

func (s *Storage) PresignGet(ctx context.Context, key string, expiry time.Duration) (string, error) {
	if s.mode != "s3" { return "", errors.New("model access requires S3-compatible storage") }
	out, err := s.presign.PresignGetObject(ctx, &s3.GetObjectInput{Bucket: aws.String(s.bucket), Key: aws.String(key)}, func(o *s3.PresignOptions) { o.Expires = expiry })
	if err != nil { return "", err }
	return out.URL, nil
}
