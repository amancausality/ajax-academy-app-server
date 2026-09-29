const express = require('express');
const cors = require('cors');
const { v4: uuid } = require('uuid');

const app = express();
const port = process.env.PORT || 5002;

const courses = [
  { id: 'course-1', title: 'React Fundamentals', instructor: 'Ada', duration: '4 weeks', level: 'Beginner' },
  { id: 'course-2', title: 'Node.js Microservices', instructor: 'Lin', duration: '6 weeks', level: 'Intermediate' },
  { id: 'course-3', title: 'Python for Data Science', instructor: 'Alex', duration: '8 weeks', level: 'Advanced' },
];

const users = {};

app.use(express.json());
app.use(cors());

function getUser(userId) {
  if (!users[userId]) {
    users[userId] = {
      id: userId,
      name: '',
      email: '',
      coursePreferences: [],
    };
  }

  return users[userId];
}

app.get('/courses', (req, res) => {
  res.json(courses);
});

app.get('/courses/:id', (req, res) => {
  const course = courses.find((item) => item.id === req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  return res.json(course);
});

app.post('/courses', (req, res) => {
  const payload = req.body || {};
  const course = {
    id: payload.id || uuid(),
    title: payload.title,
    instructor: payload.instructor,
    duration: payload.duration,
    level: payload.level,
  };

  courses.push(course);
  return res.status(201).json(course);
});

app.post('/book-course', (req, res) => {
  const userId = req.headers['x-user-id'] || req.body.userId;
  const { courseId, title, instructor, duration, level } = req.body || {};

  if (!userId || !courseId) {
    return res.status(400).json({ error: 'userId and courseId are required' });
  }

  const course = courses.find((item) => item.id === courseId) || {
    id: courseId,
    title: title || 'Unknown Course',
    instructor: instructor || '',
    duration: duration || '',
    level: level || '',
  };

  const user = getUser(userId);
  const alreadyBooked = user.coursePreferences.some((item) => item.courseId === course.id);

  if (alreadyBooked) {
    return res.status(409).json({
      error: 'Course already booked for this user',
      user,
    });
  }

  user.coursePreferences.push({
    courseId: course.id,
    title: course.title,
    instructor: course.instructor,
    duration: course.duration,
    level: course.level,
    bookedAt: new Date().toISOString(),
  });

  return res.status(201).json({
    message: 'Course booked successfully',
    user,
  });
});

app.delete('/book-course/:userId/:courseId', (req, res) => {
  const { userId, courseId } = req.params;

  if (!userId || !courseId) {
    return res.status(400).json({ error: 'userId and courseId are required' });
  }

  const user = getUser(userId);
  const beforeCount = user.coursePreferences.length;
  user.coursePreferences = user.coursePreferences.filter((item) => item.courseId !== courseId);

  if (user.coursePreferences.length === beforeCount) {
    return res.status(404).json({
      error: 'Booked course not found',
      user,
    });
  }

  return res.status(200).json({
    message: 'Booked course removed successfully',
    user,
  });
});

app.get('/users/:userId', (req, res) => {
  const user = getUser(req.params.userId);
  res.json(user);
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`course-service running on http://localhost:${port}`);
  });
}

module.exports = {
  app,
  courses,
  users,
  getUser,
};
