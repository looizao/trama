package app

import (
	"context"
	"strings"
	"testing"
	"time"
)

func TestPasswordAndSessionSecrets(t *testing.T) {
	hash,err:=hashPassword("a strong example password")
	if err!=nil { t.Fatal(err) }
	if strings.Contains(hash,"a strong example password") { t.Fatal("password stored in hash") }
	if !verifyPassword(hash,"a strong example password") { t.Fatal("correct password rejected") }
	if verifyPassword(hash,"wrong password") { t.Fatal("wrong password accepted") }
	first,_,err:=newSessionToken(); if err!=nil { t.Fatal(err) }
	second,_,err:=newSessionToken(); if err!=nil { t.Fatal(err) }
	if first==second { t.Fatal("session token repeated") }
}

func TestModelAssetLinkRejectsTamperingAndExpiry(t *testing.T) {
	t.Setenv("PUBLIC_BASE_URL","https://trama.example")
	t.Setenv("MODEL_ASSET_SECRET","test-secret-that-is-not-used-in-production")
	store:=&Storage{mode:"db"}
	link,err:=store.PresignGet(context.Background(),"org/case/photo.jpg",time.Minute)
	if err!=nil { t.Fatal(err) }
	token:=strings.TrimPrefix(link,"https://trama.example/api/model-assets/")
	key,err:=store.VerifyModelToken(token)
	if err!=nil || key!="org/case/photo.jpg" { t.Fatalf("valid link rejected: %v",err) }
	if _,err=store.VerifyModelToken(token+"x"); err==nil { t.Fatal("tampered link accepted") }
	expired,err:=store.PresignGet(context.Background(),"org/case/photo.jpg",-time.Minute)
	if err!=nil { t.Fatal(err) }
	if _,err=store.VerifyModelToken(strings.TrimPrefix(expired,"https://trama.example/api/model-assets/")); err==nil { t.Fatal("expired link accepted") }
}
