# Activar encuestas y corregir la ruleta en producción

La web y la base de datos se actualizan por separado. Fusionar o publicar el
código de la web no ejecuta los archivos SQL de `supabase/migrations`.

Comprobación realizada el 27/10/2026, sin iniciar sesión ni jugar con ninguna
cuenta real: el proyecto `bxyjassnjcyegqnimdsq` devuelve HTTP 404 / PGRST202 para
`app_admin_surveys` y `app_pending_surveys`. Faltan las funciones de encuestas en
el esquema expuesto. La API de ruleta `app_bet` sí existe; una petición de prueba
con token inválido devuelve `auth`, como corresponde. Esto no identifica por sí
solo el error concreto del cliente `test2`.

## Pasos para la persona con acceso a la base de datos

1. Abrir el proyecto `bxyjassnjcyegqnimdsq` en el panel de Supabase y su editor SQL.
2. Aplicar el archivo completo
   `supabase/migrations/20261027120000_customer_surveys.sql`, si todavía no está
   aplicado, mediante el proceso habitual de migraciones. No ejecutar partes
   sueltas: incluye tablas, permisos y funciones.
3. Aplicar el archivo completo
   `supabase/migrations/20261027180000_earned_roulette_credits.sql`.
4. Publicar la revisión web de esta PR y actualizar la app. No compartir
   contraseñas, claves de servicio ni conexiones de base de datos en el chat.

El primer archivo debe ejecutarse una sola vez. Si ya consta aplicado y solo
falta actualizar la caché de la API, ejecutar `notify pgrst, 'reload schema';`.
La nueva migración de ruleta sustituye la función manteniendo firma y permisos;
no añade puntos, no reinicia cuentas ni cambia respuestas o historiales.

La ruleta valida las tiradas ganadas guardadas en `private.players.bet_spins`.
El ajuste heredado `perDay` deja de bloquear esas tiradas. Se conserva el débito
de la apuesta, el premio, el saldo y el consumo de una sola tirada dentro de la
misma transacción y del bloqueo de cuenta. Nunca se juega automáticamente para
comprobar un fallo.

## Comprobación después de aplicar

- En admin → Encuestas → Actualizar ya debe cargar la lista. Guardar primero
  una encuesta en borrador y luego activarla para una sola cuenta de prueba.
- Con `test2`, comprobar su saldo y sus tiradas antes de un giro autorizado por
  el usuario. Si el giro funciona, debe consumir exactamente una tirada y
  registrar un único resultado. No conceder ni borrar tiradas para ocultar el fallo.
- Si vuelve a fallar, la web conserva el código HTTP / código del servidor para
  identificar la causa. Un fallo de conexión no se interpreta como tirada perdida
  o ganada: se consulta el estado confirmado antes de permitir otro intento.
- Verificar que una encuesta dirigida a una cuenta no aparece en las demás y
  que, sin preguntas pendientes, no se muestra ningún bloque vacío.

No se han ejecutado estas migraciones en producción desde esta sesión porque no
hay acceso de administración a la base de datos disponible.
