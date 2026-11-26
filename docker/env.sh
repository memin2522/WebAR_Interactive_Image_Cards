#!/bin/sh
# Writes js/config/env.js from environment variables when the container starts.
set -eu
escape() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/'"'"'/\\'"'"'/g'; }
cat > "${APP_ENV_FILE:-/usr/share/nginx/html/js/config/env.js}" <<JS
window.APP_ENV = {
  REGISTER_API_URL: '$(escape "${REGISTER_API_URL:-}")',
  REGISTER_INTERACTIVE_ID: '$(escape "${REGISTER_INTERACTIVE_ID:-interactive-image-cards}")',
};
JS
