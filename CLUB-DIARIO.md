# Club diario

Esta versión aplica la primera dirección visual a la aplicación existente.

## Organización

- **Inicio:** saldo, objetivo de premio, el juego real y resumen de la racha.
- **Jugar:** los mismos rodillos y ruleta, con su saldo y detalle de racha.
- **Premios:** catálogo, objetivo guardado en este dispositivo y mis canjes.
- **Mi bar:** actividad, ranking y cuenta (contraseña, avisos y cierre de sesión).

El juego se mueve como un único nodo entre Inicio y Jugar; no se clona ni se reinicia. La lógica original de tiradas, resultados, puntos, animaciones, audio, ruleta, caja semanal y peticiones a Supabase permanece en `assets/app.js`. Sus únicas modificaciones son la pantalla inicial y la integración con la navegación. Las tablas, migraciones y funciones de Supabase no han cambiado.

## Archivos

La presentación está en `assets/club.css` y `assets/club.js`. `index.html` contiene la estructura nueva. `sw.js` incluye los archivos y las imágenes nuevas en la caché `tikitaka-club-v92`. El manifiesto PWA usa el nuevo color de fondo. Las tres fotografías iniciales de premios proceden de la demo facilitada. Las ocho imágenes restantes se han generado para este catálogo y se sirven desde `img/club-rewards-sheet.jpg`, con encuadres independientes que conservan las proporciones de cada foto. Las imágenes son ilustrativas; una imagen propia configurada en el catálogo siempre tiene prioridad.

El objetivo se guarda por usuario en localStorage. Solo añade una preferencia visual; no modifica el coste, la disponibilidad ni el proceso de canje. Los datos que muestra Inicio proceden del estado existente de la aplicación.

## Validación

```sh
node --check assets/app.js
node --check assets/club.js
node tests/quality.mjs
```

Para revisar el aspecto sin cuentas reales se ha preparado, fuera de este proyecto, un servidor local de prueba que desactiva Supabase únicamente al servir la vista previa. El código de producción conserva su configuración original de Supabase. No se han ejecutado migraciones ni publicado cambios.
