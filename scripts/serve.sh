#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f "$PROJECT_DIR/.env" ]; then
    export $(grep -v '^#' "$PROJECT_DIR/.env" | grep '=' | xargs)
fi

LATEST_XPI=$(ls -t "$PROJECT_DIR/artifacts"/*.xpi 2>/dev/null | head -n 1 || true)

if [ -z "$LATEST_XPI" ]; then
    echo "⚠️ No se encontró ningún .xpi firmado en artifacts/."
    echo "Recuerda ejecutar 'npm run sign' antes para tener el archivo firmado listo."
fi

XPI_NAME=""
if [ -n "$LATEST_XPI" ]; then
    XPI_NAME=$(basename "$LATEST_XPI")
fi

PORT=8080
# Obtener IP local de la máquina en la red LAN o usar port-forwarding con adb
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo "========================================================"
echo " 🌐 Servidor HTTP local para instalación rápida de .xpi"
echo "========================================================"

# Si hay un dispositivo conectado, podemos hacer adb reverse para que localhost:8080 funcione dentro del celular
DEVICES_COUNT=$(adb devices | grep -w "device" | wc -l || true)
if [ "$DEVICES_COUNT" -gt 0 ]; then
    echo "🔌 Configurando 'adb reverse tcp:$PORT tcp:$PORT'..."
    adb reverse "tcp:$PORT" "tcp:$PORT" 2>/dev/null || true
    echo "✅ Enlace directo disponible en el móvil: http://localhost:$PORT/$XPI_NAME"
fi

echo " Enlace LAN: http://$LOCAL_IP:$PORT/$XPI_NAME"
echo ""
echo "📱 Si tu celular está conectado, puedes abrirlo directamente en Firefox con:"
echo "   adb shell am start -a android.intent.action.VIEW -d \"http://localhost:$PORT/$XPI_NAME\""
echo ""
echo "Iniciando servidor HTTP en el puerto $PORT (Presiona Ctrl+C para detener)..."
echo "========================================================"

# Python one-liner HTTP server sirviendo la carpeta artifacts
python3 -c "
import http.server
import socketserver
import os

os.chdir('$PROJECT_DIR/artifacts')
Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update({
    '.xpi': 'application/x-xpinstall',
})

with socketserver.TCPServer(('', $PORT), Handler) as httpd:
    print('Servidor activo en el puerto $PORT...')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nServidor detenido.')
"
