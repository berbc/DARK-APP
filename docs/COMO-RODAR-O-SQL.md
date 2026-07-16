# Como rodar o SQL no Supabase (passo a passo bem simples)

Pensa no Supabase como o "caderno" onde o app guarda tudo. Rodar um SQL é só colar
um textinho de instruções nesse caderno e apertar um botão. Você não quebra nada:
os scripts daqui podem ser rodados de novo sem problema.

## Onde clicar

1. Abra **https://supabase.com** e faça login.
2. Clique no seu projeto (o do DARK-APP).
3. No menu da esquerda, clique em **SQL Editor** (ícone de banco de dados / `</>`).
4. Clique em **+ New query** (novo).
5. Abra o arquivo `.sql` aqui do repositório, **copie tudo** e **cole** na caixa branca.
6. Clique no botão verde **Run** (ou aperte `Ctrl/Cmd + Enter`).
7. Se aparecer **"Success"** embaixo, deu certo. Fim. ✅

## A ordem certa (importante)

Para esta atualização, rode **nesta ordem**:

1. Primeiro: `migrations/2026-07-15-pipeline-workflow.sql`
   → arruma as etapas e cria os campos novos. **Rode ANTES de dar deploy do código.**
2. Depois (opcional, quando quiser): `migrations/2026-07-15-seed-metas.sql`
   → coloca as metas (curto/médio/longo prazo) na aba Metas.

## Se algo der errado

- Mensagem vermelha? Copie o texto do erro e me manda — eu conserto.
- Rodou duas vezes sem querer? Tudo bem, os scripts foram feitos pra não duplicar nada.
- Nada aconteceu no app? Provavelmente falta o **deploy** do código novo (Vercel) —
  o SQL prepara o caderno, o deploy publica o app que usa o caderno.
