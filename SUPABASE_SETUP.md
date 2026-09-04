# Supabase de Tiki Taka Bares

Proyecto actual: `bxyjassnjcyegqnimdsq` (`eu-west-1`).

## Instalación desde cero

1. Crea un proyecto vacío de Supabase.
2. Ejecuta `supabase/migrations/20260903093000_reconstruct_backend.sql`.
3. Establece un PIN administrativo distinto para cada instalación desde el SQL Editor:

```sql
update private.admin_settings
set pin_hash = extensions.crypt(
  'CAMBIA-ESTO-POR-UN-SECRETO-LARGO',
  extensions.gen_salt('bf', 12)
), updated_at = now()
where singleton;
```

4. Sustituye en `index.html` `SB_URL` y `SB_KEY` por la URL y la clave **publishable** del proyecto. Nunca uses una clave `service_role` o secreta en el navegador.

## Modelo de seguridad

- Las tablas están en el esquema no expuesto `private`.
- `anon` tiene únicamente `USAGE` sobre `private` para que los wrappers puedan
  resolver su función interna; no tiene permisos sobre tablas ni secuencias.
- El navegador solo ejecuta wrappers `SECURITY INVOKER` concedidos
  explícitamente en `public`. Las funciones privilegiadas viven en `private`,
  que no está expuesto por la Data API.
- Las operaciones de puntos, ruleta, rachas, cajas, recaudaciones y canjes se resuelven dentro de transacciones PostgreSQL con bloqueo de la fila del jugador.
- Las contraseñas y el PIN se guardan con `bcrypt`; las sesiones caducan a los 30 días y el cierre de sesión elimina el token.
- La configuración pública excluye usuarios, contraseñas y recaudaciones.

Los asesores de seguridad y rendimiento de Supabase deben devolver cero avisos.
Todas las funciones usan `search_path` vacío y relaciones cualificadas por esquema.

## Pruebas rápidas

La instalación incluye únicamente la cuenta local de demostración (`demo` / `demo`). La demo no modifica puntos reales desde la interfaz.

Comprueba que la configuración pública responde:

```sql
begin;
set local role anon;
select public.app_public_config();
rollback;
```

Comprueba que las tablas siguen cerradas al navegador:

```sql
select
  has_schema_privilege('anon', 'private', 'USAGE') as uso_esquema_para_wrappers,
  has_table_privilege('anon', 'private.app_users', 'SELECT') as lectura_usuarios,
  prosecdef as wrapper_privilegiado
from pg_proc
where oid='public.app_login(text,text)'::regprocedure;
```

Los valores esperados son `true`, `false`, `false`.

## Notificaciones push

La función `push` acepta avisos del backoffice validando el PIN en PostgreSQL.
Los recordatorios automáticos y webhooks de canje requieren además el secreto
`PUSH_SECRET` en la cabecera `x-push-secret`. La clave privada VAPID nunca se
guarda en Git.

Secretos obligatorios en Edge Functions:

- `VAPID_PUBLIC`: clave pública que también figura en `index.html`.
- `VAPID_PRIVATE`: clave privada del mismo par.
- `VAPID_SUBJECT`: `https://sanailcso.github.io`.
- `PUSH_SECRET`: valor aleatorio de al menos 32 bytes.

Despliegue: `supabase functions deploy push --no-verify-jwt`. La función tiene
autorización propia porque la aplicación conserva su sistema de sesiones y PIN.

## Economía de puntos

- Rodillos: 20 puntos (96 %), 60 (3 %) o 120 (1 %): media 22,2.
- Ruleta por defecto: retorno medio 94,75 %. Puede perder, recuperar o
  multiplicar la apuesta.
- El servidor rechaza cualquier configuración de ruleta con retorno superior
  a x1, aunque el navegador haya sido manipulado.
