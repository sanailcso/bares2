-- Run only in an empty disposable PostgreSQL database (CI).
create role anon;
create role authenticated;
create role service_role;
create schema extensions;
\ir ../migrations/20260903093000_reconstruct_backend.sql
\ir ../migrations/20260903143000_harden_rewards_push.sql
\ir ../migrations/20260903150000_harden_rpc_surface.sql
\ir ../migrations/20260903152000_validate_game_config.sql
\ir ../migrations/20261021090000_daily_spin_and_roulette_config.sql
