.PHONY: help check-device lint build dev sign push serve

help:
	@echo "Comandos disponibles:"
	@echo "  make check-device   - Verifica la conexión ADB y paquetes Firefox en tu teléfono"
	@echo "  make lint           - Valida la extensión con web-ext lint"
	@echo "  make build          - Empaqueta la extensión en artifacts/"
	@echo "  make dev            - Ejecuta la extensión en Firefox Android en vivo (live-reload)"
	@echo "  make sign           - Firma el paquete .xpi en AMO como 'unlisted' usando tus claves API"
	@echo "  make push           - Copia el archivo .xpi firmado al teléfono (/sdcard/Download/)"
	@echo "  make serve          - Inicia servidor HTTP local para instalar el .xpi en un clic en el móvil"

check-device:
	@bash scripts/check-device.sh

lint:
	@web-ext lint --source-dir=src

build:
	@web-ext build --source-dir=src --artifacts-dir=artifacts --overwrite-dest

dev:
	@bash scripts/dev.sh

sign:
	@bash scripts/sign.sh

push:
	@bash scripts/push.sh

serve:
	@bash scripts/serve.sh
