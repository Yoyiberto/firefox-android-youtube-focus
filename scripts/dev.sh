#!/usr/bin/env bash
set -e

# Cargar variables de .env si existe
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -f "$PROJECT_DIR/.env" ]; then
    export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
fi

echo "========================================================"
echo " 🚀 Iniciando modo desarrollo en Firefox para Android"
echo "========================================================"

# Verificar ADB
if ! command -v adb &> /dev/null; then
    echo "❌ Error: adb no está en el PATH."
    exit 1
fi

# Detectar dispositivo
if [ -z "$ANDROID_DEVICE_ID" ]; then
    DEVICES=($(adb devices | grep -w "device" | awk '{print $1}'))
    if [ ${#DEVICES[@]} -eq 0 ]; then
        echo "❌ No hay ningún dispositivo Android conectado y autorizado."
        echo "Ejecuta: npm run check-device para diagnosticar."
        exit 1
    elif [ ${#DEVICES[@]} -eq 1 ]; then
        ANDROID_DEVICE_ID="${DEVICES[0]}"
        echo "📱 Usando dispositivo detectado: $ANDROID_DEVICE_ID"
    else
        echo "⚠️ Se detectaron múltiples dispositivos:"
        printf ' - %s\n' "${DEVICES[@]}"
        echo "Especifica uno en el archivo .env con ANDROID_DEVICE_ID=<id>"
        exit 1
    fi
fi

# Detectar APK de Firefox si no se configuró
if [ -z "$FIREFOX_APK" ]; then
    echo "🔍 Buscando versión de Firefox instalada..."
    CANDIDATES=("org.mozilla.fenix.nightly" "org.mozilla.firefox_beta" "org.mozilla.firefox" "org.mozilla.fenix")
    for cand in "${CANDIDATES[@]}"; do
        if adb -s "$ANDROID_DEVICE_ID" shell pm list packages | grep -q "$cand"; then
            FIREFOX_APK="$cand"
            break
        fi
    done

    if [ -z "$FIREFOX_APK" ]; then
        echo "⚠️ No se detectó automáticamente Firefox en el dispositivo. Usando valor por defecto 'org.mozilla.firefox'."
        FIREFOX_APK="org.mozilla.firefox"
    else
        echo "🦊 Navegador detectado: $FIREFOX_APK"
    fi
else
    echo "🦊 Usando Firefox APK configurado: $FIREFOX_APK"
fi

echo ""
echo "Iniciando web-ext con recarga en vivo (live-reload)..."
echo "Presiona Ctrl+C para detener."
echo "========================================================"

web-ext run \
    --source-dir="$PROJECT_DIR/src" \
    --target=firefox-android \
    --android-device="$ANDROID_DEVICE_ID" \
    --firefox-apk="$FIREFOX_APK"
