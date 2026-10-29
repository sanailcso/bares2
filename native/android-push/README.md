# Android con avisos Web Push

La APK «Tiki Taka Avisos» usa Chrome mediante Trusted Web Activity y el servicio oficial de delegación de notificaciones. Sustituye el enfoque WebView de la APK de prueba: conserva `ServiceWorker`, `Notification` y `PushManager`, y utiliza el backend Web Push que ya emplea el admin. No requiere Firebase nuevo, cambios SQL ni nuevas claves de servidor.

Requisitos: Android 8 o superior, Chrome instalado y actualizado, conexión y permiso de notificaciones. La página y las barras se solicitan explícitamente en modo claro aunque el teléfono esté en modo oscuro.

La cuenta y los envíos se registran mediante los mecanismos existentes: entrar en la app, pulsar **Mi bar → Mi cuenta → Activar mis avisos** y aceptar los permisos. El servicio de delegación oficial muestra los avisos como notificaciones de Android para el dominio verificado. También funcionan con la app en segundo plano; Android puede bloquearlos si el usuario fuerza la detención o deniega permisos.

## Firma y asociación del dominio

El identificador `es.tikitaka.club.avisos` es independiente de las APK antiguas y no requiere desinstalarlas. Firma de desarrollo de esta compilación; no es una entrega de Google Play ni una actualización firmada con las claves antiguas.

La compilación incluye un `assetlinks-entry.json` con la huella pública exacta de la APK generada. Hay que añadir esa entrada sin eliminar otras a **`https://sanailcso.github.io/.well-known/assetlinks.json`** (repositorio `sanailcso.github.io`, no `bares2`). Hasta que se publique y Chrome complete la verificación, se usa una pestaña de Chrome con barra de dirección y los avisos pueden figurar como Chrome. No se omite ni se simula la verificación en la APK.

La compilación de un nuevo certificado exige actualizar esa entrada. Para distribución estable debe usarse la clave corporativa conservada fuera del repositorio.

## Validación

El workflow compila y verifica la firma, genera la huella pública y ejecuta la APK en Android 15 con modo oscuro. Chrome abre el acceso real sin entrar en ninguna cuenta. La prueba comprueba el fondo crema, la disponibilidad de APIs push, crea y elimina una suscripción real solo del emulador y muestra un aviso local mediante el Service Worker con la app en segundo plano. No envía avisos a clientes ni comprueba un envío remoto del admin a una cuenta real. Se conserva el resultado y la captura como artefactos de prueba.

La asociación de dominio y la entrega remota real deben validarse tras publicar el archivo de asociación y activar avisos con un usuario autorizado.
