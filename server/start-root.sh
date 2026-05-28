#!/bin/sh
set -eu

if [ -d /app/client/dist ]; then
  cat > /app/client/dist/config.js <<'EOF'
window.__APP_CONFIG__ = {
  apiUrl: window.location.origin
};
EOF
fi

exec node server.js