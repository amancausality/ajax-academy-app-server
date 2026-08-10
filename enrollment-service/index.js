const express = require('express');
const cors = require('cors');
const { v4: uuid } = require('uuid');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 5003;
const enrollments = [];

app.use(express.json());
app.use(cors());

app.get('/enrollments', (req, res) => res.json(enrollments));

app.post('/enrollments', (req, res) => {
  const enrollment = { id: uuid(), ...req.body, enrolledAt: new Date().toISOString() };
  enrollments.push(enrollment);
  res.status(201).json(enrollment);
});

app.post('/events', (req, res) => {
  console.log('enrollment-service received event:', req.body?.eventType || 'unknown');
  res.status(200).json({ received: true });
});

app.listen(port, () => {
  console.log(`enrollment-service running on http://localhost:${port}`);
});
