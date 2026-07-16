-- ============================================================
-- Migração: novo workflow de produção + nichos Dark
-- Rode ESTE script no Supabase (SQL Editor) ANTES de dar deploy do código.
-- É idempotente: pode rodar mais de uma vez sem problema.
-- ============================================================

-- 1) NOVAS ETAPAS DO PIPELINE ---------------------------------
-- O pipeline mudou de:
--   Roteiro > Locução > Geração de Imagens > Edição > Thumb e Título > Postagem
-- para:
--   Roteiro > Storyboard > Character Sheets & Cenários > Geração de Imagens > Edição > Thumbnail & Título > Postagem
-- Migra os vídeos que estavam em etapas antigas para as novas (senão o card
-- "some" do kanban, porque a coluna filtra por status === nome-da-etapa).

update videos set status = 'Storyboard'          where status = 'Locução';
update videos set status = 'Thumbnail & Título'  where status = 'Thumb e Título';
-- (A locução continua registrada por vídeo no campo "drive_locuçao"; ela deixou
--  de ser uma coluna do kanban e virou um passo dentro de Edição/produção.)

-- 2) NOVOS CAMPOS POR VÍDEO (Storyboard & Assets) -------------
-- Suportam as etapas Storyboard e Character Sheets & Cenários.
alter table videos add column if not exists storyboard_url   text default '';
alter table videos add column if not exists character_sheets text default '';
alter table videos add column if not exists cenarios         text default '';

-- 3) NOVOS NICHOS PARA CANAIS DARK (dirigem a busca da YouTube API) --
-- A tabela niches só é semeada quando está vazia, então inserimos direto.
-- create table de segurança para setups novos:
create table if not exists niches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  keyword text default '',
  cpm text default '',
  active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

insert into niches (name, keyword, cpm, active, sort_order)
select 'Rise and Fall', 'rise and fall company bankruptcy collapse business', '$8–19', true, 8
where not exists (select 1 from niches where name = 'Rise and Fall');

insert into niches (name, keyword, cpm, active, sort_order)
select 'Explainer', 'how it works explained explainer science', '$6–16', true, 9
where not exists (select 1 from niches where name = 'Explainer');
