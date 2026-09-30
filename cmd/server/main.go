package main

import (
	"context"
	"errors"
	"fmt"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/yourorg/go-static-server/internal/config"
	"github.com/yourorg/go-static-server/pkg/middleware"
	"github.com/yourorg/go-static-server/pkg/securefs"
	"github.com/yourorg/go-static-server/pkg/static"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "fatal:", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	if err := cfg.Validate(); err != nil {
		return err
	}

	// Structured logger.
	level := slog.LevelInfo
	if cfg.Env == "dev" {
		level = slog.LevelDebug
	}
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level}))
	slog.SetDefault(logger)

	// Build the secure filesystem rooted at STATIC_DIR.
	diskFS := os.DirFS(cfg.StaticDir)
	safeFS := securefs.New(diskFS)

	// Static handler under the sub-path.
	// staticHandler := static.NewHandler(static.Options{
	// 	FS:          safeFS,
	// 	Prefix:      cfg.StaticPath,
	// 	CacheMaxAge: cfg.CacheMaxAge,
	// 	IndexFile:   "index.html",
	// 	StripPrefix: true,
	// })

	// Build the router (Go 1.22+ method-aware patterns).
	mux := http.NewServeMux()

	// Health check.
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, `{"status":"ok","time":%q}`, time.Now().UTC().Format(time.RFC3339))
	})

	// Root redirect / landing.
	mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, cfg.StaticPath+"/", http.StatusFound)
	})

	// Static sub-path: match the prefix and everything beneath it.
	prefix := cfg.StaticPath
	if !strings.HasSuffix(prefix, "/") {
		prefix += "/"
	}

	staticHandler := static.NewHandler(static.Options{
		FS:          safeFS,
		Prefix:      cfg.StaticPath, // without trailing slash for StripPrefix
		CacheMaxAge: cfg.CacheMaxAge,
	})

	mux.Handle("GET "+prefix, staticHandler)
	mux.Handle("HEAD "+prefix, staticHandler)

	// Define allowed origins (use "*" for dev, or specific domains for prod)
	allowedOrigins := []string{"*"} // TODO: Change to "https://yourfrontend.com" in production
	
	// Apply middleware chain.
	handler := middleware.Chain(
		mux,
		middleware.Recovery(logger),
		middleware.Logging(logger),
		middleware.CORS(allowedOrigins),       // <-- Add this BEFORE security headers
		middleware.SecurityHeaders(),
		middleware.Compress(),
	)

	// Server with timeouts.
	srv := &http.Server{
		Addr:              cfg.Addr,
		Handler:           handler,
		ReadTimeout:       cfg.ReadTimeout,
		ReadHeaderTimeout: 3 * time.Second,
		WriteTimeout:      cfg.WriteTimeout,
		IdleTimeout:       cfg.IdleTimeout,
		MaxHeaderBytes:    cfg.MaxHeaderSize,
	}

	// Graceful shutdown.
	idleConnsClosed := make(chan struct{})
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		sig := <-sigCh
		logger.Info("shutdown signal received", "signal", sig.String())

		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		if err := srv.Shutdown(ctx); err != nil {
			logger.Error("shutdown error", "err", err)
		}
		close(idleConnsClosed)
	}()

	logger.Info("starting server",
		"addr", cfg.Addr,
		"static_path", cfg.StaticPath,
		"static_dir", cfg.StaticDir,
		"env", cfg.Env,
	)

	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	<-idleConnsClosed
	logger.Info("server stopped cleanly")
	return nil
}

// Ensure fs.FS is used (keeps import tidy in editors that drop unused).
var _ fs.FS = (*secureFSAdapter)(nil)

type secureFSAdapter struct{}
func (secureFSAdapter) Open(string) (fs.File, error) { return nil, fs.ErrNotExist }