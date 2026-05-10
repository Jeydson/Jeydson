#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-8080}"

echo "Iniciando servidor local em http://localhost:${PORT}"
echo "Pressione Ctrl+C para parar."
python3 -m http.server "${PORT}"
