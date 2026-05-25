#!/bin/sh
set -eu

cat <<EOF >/usr/share/nginx/html/config.js
window.__APP_CONFIG__ = {
  apiUrl: "${VITE_API_URL:-http://localhost:5000}"
};
EOF