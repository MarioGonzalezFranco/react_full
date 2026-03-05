require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

// ─── Middleware ─────────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://react-full-tiv2.onrender.com"
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ─── Routes ─────────────────────────────────────────────
app.use("/api/auth",       require("./routes/auth"));
app.use("/api/parts",      require("./routes/parts"));
app.use("/api/categories", require("./routes/categories"));

// ─── Health check ───────────────────────────────────────
app.get("/api/health", (req, res) =>
  res.json({ ok: true, service: "AutoPartes API", time: new Date().toISOString() })
);

// ─── 404 ────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ ok: false, message: "Ruta no encontrada" }));

// ─── Error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ ok: false, message: "Error interno del servidor" });
});

// ─── Start ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀  AutoPartes API corriendo en http://localhost:${PORT}`);
  console.log(`📋  Health: http://localhost:${PORT}/api/health\n`);
});