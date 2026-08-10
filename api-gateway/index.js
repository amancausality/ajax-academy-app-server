const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

const routes = {
  '/auth': 'http://identity-service:5001',
  '/courses': 'http://course-service:5002',
  '/enrollments': 'http://enrollment-service:5003',
  '/progress': 'http://progress-service:5004',
  '/notifications': 'http://notification-service:5005',
};

app.get('/health', (req, res) => {
  res.json({ status: 'ok', services: Object.keys(routes) });
});

app.use(async (req, res, next) => {
  const routeKey = Object.keys(routes).find((prefix) => req.path.startsWith(prefix));
  if (!routeKey) {
    return res.status(404).json({ error: 'Route not found' });
  }

  const targetBase = routes[routeKey];
  const targetUrl = `${targetBase}${req.path}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers: { ...req.headers, host: undefined },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    const data = await upstreamRes.text();
    res.status(upstreamRes.status);
    upstreamRes.headers.forEach((value, name) => {
      if (!['transfer-encoding', 'content-encoding', 'connection'].includes(name.toLowerCase())) {
        res.setHeader(name, value);
      }
    });
    res.send(data);
  } catch (error) {
    next(error);
  }
});

app.listen(port, () => {
  console.log(`API gateway running on http://localhost:${port}`);
});
