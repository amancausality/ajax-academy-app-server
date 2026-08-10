const path = require('path');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const users = {};

app.use(express.json());
app.use(cors());

function buildEvent(eventType, payload) {
  return {
    source: 'identity-service',
    eventType,
    payload,
    timestamp: new Date().toISOString(),
  };
}

async function publishEvent(eventType, payload) {
  const event = buildEvent(eventType, payload);
  const destinations = ['http://notification-service:5005/events', 'http://localhost:5005/events'];

  destinations.forEach(async (url) => {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error(`identity-service: failed to publish ${eventType} to ${url}`, error.message);
    }
  });
}

function signToken(user) {
  return jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: '2h',
  });
}

function verifyToken(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = authorization.replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.post('/auth/register', async (req, res) => {
  const { email, password, role = 'student', name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (Object.values(users).some((user) => user.email === email)) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const id = uuid();
  users[id] = { id, email, password, role, name: name || '', createdAt: new Date().toISOString() };

  await publishEvent('user.registered', { userId: id, email, role });

  res.status(201).json({ id, email, role, name });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = Object.values(users).find((record) => record.email === email && record.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({ token: signToken(user), user: { id: user.id, email: user.email, role: user.role, name: user.name } });
});

app.get('/auth/profile', verifyToken, (req, res) => {
  const user = users[req.user.userId];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ id: user.id, email: user.email, role: user.role, name: user.name });
});

app.post('/events', (req, res) => {
  const event = req.body;
  console.log('identity-service received event:', event.eventType || 'unknown');
  res.status(200).json({ received: true, eventType: event.eventType });
});

app.get('/users', (req, res) => res.json(Object.values(users)));

app.listen(port, () => {
  console.log(`identity-service running on http://localhost:${port}`);
});
