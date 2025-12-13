// server.js
const express = require("express");
const cors = require("cors");
const { randomUUID } = require("crypto"); 

const app = express();
app.use(cors());
app.use(express.json());

// Сховища для ідемпотентності та Rate Limit
const idemStore = new Map(); // Idempotency-Key -> payload
const rate = new Map(); // ip -> {count, ts}
const WINDOW_MS = 10_000, MAX_REQ = 8;
const now = () => Date.now();

// 1. X-Request-Id Middleware
app.use((req, res, next) => {
    const rid = req.get("X-Request-Id") || randomUUID();
    req.rid = rid;
    res.setHeader("X-Request-Id", rid);
    next();
});

// 2. Простий rate-limit із Retry-After Middleware
app.use((req, res, next) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "local";
    const b = rate.get(ip) ?? { count: 0, ts: now() };
    const within = now() - b.ts < WINDOW_MS;
    const state = within ? { count: b.count + 1, ts: b.ts } : { count: 1, ts: now() };
    rate.set(ip, state);
    if (state.count > MAX_REQ) {
        res.setHeader("Retry-After", "2");
        return res.status(429).json({ error: "too_many_requests", requestId: req.rid });
    }
    next();
});

// 3. 🟢 GET /health: ПЕРЕНЕСЕНО СЮДИ
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// 4. 🔴 Injection затримок/збоїв
app.use(async (_req, res, next) => {
    const r = Math.random();
    if (r < 0.15) await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

    if (r > 0.80) {
        const err = Math.random() < 0.5 ? "unavailable" : "unexpected";
        const code = err === "unavailable" ? 503 : 500;
        return res.status(code).json({ error: err, requestId: _req.rid });
    }
    next();
});

// 5. Ідемпотентний POST /orders
app.post("/orders", (req, res) => {
    const key = req.get("Idempotency-Key");
    if (!key) return res.status(400).json({ error: "idempotency_key_required", requestId: req.rid });
    if (idemStore.has(key)) return res.status(201).json({ ...idemStore.get(key), requestId: req.rid });
    const order = { id: "ord_" + randomUUID().slice(0, 8), title: req.body?.title ?? "Untitled" };
    idemStore.set(key, order);
    return res.status(201).json({ ...order, requestId: req.rid });
});

// Запуск сервера
app.listen(8081, () => console.log("server :8081"));