#!/bin/sh
set -eu

cat > dist/config.js <<EOF
window.__APP_CONFIG__ = {
  apiUrl: "${VITE_API_URL:-http://localhost:5000}"
};
EOF

exec npm run preview -- --host 0.0.0.0 --port "${PORT:-4173}"