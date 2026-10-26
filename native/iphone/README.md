# Tiki Taka para iPhone

Este proyecto reutiliza la interfaz web y el mismo servidor de cuentas y puntos. No crea otra base de datos ni concede puntos sin conexión. El dominio de la empresa es **tikitaka.es**. El identificador provisional de la app es `es.tikitaka.club`; debe confirmarse en la cuenta de Apple antes de publicar.

## Qué prepara automáticamente GitHub

El flujo **iPhone · compilación de prueba** instala las herramientas, empaqueta únicamente los recursos públicos, genera un proyecto Xcode con Capacitor 8.5.3, compila una app de simulador y la abre para capturar la pantalla de acceso. Los recursos se incluyen dentro de la aplicación: no se abre una web remota como pantalla inicial.

Los artefactos incluyen la captura, el proyecto Xcode y una app de simulador. **La app de simulador no se puede instalar en un iPhone físico ni enviar a TestFlight.** No se necesitan certificados para esta primera validación.

## Firma y distribución, siguiente fase

Para instalarla mediante TestFlight hacen falta la cuenta Apple Developer del titular, su acuerdo de Apple, un identificador definitivo, firma y perfil de distribución y una ficha en App Store Connect. No se incluyen claves ni certificados en el repositorio. Las acciones de identificación, aceptación contractual y pago corresponden al titular.

Tras disponer de la cuenta, configurar la firma y compilar un archivo de distribución; probar sesión, servidor, tiradas, premios, audio, teclado, red y cambio de aplicación en un iPhone real antes de subirlo.

## Alcance de esta primera versión

- Misma interfaz, premios y cuentas que la web.
- Cabecera y controles dentro de la zona segura del iPhone.
- Refresco autenticado al volver al primer plano.
- Recursos locales y aviso de falta de conexión.
- Sin mensajes de instalación de Safari ni servicio de caché web.
- El acceso a avisos web se oculta dentro de iPhone hasta integrar notificaciones nativas/APNs. Las notificaciones web y las nativas no son intercambiables.
- No se ha enviado a Apple ni está lista para aprobación de tienda: faltan validación en dispositivo, privacidad y ficha de distribución, y revisar las mecánicas de puntos/ruleta/premios frente a las reglas 4.2 y 5.3. No se presume su clasificación ni aprobación.
- Cualquier error previo de backend debe resolverse antes del lanzamiento.

## Mantenimiento técnico

Con Node 22 o superior y Xcode 26.2 en Mac:

```sh
cd native/iphone
npm ci
npm test
npm run prepare:ios
npx cap open ios
```

El proyecto generado se conserva como artefacto de cada compilación; los fuentes mantenidos aquí son la configuración, el empaquetador y la adaptación nativa. `www` y `ios` se regeneran sin tocar la web publicada.

Documentación: https://capacitorjs.com/docs/getting-started y https://developer.apple.com/app-store/review/guidelines/
