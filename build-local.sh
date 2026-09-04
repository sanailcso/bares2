#!/usr/bin/env bash
# Compila el APK de Tiki Taka en tu propio ordenador.
# Requisitos previos: Node 18+, JDK 17 y  npm install -g @bubblewrap/cli
#
# Uso:  bash build-local.sh

set -e

MANIFEST_URL="https://sanailcso.github.io/bares2/manifest.webmanifest"
WORKDIR="build-twa"

KEYSTORE_PATH="${ANDROID_KEYSTORE_PATH:-android.keystore}"

if [ ! -f "$KEYSTORE_PATH" ]; then
  echo "ERROR: no encuentro la clave indicada en ANDROID_KEYSTORE_PATH ($KEYSTORE_PATH)."
  exit 1
fi
if [ -z "${BUBBLEWRAP_KEYSTORE_PASSWORD:-}" ] || [ -z "${BUBBLEWRAP_KEY_PASSWORD:-}" ]; then
  echo "ERROR: define BUBBLEWRAP_KEYSTORE_PASSWORD y BUBBLEWRAP_KEY_PASSWORD."
  exit 1
fi

mkdir -p "$WORKDIR"
cp "$KEYSTORE_PATH" "$WORKDIR/android.keystore"
cp twa-manifest.json "$WORKDIR"/
cd "$WORKDIR"

echo "==> Generando el proyecto Android..."
# El twa-manifest.json ya trae todas las respuestas; Enter acepta cada una.
yes '' | bubblewrap init --manifest "$MANIFEST_URL" --directory . --skipPwaValidation || true

# Bubblewrap puede sobrescribir el manifest durante el init: lo restauramos.
cp ../twa-manifest.json ./twa-manifest.json

echo "==> Compilando el APK..."
bubblewrap build --skipPwaValidation

echo
echo "LISTO. Ficheros generados en $WORKDIR/:"
ls -la app-release-signed.apk app-release-bundle.aab 2>/dev/null || ls -la *.apk *.aab 2>/dev/null
echo
echo "Pasa app-release-signed.apk al movil e instalalo."
