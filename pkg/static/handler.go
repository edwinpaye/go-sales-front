package static

import (
	"io"
	"io/fs"
	"net/http"
	"time"
)

// Options configures the static handler.
type Options struct {
	FS          fs.FS         // already wrapped with securefs.New
	Prefix      string        // URL prefix, e.g. "/statics"
	CacheMaxAge time.Duration // Cache-Control max-age
}

// NewHandler returns an http.Handler that serves files from opts.FS under opts.Prefix.
// It relies on http.FileServer for:
//   - automatic index.html serving for directories
//   - ETag / Last-Modified / If-None-Match / Range requests
//   - correct MIME detection
//   - directory → trailing-slash redirects
func NewHandler(opts Options) http.Handler {
	// Strip the URL prefix so FileServer sees clean paths like "/foo.css"
	// which map to "foo.css" in the fs.FS.
	inner := http.StripPrefix(opts.Prefix, http.FileServer(http.FS(opts.FS)))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Only allow safe methods.
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		// Let FileServer do its thing.
		inner.ServeHTTP(w, r)

		// Add cache headers for successful GETs.
		// (We can't easily inspect FileServer's status, but Cache-Control
		// on 404s is harmless — browsers won't cache them aggressively.)
		if r.Method == http.MethodGet {
			w.Header().Set("Cache-Control", "public, max-age="+itoa(int(opts.CacheMaxAge.Seconds())))
			w.Header().Set("Vary", "Accept-Encoding")
		}
	})
}

func itoa(i int) string {
	if i == 0 {
		return "0"
	}
	buf := [20]byte{}
	pos := len(buf)
	for i > 0 {
		pos--
		buf[pos] = byte('0' + i%10)
		i /= 10
	}
	return string(buf[pos:])
}

// Discard is exported for tests.
var Discard io.Writer = io.Discard