#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f "$PROJECT_DIR/.env" ]; then
    # Exportar solo variables válidas
    export $(grep -v '^#' "$PROJECT_DIR/.env" | grep '=' | xargs)
fi

echo "========================================================"
echo " ✍️  Firmando extensión de forma programática (unlisted)"
echo "========================================================"

if [ -z "$AMO_JWT_ISSUER" ] || [ -z "$AMO_JWT_SECRET" ] || [ "$AMO_JWT_ISSUER" = "user:12345678:123" ]; then
    echo "❌ Faltan las credenciales de la API de AMO."
    echo ""
    echo "Pasos para obtenerlas:"
    echo " 1. Inicia sesión en https://addons.mozilla.org/es/developers/addon/api/key/"
    echo " 2. Genera nuevas credenciales (JWT issuer y JWT secret)."
    echo " 3. Crea o edita el archivo .env en la raíz del proyecto:"
    echo "    cp .env.example .env"
    echo "    nano .env"
    echo " 4. Coloca tus valores en AMO_JWT_ISSUER y AMO_JWT_SECRET."
    echo ""
    exit 1
fi

mkdir -p "$PROJECT_DIR/artifacts"

echo "Enviando extensión a AMO para firma automática..."
web-ext sign \
    --source-dir="$PROJECT_DIR/src" \
    --artifacts-dir="$PROJECT_DIR/artifacts" \
    --channel=unlisted \
    --api-key="$AMO_JWT_ISSUER" \
    --api-secret="$AMO_JWT_SECRET"

LATEST_XPI=$(ls -t "$PROJECT_DIR/artifacts"/*.xpi 2>/dev/null | head -n 1 || true)

if [ -n "$LATEST_XPI" ]; then
    echo ""
    echo "========================================================"
    echo "✅ Extensión firmada exitosamente:"
    echo "   $LATEST_XPI"
    echo ""
    echo "Para enviarla a tu celular ejecuta:"
    echo "   npm run push   (o make push)"
    echo "o sírvela por HTTP local ejecutando:"
    echo "   npm run serve  (o make serve)"
    echo "========================================================"
else
    echo "⚠️ La firma finalizó pero no se encontró el archivo .xpi en artifacts."
fi
