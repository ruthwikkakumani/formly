#!/bin/sh
set -e
API="${NEXT_PUBLIC_API_URL:-http://localhost:8000/api}"
mkdir -p /app/public
printf 'window.__FORMLY_API__="%s";\n' "$API" > /app/public/runtime-config.js
exec node server.js
