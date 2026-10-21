# Actualización de tiradas diarias y ruleta

Esta corrección requiere publicar los archivos de la web y aplicar una migración en el proyecto Supabase existente. Subir o fusionar el código en GitHub no ejecuta migraciones SQL.

1. En Supabase, abre el **SQL Editor** del proyecto de la app (`bxyjassnjcyegqnimdsq`). Ejecuta el contenido completo de `supabase/migrations/20261021090000_daily_spin_and_roulette_config.sql`. También se puede aplicar con el flujo habitual de migraciones de Supabase.
2. Integra la solicitud de cambios en GitHub y espera a que termine GitHub Pages. La caché nueva es `tikitaka-club-v94`.
3. Entra al admin y revisa la ruleta. Los multiplicadores admitidos van de x1 a x20; el peso cero oculta una casilla. Los cambios de multiplicadores, pesos, colores y activación se guardan automáticamente. Comprueba el estado de guardado. «Publicar» solo informa de éxito cuando el servidor confirma el guardado.
4. Recarga el cliente. Debe mostrar la ruleta publicada; las sesiones abiertas consultan cambios cada 25 segundos y al volver a la pestaña, sin interrumpir una animación.

La migración conserva el resto de la configuración y las casillas existentes con multiplicadores entre x1 y x20. Retira x0 y x0.5; si no queda una ruleta válida, utiliza la colección inicial de x1, x1.5, x2, x3 y x5. No cambia puntos, cuentas, historial ni el coste de los premios. La ruleta mantiene el comportamiento de sumar el premio sin descontar el nivel de juego; se elimina el antiguo límite de premio medio x1, incompatible con ese comportamiento.

El límite es por cuenta de cliente y fecha de Madrid, compartido entre dispositivos y sesiones. La operación bloquea la fila de ese cliente al comprobar y consumir la tirada: dos solicitudes simultáneas no conceden dos premios.

Con servidor, el usuario demo también usa las RPC de juego y el mismo límite diario que los demás. Solo la vista previa aislada sin Supabase genera resultados locales. Se conserva el token al reanudar sesión, se usa la fecha de Madrid en formato ISO y se bloquea la tirada antes de comenzar su animación.

## Verificación

Los tests JavaScript se ejecutan con `node tests/game-sync.mjs`. GitHub Actions prueba además en una base PostgreSQL desechable el inicio y la reanudación de sesión, la segunda tirada bloqueada, el siguiente día disponible, dos dispositivos simultáneos para una misma cuenta, el guardado del admin, la configuración pública y un giro con premio superior a x1. Las pruebas SQL de `supabase/tests` son exclusivamente para bases de pruebas; `bootstrap.sql` necesita una base vacía. No se deben ejecutar esos fixtures en producción.
