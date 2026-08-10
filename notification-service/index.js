const express = require('express');
const cors = require('cors');
const { v4: uuid } = require('uuid');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 5005;
const notifications = [];

app.use(express.json());
app.use(cors());

app.get('/notifications', (req, res) => res.json(notifications));

app.post('/notifications/email', (req, res) => {
  const notification = { id: uuid(), ...req.body, sentAt: new Date().toISOString() };
  notifications.push(notification);
  res.status(201).json(notification);
});

app.post('/events', (req, res) => {
  const event = req.body;
  const notification = {
    id: uuid(),
    type: 'event-received',
    eventType: event?.eventType || 'unknown',
    receivedAt: new Date().toISOString(),
  };
  notifications.push(notification);
  console.log('notification-service received event:', event?.eventType || 'unknown');
  res.status(200).json({ received: true, notification });
});

app.listen(port, () => {
  console.log(`notification-service running on http://localhost:${port}`);
});
