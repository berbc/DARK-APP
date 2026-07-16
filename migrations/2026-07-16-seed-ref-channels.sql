-- ============================================================
-- SEED: canais de referência p/ os nichos Explainer e Rise and Fall
-- (aba Canais Dark → Referências → botão "Carregar top 10" usa o channel_id)
-- IDs verificados em 2026-07-16 direto nas páginas dos canais.
-- Idempotente: não duplica se rodar 2x.
-- ============================================================

-- EXPLAINER (referências do próprio estilo do canal)
insert into ref_channels (name, channel_id, url, niche, subscribers, notes)
select 'Fern', 'UCODHrzPMGbNv67e84WDZhQQ', 'https://www.youtube.com/channel/UCODHrzPMGbNv67e84WDZhQQ', 'Explainer', '2.5M',
       'A referência de estilo do canal: documentário dark, mistério primeiro, narração contida.'
where not exists (select 1 from ref_channels where name = 'Fern');

insert into ref_channels (name, channel_id, url, niche, subscribers, notes)
select 'LEMMiNO', 'UCTL8LLKEGXlXqDLVAOLDNnA', 'https://www.youtube.com/channel/UCTL8LLKEGXlXqDLVAOLDNnA', 'Explainer', '5.9M',
       'Documentários de mistério com pesquisa profunda; padrão-ouro de retenção.'
where not exists (select 1 from ref_channels where name = 'LEMMiNO');

insert into ref_channels (name, channel_id, url, niche, subscribers, notes)
select 'RealLifeLore', 'UCP5tjEmvPItGyLhmjdwP7Ww', 'https://www.youtube.com/channel/UCP5tjEmvPItGyLhmjdwP7Ww', 'Explainer', '7.9M',
       'Geografia/geopolítica explicada; títulos e mapas com CTR altíssimo.'
where not exists (select 1 from ref_channels where name = 'RealLifeLore');

insert into ref_channels (name, channel_id, url, niche, subscribers, notes)
select 'Johnny Harris', 'UC7KbIaEOuY7H2j-cvhJ3mYA', 'https://www.youtube.com/channel/UC7KbIaEOuY7H2j-cvhJ3mYA', 'Explainer', '7.8M',
       'Jornalismo visual/explainer; hooks e storytelling de primeira.'
where not exists (select 1 from ref_channels where name = 'Johnny Harris');

-- RISE AND FALL (documentários de negócios)
insert into ref_channels (name, channel_id, url, niche, subscribers, notes)
select 'Company Man', 'UCQMyhrt92_8XM0KgZH6VnRg', 'https://www.youtube.com/channel/UCQMyhrt92_8XM0KgZH6VnRg', 'Rise and Fall', '1.8M',
       'O formato "The Decline of..." — exatamente o sub-nicho validado de marcas legadas.'
where not exists (select 1 from ref_channels where name = 'Company Man');

insert into ref_channels (name, channel_id, url, niche, subscribers, notes)
select 'Bright Sun Films', 'UCHudN_9O_OD5KQIueahpYvg', 'https://www.youtube.com/channel/UCHudN_9O_OD5KQIueahpYvg', 'Rise and Fall', '1.65M',
       'Série "Bankrupt" — falências contadas como documentário cinematográfico.'
where not exists (select 1 from ref_channels where name = 'Bright Sun Films');

insert into ref_channels (name, channel_id, url, niche, subscribers, notes)
select 'MagnatesMedia', 'UCE4Gn00XZbpWvGUfIslT-tA', 'https://www.youtube.com/channel/UCE4Gn00XZbpWvGUfIslT-tA', 'Rise and Fall', '1.86M',
       'Histórias de negócios estilo narrativa de crime; roteiros longos que prendem.'
where not exists (select 1 from ref_channels where name = 'MagnatesMedia');

insert into ref_channels (name, channel_id, url, niche, subscribers, notes)
select 'Modern MBA', 'UCbzVRTkX3bzNZuBd9In4XyA', 'https://www.youtube.com/channel/UCbzVRTkX3bzNZuBd9In4XyA', 'Rise and Fall', '806K',
       'Análises profundas de por que empresas quebram; ótimo p/ ângulos de roteiro.'
where not exists (select 1 from ref_channels where name = 'Modern MBA');
