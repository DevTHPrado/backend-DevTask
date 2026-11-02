import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("🌱 Iniciando o seed de dados do Dev Task (dev_task)...");

  // Limpa registros anteriores para garantir consistência usando executeRaw
  await prisma.$executeRawUnsafe('DELETE FROM "_projetos_tarefas";').catch(() => {});
  await prisma.$executeRawUnsafe('DELETE FROM "apontamentos_horas";').catch(() => {});
  await prisma.$executeRawUnsafe('DELETE FROM "tarefas";').catch(() => {});
  await prisma.$executeRawUnsafe('DELETE FROM "colunas";').catch(() => {});
  await prisma.$executeRawUnsafe('DELETE FROM "projetos";').catch(() => {});
  await prisma.$executeRawUnsafe('DELETE FROM "usuarios";').catch(() => {});

  // 0. Criar Usuário padrão
  const devId = "usr_devthprado_" + Date.now();

  await prisma.$executeRawUnsafe(
    `INSERT INTO "usuarios" ("id", "usuario", "nome", "senha", "criado_em", "atualizado_em") VALUES ($1, $2, $3, $4, NOW(), NOW()) ON CONFLICT ("usuario") DO NOTHING;`,
    devId,
    "DevTHPrado",
    "DevTHPrado",
    hashPassword("Sapo1010@")
  );

  console.log("✅ Usuário criado: DevTHPrado (senha: Sapo1010@)");

  // 1. Criar Colunas do Kanban
  const colStandbyId = "col_standby";
  const colInProgressId = "col_inprogress";
  const colFinalizedId = "col_finalized";

  await prisma.$executeRawUnsafe(
    `INSERT INTO "colunas" ("id", "titulo", "cor", "ordem", "e_final", "criado_em", "atualizado_em") VALUES
    ($1, 'Stand-by', '#f59e0b', 0, false, NOW(), NOW()),
    ($2, 'Em Andamento', '#3b82f6', 1, false, NOW(), NOW()),
    ($3, 'Finalizado', '#10b981', 2, true, NOW(), NOW())
    ON CONFLICT ("id") DO NOTHING;`,
    colStandbyId,
    colInProgressId,
    colFinalizedId
  );

  console.log("✅ Colunas criadas: Stand-by, Em Andamento, Finalizado");

  // 2. Criar Projetos
  const p1Id = "proj_core";
  const p2Id = "proj_api";
  const p3Id = "proj_ui";

  await prisma.$executeRawUnsafe(
    `INSERT INTO "projetos" ("id", "nome", "cor", "descricao", "criado_em", "atualizado_em") VALUES
    ($1, 'Dev Task Core', '#3b82f6', 'Desenvolvimento do motor central de Kanban e Timer da aplicação.', NOW(), NOW()),
    ($2, 'API & Performance', '#10b981', 'Otimizações de queries PostgreSQL, Server Actions e caching do Next.js.', NOW(), NOW()),
    ($3, 'Design System & UI', '#8b5cf6', 'Componentes estilizados, glassmorphism e micro-interações.', NOW(), NOW())
    ON CONFLICT ("id") DO NOTHING;`,
    p1Id,
    p2Id,
    p3Id
  );

  console.log("✅ Projetos criados.");

  // 3. Criar Tarefas
  const t1Id = "task_t1";
  const t2Id = "task_t2";
  const t3Id = "task_t3";
  const t4Id = "task_t4";
  const t5Id = "task_t5";
  const t6Id = "task_t6";

  await prisma.$executeRawUnsafe(
    `INSERT INTO "tarefas" ("id", "titulo", "descricao", "status", "ordem", "tecnologias", "coluna_id", "criado_em", "atualizado_em") VALUES
    ($1, 'Adicionar exportação de relatórios em CSV e PDF', 'Permitir ao usuário baixar o resumo do Timesheet em formato tabular para faturamento.', 'Stand-by', 0, ARRAY['TypeScript', 'Next.js', 'Node.js'], $7, NOW(), NOW()),
    ($2, 'Configurar atalhos de teclado (Space para play/stop)', 'Facilitar o início e término rápido de apontamento sem uso do mouse.', 'Stand-by', 1, ARRAY['React', 'TypeScript'], $7, NOW(), NOW()),
    ($3, 'Implementar Drag and Drop fluido entre colunas do Kanban', 'Uso do @hello-pangea/dnd com feedback otimista e sincronização atômica no banco.', 'Em Andamento', 0, ARRAY['React', 'Tailwind CSS'], $8, NOW(), NOW()),
    ($4, 'Testar isolamento de transações para o Timer Singleton', 'Garantir que apenas 1 timeEntry permaneça ativo (endedAt: null) concorrentemente.', 'Em Andamento', 1, ARRAY['PostgreSQL', 'Prisma', 'Node.js'], $8, NOW(), NOW()),
    ($5, 'Criar Schema do Prisma e conexão com PostgreSQL', 'Modelagem das tabelas Project, Task, TimeEntry, Column e User.', 'Finalizado', 0, ARRAY['PostgreSQL', 'Prisma', 'Docker'], $9, NOW(), NOW()),
    ($6, 'Construir Header com Global Timer Bar e Autenticação', 'Interface moderna com Glassmorphism, pulsing indicator e visualização em tempo real.', 'Finalizado', 1, ARRAY['Next.js', 'React', 'Tailwind CSS'], $9, NOW(), NOW())
    ON CONFLICT ("id") DO NOTHING;`,
    t1Id,
    t2Id,
    t3Id,
    t4Id,
    t5Id,
    t6Id,
    colStandbyId,
    colInProgressId,
    colFinalizedId
  );

  // Vincular múltiplos projetos às tarefas
  await prisma.$executeRawUnsafe(
    `INSERT INTO "_projetos_tarefas" ("A", "B") VALUES
    ($1, $4), ($2, $4),
    ($3, $5),
    ($1, $6), ($3, $6),
    ($2, $7),
    ($1, $8), ($2, $8), ($3, $8),
    ($3, $9)
    ON CONFLICT DO NOTHING;`,
    p1Id,
    p2Id,
    p3Id,
    t1Id,
    t2Id,
    t3Id,
    t4Id,
    t5Id,
    t6Id
  );

  console.log("✅ Tarefas e associações multi-projeto criadas.");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
