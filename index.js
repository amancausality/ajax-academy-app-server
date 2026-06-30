const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 8080;

// Middleware to parse JSON requests
app.use(express.json());
app.use(cors());

// Sample route
app.get('/', (req, res) => {
  res.send('Welcome to the Academy App Server!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
}); 