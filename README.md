# Bernardo OS

Production · Focus · Finance — app unificado para gestão de clientes, conteúdo e finanças.

## Stack
- Next.js 15
- Supabase (auth + database)
- Vercel (deploy)

## Setup

### 1. Instalar dependências
```bash
npm install
```

### 2. Variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
NEXT_PUBLIC_YOUTUBE_API_KEY=sua_key_youtube_aqui
```

### 3. Banco de dados
No painel do Supabase, vá em **SQL Editor** e execute o arquivo `supabase-schema.sql`.

### 4. Rodar localmente
```bash
npm run dev
```

Acesse: http://localhost:3000

## Funcionalidades

- **Dashboard** — visão geral, trending YouTube (6h), metas do mês, captura rápida
- **Focus OS** — todas as tarefas ordenadas por score, pomodoro, XP/streak/níveis
- **Agenda** — semana visual por cliente, deadlines com semáforo
- **Canais Dark** — Kanban de vídeos, banco de ideias, gerador de roteiro (formato Joan Murray)
- **Clientes** — gestão completa, timesheet, link de aprovação
- **Finanças** — notas fiscais, status, totais por cliente/mês
- **Biblioteca** — hooks, títulos, CTAs, thumbnails que funcionaram

## Deploy (Vercel)

1. Push para o GitHub
2. Conectar repositório no Vercel
3. Adicionar as variáveis de ambiente no painel do Vercel
4. Deploy automático a cada push
