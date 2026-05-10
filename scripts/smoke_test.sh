#!/usr/bin/env bash
set -euo pipefail

echo "[1/4] Sintaxe JS"
node --check app.js

echo "[2/4] IDs essenciais no HTML"
for id in domainSelect modeSelect presetSelect paramContainer simCanvas timeCanvas phaseCanvas frfCanvas theoryText themeBtn dt; do
  rg -q "id=\"${id}\"" index.html || { echo "Faltando id=${id}"; exit 1; }
done

echo "[3/4] Seletores CSS base"
for sel in ".layout" ".panel" "canvas" "body[data-theme=\"dark\"]"; do
  rg -F -q "${sel}" styles.css || { echo "Faltando seletor ${sel}"; exit 1; }
done

echo "[4/4] Funções-chave"
for fn in "function rk4" "function drawFRF" "function renderTheory"; do
  rg -q "${fn}" app.js || { echo "Faltando ${fn}"; exit 1; }
done

echo "OK: smoke test passou."
