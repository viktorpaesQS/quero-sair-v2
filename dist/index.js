import express from "express";
const app = express();
// Rota de teste
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
});
// Porta pra rodar o servidor
const PORT = 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server rodando na porta ${PORT}`);
});
