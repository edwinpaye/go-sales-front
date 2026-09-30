package middleware

import (
	"compress/gzip"
	"io"
	"net/http"
	"strings"
	"sync"
)

// Compress applies gzip when the client accepts it and the response is compressible.
func Compress() Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
				next.ServeHTTP(w, r)
				return
			}
			gz := gzPool.Get().(*gzip.Writer)
			defer func() {
				gz.Close()
				gzPool.Put(gz)
			}()
			gz.Reset(w)

			w.Header().Set("Content-Encoding", "gzip")
			w.Header().Del("Content-Length") // length is unknown after compression
			next.ServeHTTP(&gzipWriter{ResponseWriter: w, Writer: gz}, r)
		})
	}
}

var gzPool = sync.Pool{
	New: func() any { return gzip.NewWriter(io.Discard) },
}

type gzipWriter struct {
	http.ResponseWriter
	Writer io.Writer
}

func (g *gzipWriter) Write(b []byte) (int, error) {
	return g.Writer.Write(b)
}
func (g *gzipWriter) Unwrap() http.ResponseWriter { return g.ResponseWriter }