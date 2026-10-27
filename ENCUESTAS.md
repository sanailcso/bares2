# Encuestas del club

## Uso

En el admin, pulsa **Encuestas → Nueva encuesta**. Escribe la pregunta y elige
una respuesta única, varias opciones, una valoración de 1 a 5 o texto libre.
Puedes subir una imagen general y una imagen para cada opción; la aplicación
las comprime y las encuadra sin recortar el objeto. La vista previa muestra el
aspecto de la tarjeta antes de guardarla.

En **¿Quién la recibe?** elige todos los clientes, uno o varios bares o clientes
concretos. El buscador filtra la lista sin perder las selecciones. Los bares se
resuelven según el bar actual de cada cuenta en el servidor; los clientes
concretos se identifican por su usuario, incluso si cambian de bar.

El estado **Borrador** no se muestra a clientes. **Activa** la muestra dentro de
sus fechas. **Cerrada** conserva las respuestas pero no permite participar.
Las fechas se introducen en la hora del dispositivo del administrador y se
guardan como instantes UTC. Usa **Guardar encuesta**: este guardado es
independiente del botón general de publicación de fondos y premios.

El cliente la verá en **Inicio**, solo si es destinatario y aún no ha respondido.
La tarjeta no aparece durante el acceso ni interrumpe una jugada. **Ahora no**
la oculta durante esa sesión y no registra una respuesta. Cuando no quedan
preguntas pendientes, no hay título, tarjeta ni espacio reservado.

**Resultados** muestra participantes, recuentos, porcentajes y respuestas
identificadas por cliente. En selección múltiple los porcentajes se calculan
sobre participantes, por lo que pueden sumar más del 100 %. Las respuestas
individuales se cargan de 50 en 50. La tarjeta informa de que el equipo puede
ver la respuesta; no se presenta como una encuesta anónima.

Una cuenta responde una sola vez, aunque use varios dispositivos o reintente un
envío. Una encuesta con respuestas solo admite cambios en estado y fechas;
para otra pregunta o público, crea una encuesta nueva. No se conceden puntos
por participar en esta versión.

## Despliegue

1. Aplicar por el proceso habitual de migraciones del proyecto:
   `supabase/migrations/20261027120000_customer_surveys.sql`.
2. Publicar los archivos web de esta revisión. El service worker cambia de
   versión e incluye los nuevos JS y CSS. La compilación iPhone también los
   incorpora desde `assets` cuando se vuelva a generar.
3. Verificar una encuesta en borrador y una dirigida a una cuenta de prueba.
   Confirmar desde otra cuenta que no se recibe la pregunta.

La migración debe ejecutarse antes de activar encuestas en producción. Si falta,
el admin informa del error y no simula un guardado; el cliente no muestra tarjetas
vacías. Este cambio de código no ejecuta la migración en producción.

Los destinatarios y respuestas se guardan en tablas privadas con RLS y sin
acceso directo para `anon`/`authenticated`. Las RPC verifican PIN de admin o token
de cliente. Nunca se incluyen encuestas en `app_public_config`, configuración
local, exportaciones públicas ni en el estado de puntos del jugador.

## Verificación

La CI ejecuta `supabase/tests/surveys.sql` sobre PostgreSQL desechable y
`tests/surveys-browser.mjs` en Chromium. Cubre selección individual y por bar,
fechas, tipos de respuesta, control de versiones, reintentos, permisos,
vista previa, imágenes, resultados y ausencia de espacio vacío en móvil.
