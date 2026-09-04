# Tiki Taka - APK de prueba (TWA sobre GitHub Pages)

Todo esto esta ya rellenado con TUS datos reales:

- Web: `https://sanailcso.github.io/bares2/`
- Repo: `https://github.com/sanailcso/bares2`
- Package ID: `io.github.sanailcso.tikitaka`
- La clave antigua publicada debe considerarse revocada. Genera una nueva
  antes de volver a compilar y actualiza `assetlinks.json` con su huella.

---

## Contenido del paquete

| Fichero | Para que sirve |
| --- | --- |
| `android.keystore` | Clave privada local; nunca se guarda en el repositorio. |
| `twa-manifest.json` | Config de Bubblewrap con tus URLs de GitHub Pages. |
| `assetlinks.json` | Verificación de dominio; añade la huella de la nueva clave antes de publicar el APK. |
| `build-apk.yml` | Workflow de GitHub Actions para compilar el APK en la nube. |
| `build-local.sh` | Script para compilar en tu PC si prefieres. |
| `captura-login-412x915.png` | Captura para la ficha de Play (para mas adelante). |

---

## Via A - Compilar en la nube (recomendada, no instalas nada)

Tu codigo ya esta en GitHub, asi que dejamos que GitHub compile por ti.

### 1. Sube los ficheros al repo `bares2`

```
bares2/
  .github/workflows/build-apk.yml   <- el build-apk.yml de este paquete
  twa/twa-manifest.json             <- el twa-manifest.json de este paquete
  index.html, sw.js, manifest.webmanifest, icons/, img/ ...
```

**No subas `android.keystore` al repo.** Es una clave privada y el repo es
publico. Va como secret, en el paso siguiente.

### 2. Convierte la clave a base64

En tu ordenador, con el `android.keystore` delante:

- **Windows (PowerShell):**
  ```powershell
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("android.keystore")) | Set-Clipboard
  ```
- **Mac o Linux:**
  ```bash
  base64 -w0 android.keystore
  ```

### 3. Crea 3 secrets en el repo

`Settings > Secrets and variables > Actions > New repository secret`

| Nombre | Valor |
| --- | --- |
| `KEYSTORE_BASE64` | el texto largo del paso 2 |
| `KEYSTORE_PASSWORD` | la contraseña robusta elegida al generar la clave |
| `KEY_PASSWORD` | la contraseña robusta elegida al generar la clave |

### 4. Lanza la compilacion

Pestana **Actions** > **Compilar APK** > **Run workflow**. Tarda unos 5 minutos.
Al acabar, en la parte de abajo de la ejecucion aparece el artefacto
`tikitaka-apk`. Descargalo: dentro esta `app-release-signed.apk`.

### 5. Instalalo en tu movil

Pasa el APK al movil y abrelo. Android te pedira permitir la instalacion de
apps de origen desconocido para el explorador de archivos o Chrome. Es normal
al instalar fuera de la Play Store.

---

## Via B - Compilar en tu PC

Necesitas **Node 18+** y **JDK 17**. Despues:

```bash
npm install -g @bubblewrap/cli
```

Y ejecuta `build-local.sh` (o los comandos que contiene, si estas en Windows).
Bubblewrap descargara solo el SDK de Android la primera vez (~500 MB).

---

## MUY IMPORTANTE: la barra de Chrome y el assetlinks

Si instalas el APK tal cual, la app funcionara **pero saldra la barra de
direcciones de Chrome arriba**. Eso pasa porque Android aun no sabe que tu
web te pertenece.

Para quitarla, el fichero `assetlinks.json` tiene que estar accesible en la
**raiz del dominio**, no en la subcarpeta:

```
CORRECTO:   https://sanailcso.github.io/.well-known/assetlinks.json
NO VALE:    https://sanailcso.github.io/bares2/.well-known/assetlinks.json
```

La verificacion es por **origen**, y tu origen es `sanailcso.github.io`, no
`sanailcso.github.io/bares2`. Como GitHub Pages sirve la raiz del usuario desde
un repo con un nombre especial, tienes que hacer esto:

1. Crea un repo publico nuevo llamado **exactamente** `sanailcso.github.io`.
2. Dentro, crea la carpeta `.well-known/` y mete el `assetlinks.json`.
3. Crea tambien un fichero vacio llamado `.nojekyll` en la raiz de ese repo.
   **Sin esto no funciona:** GitHub Pages usa Jekyll por defecto y Jekyll
   ignora las carpetas que empiezan por punto, asi que tu `.well-known` daria
   404 sin dar ninguna pista de por que.
4. Activa Pages en ese repo y espera un par de minutos.

Comprueba que responde abriendo la URL en el navegador. Debe salir el JSON.
Luego **desinstala y reinstala el APK**: la verificacion se hace al instalar.

Si no quieres crear ese repo, la app funciona igual para probar, simplemente
con la barra del navegador visible.

---

## Guarda la clave

La nueva clave `android.keystore` es la identidad de tu app. Si algun dia
publicas en Google Play y luego pierdes ese fichero, no
podras volver a actualizar la app jamas. Copia en un gestor de contrasenas.

Genera siempre una clave nueva con contraseña propia:

```bash
keytool -genkeypair -v -keystore android.keystore -alias tikitaka \
  -keyalg RSA -keysize 2048 -validity 10000
```

Y acuerdate de actualizar la huella en `assetlinks.json` con:

```bash
bubblewrap fingerprint list
```

---

## Los push siguen funcionando

`enableNotifications: true` ya esta puesto, asi que el APK incluye el permiso
`POST_NOTIFICATIONS` de Android 13+ y el servicio de delegacion. Como por
dentro es Chrome, tu Web Push con VAPID funciona igual que en la web, con el
badge monocromo nuevo.

Un detalle: **el permiso de notificaciones no se hereda**. Aunque ya lo
hubieras aceptado en la web, la app instalada te lo volvera a pedir la primera
vez. Es otra instalacion distinta a ojos de Android.
