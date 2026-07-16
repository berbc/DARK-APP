-- ============================================================
-- SEGURANÇA: liga Row Level Security (RLS) em TODAS as tabelas
-- ============================================================
-- Contexto: o app roda no navegador com a chave pública (anon). Sem RLS,
-- qualquer pessoa com essa chave lê/edita/apaga tudo. Este script:
--   1. Liga RLS em todas as tabelas do schema public (inclusive as que não
--      estão no schema.sql do repo — o loop pega o que existir no banco).
--   2. Cria uma política única: acesso total SÓ para usuários LOGADOS.
--      Sem login (role anon) = nenhum acesso.
-- Idempotente: pode rodar mais de uma vez.
--
-- ⚠️ PASSO OBRIGATÓRIO FORA DO SQL: desligar auto-cadastro no painel
-- (Authentication → Sign In/Providers → "Allow new users to sign up" = OFF).
-- Sem isso, um estranho poderia criar conta e virar "usuário logado".
-- O app não tem tela de cadastro, então nada muda pra você.

do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t.tablename);
    execute format('drop policy if exists "authenticated full access" on public.%I', t.tablename);
    execute format(
      'create policy "authenticated full access" on public.%I for all to authenticated using (true) with check (true)',
      t.tablename
    );
  end loop;
end $$;

-- Conferência: todas as linhas devem mostrar rls_ligado = true
-- select tablename, rowsecurity as rls_ligado
-- from pg_tables where schemaname = 'public' order by tablename;
