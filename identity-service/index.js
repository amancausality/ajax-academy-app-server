const express = require('express');
const cors = require('cors');
const { v4: uuid } = require('uuid');

const app = express();
const port = process.env.PORT || 5001;
const users = [];

app.use(cors());
app.use(express.json());

app.post('/register', (req, res) => {
  const { email, password, name } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const exists = users.some((user) => user.email.toLowerCase() === String(email).toLowerCase());
  if (exists) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const user = {
    id: uuid(),
    email,
    password,
    name: name || '',
    createdAt: new Date().toISOString(),
  };

  users.push(user);

  return res.status(201).json({
    id: user.id,
    email: user.email,
    name: user.name,
  });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`identity-service running on http://localhost:${port}`);
  });
}

module.exports = { app, users };
