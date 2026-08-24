const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Простое in-memory key-value хранилище — заменяет window.storage,
// которое доступно только внутри артефактов Claude.ai.
// Данные комнаты живут, пока жив процесс сервера (обычно этого достаточно
// для одной игровой сессии). Раз в час чистим то, что старше 24 часов.
const store = new Map(); // key -> { value, ts }

app.get('/api/kv/get', (req, res) => {
  const key = req.query.key;
  if (!key) return res.status(400).json({ error: 'key required' });
  const entry = store.get(key);
  res.json({ value: entry ? entry.value : null });
});

app.post('/api/kv/set', (req, res) => {
  const { key, value } = req.body || {};
  if (!key) return res.status(400).json({ error: 'key required' });
  store.set(key, { value, ts: Date.now() });
  res.json({ ok: true });
});

setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [k, v] of store.entries()) {
    if (v.ts < cutoff) store.delete(k);
  }
}, 60 * 60 * 1000);

// health-check для Railway
app.get('/healthz', (req, res) => res.send('ok'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ВЫХОД. Найди его вдвоём. — сервер запущен на порту ${PORT}`);
});
