const express = require('express');
const cors = require('cors');
const { v4: uuid } = require('uuid');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 5002;
const courses = [
  { id: 'course-1', title: 'React Fundamentals', instructor: 'Ada', duration: '4 weeks', level: 'Beginner' },
  { id: 'course-2', title: 'Node.js Microservices', instructor: 'Lin', duration: '6 weeks', level: 'Intermediate' },
];

app.use(express.json());
app.use(cors());

app.get('/courses', (req, res) => res.json(courses));

app.post('/courses', (req, res) => {
  const course = { id: uuid(), ...req.body };
  courses.push(course);
  res.status(201).json(course);
});

app.get('/courses/:id', (req, res) => {
  const course = courses.find((item) => item.id === req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json(course);
});

app.post('/events', (req, res) => {
  console.log('course-service received event:', req.body?.eventType || 'unknown');
  res.status(200).json({ received: true });
});

app.listen(port, () => {
  console.log(`course-service running on http://localhost:${port}`);
});
