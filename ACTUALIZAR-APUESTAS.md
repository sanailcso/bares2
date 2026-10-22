# Actualizar el saldo de la ruleta

1. Antes de desplegar el nuevo frontend, abre Supabase → SQL Editor → New query.
2. Copia y ejecuta el contenido completo de `supabase/migrations/20261022150000_roulette_spend_and_payout.sql`.
3. Fusiona la PR y espera el despliegue de GitHub Pages. Cierra y abre la app.

Con saldo 1.000 y apuesta 300: se muestran 700 durante el giro; a ×1 termina en 1.000, a ×1,5 en 1.150 y a ×2 en 1.300. El premio es apuesta × multiplicador y el historial registra premio − apuesta.

Supabase comprueba el saldo y realiza el descuento y abono en una sola transacción con bloqueo de la cuenta, también entre dispositivos. Una apuesta rechazada no consume puntos ni tiradas. Se conservan los multiplicadores del admin, los límites diarios y las tiradas ganadas. No modifica saldos ni historiales anteriores.
