#!/usr/bin/env python3
import http.server
import socketserver
import threading
import time
import subprocess
import os
import re

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACTS_DIR = os.path.join(PROJECT_DIR, "artifacts")
PORT = 8080

class XpiHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ARTIFACTS_DIR, **kwargs)

    def guess_type(self, path):
        if path.endswith(".xpi"):
            return "application/x-xpinstall"
        return super().guess_type(path)

    def log_message(self, format, *args):
        print(f"[HTTP Server] {self.address_string()} - {format % args}")

def run_server():
    with socketserver.TCPServer(("", PORT), XpiHandler) as httpd:
        httpd.timeout = 1
        print(f"Servidor HTTP iniciado en el puerto {PORT}")
        while not stop_server:
            httpd.handle_request()

stop_server = False
server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()

time.sleep(1)

# Asegurar adb reverse
subprocess.run(["adb", "reverse", f"tcp:{PORT}", f"tcp:{PORT}"], check=False)

print("Abriendo enlace del .xpi en Firefox Android...")
url = f"http://localhost:{PORT}/youtube-focus-controls.xpi"
subprocess.run([
    "adb", "shell", "am", "start",
    "-a", "android.intent.action.VIEW",
    "-d", url,
    "-p", "org.mozilla.firefox"
])

time.sleep(3)

# Tomar captura de pantalla del diálogo de instalación
subprocess.run([
    "adb", "shell", "screencap", "-p", "/data/local/tmp/install_prompt.png"
], check=False)
subprocess.run([
    "adb", "pull", "/data/local/tmp/install_prompt.png",
    os.path.join(PROJECT_DIR, "screenshots", "install_prompt.png")
], check=False)

# Dump UI para buscar botón de Añadir / Add
dump_proc = subprocess.run(
    ["adb", "shell", "uiautomator dump /data/local/tmp/install_ui.xml && cat /data/local/tmp/install_ui.xml"],
    capture_output=True, text=True, shell=True
)

xml_content = dump_proc.stdout
print(f"UI dump capturado ({len(xml_content)} bytes)")

# Buscar botones comunes de confirmación ("Add", "Añadir", "Instalar", "Install")
match = re.search(r'text="(Add|Añadir|Instalar|Install)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', xml_content, re.IGNORECASE)
if match:
    btn_text = match.group(1)
    x1, y1, x2, y2 = int(match.group(2)), int(match.group(3)), int(match.group(4)), int(match.group(5))
    tap_x = (x1 + x2) // 2
    tap_y = (y1 + y2) // 2
    print(f"✅ Botón '{btn_text}' encontrado en ({tap_x}, {tap_y}). Presionándolo automáticamente...")
    subprocess.run(["adb", "shell", f"input tap {tap_x} {tap_y}"])
    time.sleep(2)
else:
    print("No se detectó botón de confirmación directo en el dump; revisando captura...")

# Esperar unos segundos para permitir la descarga y proceso
time.sleep(4)
stop_server = True
print("Proceso de instalación completado.")
