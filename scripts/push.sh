#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f "$PROJECT_DIR/.env" ]; then
    export $(grep -v '^#' "$PROJECT_DIR/.env" | grep '=' | xargs)
fi

echo "========================================================"
echo " 📲 Enviando archivo .xpi al teléfono por ADB"
echo "========================================================"

LATEST_XPI=$(ls -t "$PROJECT_DIR/artifacts"/*.xpi 2>/dev/null | head -n 1 || true)

if [ -z "$LATEST_XPI" ]; then
    echo "❌ No se encontró ningún archivo .xpi firmado en $PROJECT_DIR/artifacts/"
    echo "Ejecuta primero: npm run sign (o make sign)"
    exit 1
fi

XPI_NAME=$(basename "$LATEST_XPI")
TARGET_PATH="/sdcard/Download/$XPI_NAME"

ADB_CMD="adb"
if [ -n "$ANDROID_DEVICE_ID" ]; then
    ADB_CMD="adb -s $ANDROID_DEVICE_ID"
fi

echo "Copiando $XPI_NAME hacia $TARGET_PATH ..."
$ADB_CMD push "$LATEST_XPI" "$TARGET_PATH"

echo ""
echo "✅ Copia completada con éxito."
echo ""
echo "Cómo instalar el .xpi en tu Firefox de Android:"
echo " Opción 1: En tu celular, abre la app 'Archivos' o 'Descargas',"
echo "           toca '$XPI_NAME' y elígelo para abrir con Firefox."
echo ""
echo " Opción 2: Instálalo mediante un servidor local ejecutando:"
echo "           npm run serve"
echo "           (Firefox en Android instalará automáticamente el .xpi firmado al pulsar el enlace)"
echo "========================================================"
