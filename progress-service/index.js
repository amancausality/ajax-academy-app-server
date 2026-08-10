const express = require('express');
const cors = require('cors');
const { v4: uuid } = require('uuid');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 5004;
const progressEntries = [];

app.use(express.json());
app.use(cors());

app.get('/progress', (req, res) => res.json(progressEntries));

app.post('/progress', (req, res) => {
  const entry = { id: uuid(), ...req.body, recordedAt: new Date().toISOString() };
  progressEntries.push(entry);
  res.status(201).json(entry);
});

app.post('/events', (req, res) => {
  console.log('progress-service received event:', req.body?.eventType || 'unknown');
  res.status(200).json({ received: true });
});

app.listen(port, () => {
  console.log(`progress-service running on http://localhost:${port}`);
});
