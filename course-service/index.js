const express = require('express');
const cors = require('cors');
const { v4: uuid } = require('uuid');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 5002;

app.use(express.json());
app.use(cors());

// In-memory fallback
let inMemoryCourses = [
  { id: 'course-1', title: 'React Fundamentals', instructor: 'Ada', duration: '4 weeks', level: 'Beginner' },
  { id: 'course-2', title: 'Node.js Microservices', instructor: 'Lin', duration: '6 weeks', level: 'Intermediate' },
];

// Mongoose model (defined once connection is established)
let Course = null;
let mongooseConnected = false;

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ajaxacademy';

async function connectMongo() {
  try {
    await mongoose.connect(mongoUri, { dbName: 'ajaxacademy' });
    mongooseConnected = true;

    const courseSchema = new mongoose.Schema({
      title: String,
      instructor: String,
      duration: String,
      level: String,
      createdAt: { type: Date, default: Date.now },
    });

    Course = mongoose.model('Course', courseSchema);

    // seed if empty
    const count = await Course.countDocuments();
    if (count === 0) {
      await Course.create([
        { title: 'React Fundamentals', instructor: 'Ada', duration: '4 weeks', level: 'Beginner' },
        { title: 'Node.js Microservices', instructor: 'Lin', duration: '6 weeks', level: 'Intermediate' },
      ]);
      console.log('course-service: seeded MongoDB courses');
    }

    console.log('course-service: connected to MongoDB');
  } catch (err) {
    mongooseConnected = false;
    console.error('course-service: MongoDB connection failed, using in-memory store', err.message);
  }
}

connectMongo();

app.get('/courses', async (req, res) => {
  if (mongooseConnected && Course) {
    const docs = await Course.find().lean();
    return res.json(docs.map((d) => ({ id: d._id, title: d.title, instructor: d.instructor, duration: d.duration, level: d.level })));
  }
  res.json(inMemoryCourses);
});

app.post('/courses', async (req, res) => {
  const payload = { ...req.body };
  if (mongooseConnected && Course) {
    const created = await Course.create(payload);
    return res.status(201).json({ id: created._id, title: created.title, instructor: created.instructor, duration: created.duration, level: created.level });
  }

  const course = { id: uuid(), ...payload };
  inMemoryCourses.push(course);
  res.status(201).json(course);
});

app.get('/courses/:id', async (req, res) => {
  const { id } = req.params;
  if (mongooseConnected && Course) {
    try {
      const doc = await Course.findById(id).lean();
      if (!doc) return res.status(404).json({ error: 'Course not found' });
      return res.json({ id: doc._id, title: doc.title, instructor: doc.instructor, duration: doc.duration, level: doc.level });
    } catch (err) {
      return res.status(404).json({ error: 'Course not found' });
    }
  }

  const course = inMemoryCourses.find((item) => item.id === id);
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
