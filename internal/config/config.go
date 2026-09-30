package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

type Config struct {
	Addr          string
	StaticPath    string // URL sub-path, e.g. "/statics"
	StaticDir     string // Local disk directory
	ReadTimeout   time.Duration
	WriteTimeout  time.Duration
	IdleTimeout   time.Duration
	MaxHeaderSize int
	CacheMaxAge   time.Duration
	Env           string // "dev" | "prod"
}

func Load() (*Config, error) {
	cacheSec, _ := strconv.Atoi(getenv("CACHE_MAX_AGE_SEC", "86400"))
	return &Config{
		Addr:          getenv("ADDR", ":8081"),
		StaticPath:    getenv("STATIC_PATH", "/statics"),
		StaticDir:     getenv("STATIC_DIR", "./public"),
		ReadTimeout:   durationEnv("READ_TIMEOUT", 5*time.Second),
		WriteTimeout:  durationEnv("WRITE_TIMEOUT", 30*time.Second),
		IdleTimeout:   durationEnv("IDLE_TIMEOUT", 120*time.Second),
		MaxHeaderSize: intEnv("MAX_HEADER_BYTES", 1<<20),
		CacheMaxAge:   time.Duration(cacheSec) * time.Second,
		Env:           getenv("ENV", "prod"),
	}, nil
}

func (c *Config) Validate() error {
	if c.StaticDir == "" {
		return fmt.Errorf("STATIC_DIR is required")
	}
	if c.StaticPath == "" || c.StaticPath[0] != '/' {
		return fmt.Errorf("STATIC_PATH must start with '/'")
	}
	if info, err := os.Stat(c.StaticDir); err != nil {
		return fmt.Errorf("STATIC_DIR %q: %w", c.StaticDir, err)
	} else if !info.IsDir() {
		return fmt.Errorf("STATIC_DIR %q is not a directory", c.StaticDir)
	}
	return nil
}

func getenv(key, def string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return def
}
func durationEnv(key string, def time.Duration) time.Duration {
	if v, ok := os.LookupEnv(key); ok {
		if d, err := time.ParseDuration(v); err == nil {
			return d
		}
	}
	return def
}
func intEnv(key string, def int) int {
	if v, ok := os.LookupEnv(key); ok {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return def
}