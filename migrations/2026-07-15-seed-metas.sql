-- ============================================================
-- Metas: conserta a tabela `goals` + semeia as metas do planejamento
-- Roda no SQL Editor do Supabase. Idempotente (pode rodar 2x sem duplicar).
--
-- POR QUE A PARTE 1 EXISTE: a tabela `goals` foi migrada pela metade — o app
-- (saveGoal) grava `notes`, `youtube_channel_id` e lê `completed`, mas essas
-- colunas não existiam no banco. Resultado: criar meta pela tela do app quebrava
-- com "column notes of relation goals does not exist". A parte 1 conserta isso.
-- ============================================================

-- 1) GARANTE AS COLUNAS QUE O APP USA -------------------------
-- `add column if not exists` só cria o que estiver faltando; não mexe no resto.
alter table goals add column if not exists title              text;
alter table goals add column if not exists type               text    default 'personalizada';
alter table goals add column if not exists horizon            text    default 'curto';
alter table goals add column if not exists target_value       numeric default 0;
alter table goals add column if not exists current_value      numeric default 0;
alter table goals add column if not exists target_date        date;
alter table goals add column if not exists notes              text    default '';
alter table goals add column if not exists youtube_channel_id text;
alter table goals add column if not exists completed          boolean default false;

-- A coluna antiga `month` era NOT NULL sem default (schema legado). Se ainda
-- existir, tira a obrigatoriedade — senão qualquer insert novo falha.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'goals' and column_name = 'month'
  ) then
    execute 'alter table goals alter column month drop not null';
  end if;
end $$;

-- 2) SEED — metas do planejamento -----------------------------

-- CURTO PRAZO (agora → set/2026): tirar do zero e manter cadência
insert into goals (title, type, horizon, target_value, current_value, target_date, notes)
select 'Waldemar: 4 vídeos/mês', 'videos_mes', 'curto', 4, 0, '2026-09-30',
       'Começar pelo Zico (áudio+storyboards prontos); depois Adriano, Vini, Financeiro.'
where not exists (select 1 from goals where title = 'Waldemar: 4 vídeos/mês');

insert into goals (title, type, horizon, target_value, current_value, target_date, notes)
select 'Faceless/Dark: 12 Shorts/mês', 'videos_mes', 'curto', 12, 0, '2026-09-30',
       'Funil invertido: Short testa o tema antes do longo. Sair do zero.'
where not exists (select 1 from goals where title = 'Faceless/Dark: 12 Shorts/mês');

-- MÉDIO PRAZO (out → dez/2026): monetizar o Faceless, crescer o Waldemar
insert into goals (title, type, horizon, target_value, current_value, target_date, notes)
select 'Faceless/Dark: 1.000 inscritos (YPP)', 'seguidores', 'medio', 1000, 0, '2026-12-31',
       'Requisito do YouTube Partner Program: 1.000 inscritos + 4.000h (ou 10M views de Shorts/90 dias).'
where not exists (select 1 from goals where title = 'Faceless/Dark: 1.000 inscritos (YPP)');

insert into goals (title, type, horizon, target_value, current_value, target_date, notes)
select 'Waldemar: 15.000 inscritos', 'seguidores', 'medio', 15000, 8000, '2026-12-31',
       'Já monetizado (~8k). Crescer a base com cadência semanal.'
where not exists (select 1 from goals where title = 'Waldemar: 15.000 inscritos');

insert into goals (title, type, horizon, target_value, current_value, target_date, notes)
select 'Renda de conteúdo: R$ 2.000/mês', 'faturamento_mes', 'medio', 2000, 0, '2026-12-31',
       'AdSense (quando elegível) + afiliados. Caixa rápido no curto prazo vem dos serviços.'
where not exists (select 1 from goals where title = 'Renda de conteúdo: R$ 2.000/mês');

-- LONGO PRAZO (2027): escala
insert into goals (title, type, horizon, target_value, current_value, target_date, notes)
select 'Faceless/Dark: 50.000 inscritos', 'seguidores', 'longo', 50000, 0, '2027-06-30',
       'Dobrar nas linhas (ciência/rise-and-fall/crime) que mais retêm, decidido por dados.'
where not exists (select 1 from goals where title = 'Faceless/Dark: 50.000 inscritos');

insert into goals (title, type, horizon, target_value, current_value, target_date, notes)
select 'Renda de conteúdo: R$ 10.000/mês', 'faturamento_mes', 'longo', 10000, 0, '2027-12-31',
       'Dois canais rodando + afiliados/produto. YouTube é ativo de médio-longo prazo.'
where not exists (select 1 from goals where title = 'Renda de conteúdo: R$ 10.000/mês');
