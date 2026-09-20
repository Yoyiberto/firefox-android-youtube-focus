#!/usr/bin/env bash
set -e

echo "========================================================"
echo " 📱 Verificando conexión ADB con dispositivo Android"
echo "========================================================"

if ! command -v adb &> /dev/null; then
    echo "❌ Error: adb no está en el PATH."
    exit 1
fi

DEVICES=$(adb devices | grep -v "List of devices" | grep -v "^$" || true)

if [ -z "$DEVICES" ]; then
    echo "⚠️  No se detectó ningún dispositivo Android conectado por USB."
    echo ""
    echo "Pasos para conectar tu teléfono:"
    echo " 1. Conecta tu celular por cable USB a la computadora."
    echo " 2. En tu celular, ve a: Ajustes -> Opciones de desarrollador."
    echo " 3. Activa 'Depuración por USB' (USB Debugging)."
    echo " 4. Al conectar, revisa la pantalla de tu celular y acepta:"
    echo "    '¿Permitir depuración por USB?' (marca 'Permitir siempre')."
    echo ""
    exit 0
fi

echo "$DEVICES" | while read -r line; do
    DEV_ID=$(echo "$line" | awk '{print $1}')
    DEV_STATUS=$(echo "$line" | awk '{print $2}')

    echo " Dispositivo: $DEV_ID"
    echo " Estado:      $DEV_STATUS"

    if [ "$DEV_STATUS" = "unauthorized" ]; then
        echo ""
        echo " ⚠️  EL DISPOSITIVO ESTÁ NO AUTORIZADO (unauthorized)."
        echo " 👉 Mira la pantalla de tu celular y presiona 'Permitir' en la ventana emergente de depuración USB."
        echo ""
    elif [ "$DEV_STATUS" = "device" ]; then
        MODEL=$(adb -s "$DEV_ID" shell getprop ro.product.model 2>/dev/null | tr -d '\r')
        ANDROID_VER=$(adb -s "$DEV_ID" shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
        echo " Modelo:      $MODEL (Android $ANDROID_VER)"
        echo ""
        echo " 🔍 Buscando navegadores Firefox instalados en el celular..."
        FF_PACKAGES=$(adb -s "$DEV_ID" shell pm list packages 2>/dev/null | grep -i "mozilla" | sed 's/package://' | tr -d '\r' || true)

        if [ -n "$FF_PACKAGES" ]; then
            echo " ✅ Se encontraron los siguientes paquetes de Mozilla:"
            echo "$FF_PACKAGES" | while read -r pkg; do
                echo "    - $pkg"
            done
        else
            echo " ⚠️ No se detectó Firefox instalado en el teléfono."
            echo "   Instala Firefox, Firefox Beta o Firefox Nightly desde Google Play o APK."
        fi
        echo ""
        echo " 💡 Recordatorio de configuración en Firefox Android:"
        echo "   1. Abre Firefox en tu celular -> Ajustes (Settings) -> Acerca de Firefox."
        echo "   2. Toca el logo de Firefox 5 veces seguidas para desbloquear el menú de desarrollador."
        echo "   3. Vuelve a Ajustes -> Menú de depuración (o Ajustes de desarrollador)."
        echo "   4. Activa 'Depuración USB' (Remote debugging via USB)."
    fi
done

echo "========================================================"
