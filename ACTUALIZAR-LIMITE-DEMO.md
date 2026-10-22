# Restablecer las tiradas de prueba

Ejecuta en Supabase → SQL Editor el archivo completo `supabase/migrations/20261022160000_restore_demo_roulette_quota.sql`.

Restaura la excepción de la cuenta demo al límite diario de ruleta y conserva el descuento de la apuesta y el abono del premio. La demo sigue necesitando saldo y tiradas. No modifica saldos ni historiales existentes.

Los clientes normales conservan el límite diario configurado por el admin. Tras desplegar el frontend, el aviso distingue ese límite de la falta de tiradas: las tiradas que no se han consumido permanecen en la cuenta.
