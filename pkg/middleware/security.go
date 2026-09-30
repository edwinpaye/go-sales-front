package middleware

import (
	"net/http"
	"strings"
)

// SecurityHeaders applies best-practice security headers for an API backend.
// It does NOT restrict external connections.
func SecurityHeaders() Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			h := w.Header()
			
			// 1. Prevent MIME-type sniffing (critical for APIs)
			h.Set("X-Content-Type-Options", "nosniff")
			
			// 2. Prevent clickjacking (harmless for JSON, useful if serving HTML)
			h.Set("X-Frame-Options", "DENY")
			
			// 3. Control referrer information
			h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
			
			// 4. Disable unnecessary browser features
			h.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

			// 5. API-Optimized Content Security Policy
			// 'none' prevents the JSON from being executed as a script/page, 
			// but DOES NOT block external fetch/XHR requests from reaching this API.
			// We explicitly allow 'connect-src *' to guarantee no browser blocks the fetch.
			isAPI := strings.HasPrefix(r.URL.Path, "/api/")
			if isAPI {
				h.Set("Content-Security-Policy", "default-src 'none'; connect-src *; frame-ancestors 'none'")
			} else {
				// For static files (if served by this same server), be slightly more permissive
				h.Set("Content-Security-Policy", "default-src 'self'; connect-src *; img-src 'self' data:; style-src 'self' 'unsafe-inline'")
			}

			next.ServeHTTP(w, r)
		})

	}
}