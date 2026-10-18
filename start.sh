#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Ensure dist exists
if [ ! -d "dist" ]; then
  ./node_modules/.bin/vite build
fi

# Stop existing process on 3001 if any
fuser -k 3001/tcp 2>/dev/null || true

# Start background server with Node.js Express server
setsid node server.js > "$DIR/app.log" 2>&1 &
sleep 2

echo "ATELIER Studio started on http://localhost:3001"
