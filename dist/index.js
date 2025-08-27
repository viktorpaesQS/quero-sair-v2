import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import QRCode from "qrcode";
const app = express();
// --- Segurança & básicos ---
app.use(express.json());
app.set("trust proxy", 1); // necessário no Railway para rate-limit por IP
app.use(helmet());
// CORS: usa variável FRONTEND_ORIGIN, ou * durante testes
const allowlist = (process.env.FRONTEND_ORIGIN ?? "*")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
app.use(cors({ origin: allowlist.length ? allowlist : "*" }));
// Rate limit: 60 req/min por IP
app.use(rateLimit({
    windowMs: 60000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
}));
// --- Config ---
const port = Number(process.env.PORT) || 5000;
// --- Rotas simples ---
app.get("/", (_req, res) => res.send("QUERO SAIR API - OK"));
app.get("/healthz", (_req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));
const activeNotifications = new Map(); // key: plate
// --- Schemas ---
const notifySchema = z.object({
    plate: z.string().min(2).max(12),
    lat: z.number().optional(),
    lng: z.number().optional(),
    note: z.string().max(200).optional(),
});
// POST /api/v1/parking/notify
app.post("/api/v1/parking/notify", (req, res) => {
    const parsed = notifySchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Bad request", issues: parsed.error.issues });
    }
    const data = { ...parsed.data, ts: new Date().toISOString() };
    activeNotifications.set(data.plate.toUpperCase(), data);
    // FUTURO: disparar push (Firebase FCM) para o dono da matrícula
    return res.status(201).json({ ok: true, data });
});
// POST /api/v1/parking/unblock
app.post("/api/v1/parking/unblock", (req, res) => {
    const plate = String(req.body?.plate || "").toUpperCase();
    if (!plate)
        return res.status(400).json({ error: "plate required" });
    const existed = activeNotifications.delete(plate);
    return res.json({ ok: true, plate, existed });
});
// GET /api/v1/qrcode/:plate  -> devolve PNG com o QR que aponta para um URL do QS
app.get("/api/v1/qrcode/:plate", async (req, res) => {
    const plate = String(req.params.plate || "").toUpperCase();
    if (!plate)
        return res.status(400).send("plate required");
    // O QR pode apontar para um link público do QS (futuro front),
    // ou para um deep link do app. Por agora, um URL informativo:
    const payload = `${req.protocol}://${req.get("host")}/api/v1/parking/notify?plate=${encodeURIComponent(plate)}`;
    try {
        const png = await QRCode.toBuffer(payload, { type: "png", margin: 1, scale: 6 });
        res.setHeader("Content-Type", "image/png");
        return res.send(png);
    }
    catch (err) {
        console.error(err);
        return res.status(500).send("QR generation failed");
    }
});
// 404
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
// erro genérico
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
});
// Bind explícito em 0.0.0.0 (bom p/ Railway)
app.listen(port, "0.0.0.0", () => {
    console.log(`Listening on :${port}`);
});
