# Recuperar los controles de la cuenta demo

1. Abre tu proyecto de Supabase y entra en **SQL Editor → New query**.
2. Copia todo el contenido de [la migración del modo demo](supabase/migrations/20261021130000_restore_demo_controls.sql), pégalo y pulsa **Run**. Es necesario haber aplicado antes la actualización de juegos.
3. Publica esta versión de la web y recarga la aplicación. Si estaba instalada, ciérrala y vuelve a abrirla.
4. Entra como **demo**, abre **Mi bar** y baja hasta **Modo demo · controles de prueba**.

Podrás resetear la tirada de hoy, añadir puntos, avanzar la racha, abrir la caja semanal, activar la ronda dorada, añadir tiradas de ruleta y ver las animaciones de premios. Reiniciar demo pone su progreso a cero; conserva el registro del servidor y los canjes anteriores.

Los cambios se guardan en Supabase y sobreviven a una recarga. El servidor comprueba el token de la cuenta demo: ningún cliente puede usar estos controles sobre su cuenta ni sobre otra. Los clientes conservan el límite de una tirada diaria por cuenta en todos sus dispositivos. Solo la demo puede gastar sus tiradas de ruleta de prueba sin el límite diario de la ruleta.
