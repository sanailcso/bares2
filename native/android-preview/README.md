# Android de prueba con apariencia clara

APK instalable para comprobar Tiki Taka con el modo oscuro del móvil activado.

- Nombre: **Tiki Taka Prueba**. Identificador: `es.tikitaka.club.preview`.
- Android 8.0 o superior. Firma de desarrollo generada por Android; no utiliza la clave de la APK antigua y no reemplaza esa instalación.
- Carga la app publicada en `https://sanailcso.github.io/bares2/index.html`, la URL configurada en el proyecto Android existente. Recibe las futuras publicaciones web al recargar. No cambia la web corporativa `tikitaka.es`.
- Tema nativo claro, `forceDarkAllowed=false`, oscurecimiento de WebView desactivado para Android antiguo y actual. Barras y zonas de seguridad en crema.
- JavaScript, sesión persistente y selector de archivos habilitados. Enlaces externos se abren en navegador. No añade interfaces JavaScript nativas ni cambia el backend.
- Requiere conexión para cargar la web. Las notificaciones push nativas no están implementadas en esta APK de prueba; no sustituye una entrega final para Google Play.

La compilación automática genera una APK firmada instalable, verifica su firma y ejecuta una prueba instrumental en Android 10 y Android 15 con modo oscuro. La prueba abre el acceso real de la web sin iniciar sesión ni modificar cuentas, comprueba colores CSS, ajustes nativos y el color de los píxeles realmente dibujados, y guarda una captura. No emplea las claves ni los secretos de firma antiguos.

El artefacto `tikitaka-android-preview` contiene `TikiTaka-Android-Prueba.apk`, información de compilación y suma SHA-256. Instalar la APK desde Archivos y, si Android lo solicita, permitir instalaciones de esa fuente. Abrir el icono **Tiki Taka Prueba**. No hace falta eliminar la app anterior.

Compilación local: JDK 17, Gradle 8.11.1 y SDK Android 35; copiar `icons/icon-512.png` a `app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` y ejecutar `gradle assembleDebug assembleDebugAndroidTest`.
