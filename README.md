# ⚡ DevTask • Backend REST API

API REST independente de alta performance construída em **Node.js**, **Express**, **TypeScript** e **Prisma ORM** com banco de dados **PostgreSQL**, desenvolvida para gerenciar fluxos Kanban, Timesheet Tracker e controle de demandas.

---

## 🛠️ Tecnologias Utilizadas

- **Runtime:** Node.js 20+
- **Framework Web:** Express.js 4+
- **Linguagem:** TypeScript 5+
- **ORM & Banco:** Prisma ORM 6+ & PostgreSQL
- **Validação de Dados:** Zod
- **Autenticação:** Criptografia Scrypt, HMAC SHA-256 e Cookies HTTP-Only / Bearer Tokens
- **CORS & Cookies:** `cors`, `cookie-parser`

---

## 📂 Estrutura de Pastas

```
backend/
├── prisma/
│   ├── schema.prisma       # Modelagem de dados PostgreSQL
│   └── seed.ts             # Dados iniciais para demonstração
├── src/
│   ├── controllers/        # Controladores das regras de negócio
│   ├── db/                 # Instância singleton do Prisma Client
│   ├── middlewares/        # Middlewares de autenticação, erros e sessões
│   ├── routes/             # Definição e agrupamento de rotas REST (/api)
│   ├── validations/        # Schemas Zod de validação de payloads
│   └── server.ts           # Inicialização e configuração do Express
├── .env.example            # Modelo de variáveis de ambiente
├── .gitignore              # Arquivos ignorados pelo Git
├── package.json            # Dependências e scripts npm
├── tsconfig.json           # Configurações do compilador TypeScript
└── README.md
```

---

## 🚀 Como Executar o Backend Localmente

### 1. Clonar e Instalar Dependências
```bash
cd backend
npm install
```

### 2. Configurar o Arquivo `.env`
Crie um arquivo `.env` na raiz da pasta `backend` com base no `.env.example`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:suasenha@localhost:5432/postgres?schema=public"
SESSION_SECRET="sua-chave-secreta-super-segura"
CORS_ORIGIN="http://localhost:3000"
```

### 3. Sincronizar o Banco de Dados (Prisma)
```bash
npm run prisma:generate
npm run prisma:push
```

### 4. Popular o Banco com Dados Iniciais (Seed)
```bash
npm run seed
```
> **Credenciais criadas no seed:**
> - **Usuário:** `DevTHPrado`
> - **Senha:** `Sapo1010@`

### 5. Iniciar o Servidor em Modo Desenvolvimento
```bash
npm run dev
```
O servidor estará ativo em: **`http://localhost:5000`**

---

## 📡 Endpoints da API

### 🔐 Autenticação (`/api/auth`)
- `POST /api/auth/login` - Autenticar usuário
- `POST /api/auth/register` - Cadastrar novo usuário
- `GET /api/auth/me` - Obter dados do usuário ativo
- `PUT /api/auth/profile` - Atualizar perfil e senha
- `POST /api/auth/logout` - Encerrar sessão

### 📋 Tarefas (`/api/tasks`)
- `GET /api/tasks?projectId=ALL` - Listar tarefas (com filtro opcional por projeto)
- `POST /api/tasks` - Criar nova tarefa
- `PUT /api/tasks/:id` - Atualizar tarefa existente
- `PUT /api/tasks/reorder` - Reordenar tarefas e colunas do Kanban
- `DELETE /api/tasks/:id` - Excluir tarefa

### 📁 Projetos (`/api/projects`)
- `GET /api/projects` - Listar todos os projetos
- `POST /api/projects` - Criar novo projeto
- `PUT /api/projects/:id` - Atualizar projeto
- `DELETE /api/projects/:id` - Excluir projeto

### 📊 Colunas do Kanban (`/api/columns`)
- `GET /api/columns` - Listar colunas
- `POST /api/columns` - Criar nova coluna
- `PUT /api/columns/:id` - Atualizar coluna
- `PUT /api/columns/reorder` - Reordenar colunas
- `DELETE /api/columns/:id` - Excluir coluna

### ⏱️ Timer em Tempo Real (`/api/timer`)
- `GET /api/timer/active` - Obter timer em execução
- `POST /api/timer/start` - Iniciar cronômetro em uma tarefa
- `POST /api/timer/stop` - Parar cronômetro e salvar apontamento

### 📅 Timesheet (`/api/timesheet`)
- `GET /api/timesheet?projectId=ALL` - Histórico de apontamentos de horas
- `DELETE /api/timesheet/:id` - Excluir apontamento

---

## 🐙 Como Subir para o GitHub (Repositório do Backend)

Para enviar apenas esta pasta como um repositório exclusivo no GitHub:

```bash
# 1. Navegue até a pasta do backend
cd backend

# 2. Inicialize o repositório git
git init

# 3. Adicione todos os arquivos
git add .

# 4. Crie o primeiro commit
git commit -m "feat: initial commit for DevTask Backend API"

# 5. Renomeie a branch para main (se necessário)
git branch -M main

# 6. Conecte ao seu repositório remoto no GitHub
git remote add origin https://github.com/SEU_USUARIO/devtask-backend.git

# 7. Envie os arquivos
git push -u origin main
```
