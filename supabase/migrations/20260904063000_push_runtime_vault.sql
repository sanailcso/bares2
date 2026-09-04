begin;

-- The values themselves are provisioned out of band as encrypted Vault secrets:
-- tikitaka_vapid_public, tikitaka_vapid_private,
-- tikitaka_vapid_subject and tikitaka_push_secret.
-- Never add their plaintext values to this migration or to Git.

grant usage on schema private to service_role;

create or replace function public.app_push_runtime_config()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'vapid_public', max(decrypted_secret) filter (where name='tikitaka_vapid_public'),
    'vapid_private', max(decrypted_secret) filter (where name='tikitaka_vapid_private'),
    'vapid_subject', max(decrypted_secret) filter (where name='tikitaka_vapid_subject'),
    'push_secret', max(decrypted_secret) filter (where name='tikitaka_push_secret')
  )
  from vault.decrypted_secrets
  where name in (
    'tikitaka_vapid_public',
    'tikitaka_vapid_private',
    'tikitaka_vapid_subject',
    'tikitaka_push_secret'
  )
$$;

revoke all on function public.app_push_runtime_config()
from public, anon, authenticated;
grant execute on function public.app_push_runtime_config() to service_role;
grant execute on function public.app_admin_check(text) to service_role;

notify pgrst, 'reload schema';
commit;
