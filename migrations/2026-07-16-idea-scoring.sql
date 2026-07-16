-- Score D/S/V/E/R nas ideias (sistema do higgsfield-explainer). Idempotente.
alter table ideas add column if not exists score_d int;
alter table ideas add column if not exists score_s int;
alter table ideas add column if not exists score_v int;
alter table ideas add column if not exists score_e int;
alter table ideas add column if not exists score_r int;
-- (a coluna `score` já existe e passa a guardar o total 5–25)
