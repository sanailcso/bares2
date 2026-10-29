# Tiki Taka para iPhone

Versión preparada: **1.0.1**, identificador `es.tikitaka.club`. Dominio de la empresa: **tikitaka.es**. Reutiliza la interfaz de la app y el servidor de cuentas y puntos; no crea otra base de datos.

## Entrega para IT

El workflow **iPhone · app para firma y prueba** compila una aplicación Release para iPhone real y entrega **TikiTaka-iPhone-para-firmar.zip** con:

- `TikiTaka.xcarchive`: compilación iPhoneOS arm64 sin firma de distribución.
- `Proyecto-Xcode/ios/App/App.xcodeproj`: proyecto completo con la interfaz incluida, para que IT pueda recompilar si lo exige la firma.
- `LEEME-IT.txt`: instrucciones de firma y TestFlight.
- `BUILD-INFO.json`: versión, compilación, commit, plataforma y hashes del cliente incluido.

**No es una IPA instalable.** La firma y la distribución necesitan el equipo Apple Developer de la empresa. No contiene certificados ni claves privadas, no se sube a Apple automáticamente y no envía invitaciones.

IT puede abrir el archivo en Xcode Organizer y distribuirlo mediante su cuenta. El proyecto incluido no necesita Node para recompilar: Xcode resuelve la dependencia Swift de Capacitor fijada a 8.5.3.

## Funciones incluidas

Interfaz actual, cuentas, puntos, rodillos, ruleta, premios, encuestas y temas. Diseño claro, también cuando el iPhone tiene modo oscuro. Cabecera y controles dentro de la zona segura, recursos locales y refresco autenticado al volver a la app.

**Los avisos nativos/APNs siguen pendientes de integración y configuración Apple.** El botón de avisos web permanece oculto en la app nativa. Los avisos Android no son compatibles directamente con el visor de iOS.

Las publicaciones web posteriores no actualizan los recursos ya instalados dentro de esta app: requieren una nueva compilación y distribución de iOS.

## Comprobaciones automáticas

Empaquetado de recursos públicos, coincidencia del cliente archivado, plataforma iPhoneOS/arm64 y arranque en simulador con apariencia del sistema oscura y clara. Las capturas y registros se conservan como artefactos de la compilación. No se inician sesiones de clientes ni se realizan jugadas reales.

La instalación, los avisos y el funcionamiento completo en un iPhone físico no se consideran probados hasta disponer de una compilación firmada.

## Desarrollo

Node 22 o superior y Xcode 26.2:

```sh
cd native/iphone
npm ci
npm test
npm run prepare:ios
npx cap open ios
```

El proyecto nativo y la web empaquetada se regeneran sin cambiar la web publicada. La firma de producción corresponde al titular de la cuenta empresarial.
