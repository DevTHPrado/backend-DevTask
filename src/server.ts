import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

// Habilita trust proxy para ambientes como Google Cloud Run / reverse proxies
app.set("trust proxy", 1);

// Middlewares essenciais
app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requisições sem origin (como mobile apps, Postman) ou da origem configurada
      if (!origin || origin.startsWith("http://localhost:") || origin === CORS_ORIGIN) {
        callback(null, true);
      } else {
        callback(null, true); // Permissivo em dev/prod conforme necessidade
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rotas da API
app.use("/api", apiRouter);

// Root Endpoint de boas-vindas
app.get("/", (_req, res) => {
  res.json({
    message: "🚀 DevTask REST API Online",
    documentation: "/api/health",
    version: "1.0.0",
  });
});

// Middleware Global de Tratamento de Erros
app.use(errorHandler);

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`\n==============================================`);
  console.log(`🚀 DevTask Backend API rodando com sucesso!`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🗄️ DB URL: ${process.env.DATABASE_URL}`);
  console.log(`==============================================\n`);
});

export default app;
