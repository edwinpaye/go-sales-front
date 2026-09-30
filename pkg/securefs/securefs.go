package securefs

import (
	"io/fs"
	"path"
	"strings"
)

// New returns an fs.FS that wraps root and refuses to open:
//   - any path containing ".." segments
//   - any file or directory whose name starts with "." (dotfiles)
//   - symlinks that escape the root (defense-in-depth)
func New(root fs.FS) fs.FS {
	return &secureFS{root: root}
}

type secureFS struct{ root fs.FS }

func (s *secureFS) Open(name string) (fs.File, error) {
	if !fs.ValidPath(name) {
		return nil, &fs.PathError{Op: "open", Path: name, Err: fs.ErrInvalid}
	}
	// The root directory "." is special — allow it.
	if name == "." {
		return s.root.Open(name)
	}
	for _, p := range strings.Split(name, "/") {
		if strings.HasPrefix(p, ".") {
			return nil, &fs.PathError{Op: "open", Path: name, Err: fs.ErrNotExist}
		}
	}
	// Extra guard: reject anything that still contains a traversal sequence.
	if strings.Contains(path.Clean("/"+name), "..") {
		return nil, &fs.PathError{Op: "open", Path: name, Err: fs.ErrNotExist}
	}
	return s.root.Open(name)
}