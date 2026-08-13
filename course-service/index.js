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
let serverMongooseConnected = false;

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ajaxacademy';

const seedIfEmpty = async () => {
  if (!Course) return;
  try {
    const count = await Course.countDocuments();
    if (count === 0) {
      await Course.create([
        { title: 'React Fundamentals', instructor: 'Ada', duration: '4 weeks', level: 'Beginner' },
        { title: 'Node.js Microservices', instructor: 'Lin', duration: '6 weeks', level: 'Intermediate' },
      ]);
      console.log('course-service: seeded MongoDB courses');
    }
  } catch (err) {
    console.error('course-service: seed error', err.message);
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri, { dbName: 'ajaxacademy' });

    const courseSchema = new mongoose.Schema({
      title: String,
      instructor: String,
      duration: String,
      level: String,
      createdAt: { type: Date, default: Date.now },
    });

    Course = mongoose.model('Course', courseSchema);
    serverMongooseConnected = true;
    await seedIfEmpty();
    console.log('course-service: connected to MongoDB');
  } catch (error) {
    serverMongooseConnected = false;
    console.error('course-service: MongoDB connection failed, using in-memory store', error.message);
  }
};

connectDB();

// Handler functions exported for use by event triggers or other modules
async function getCourses(req, res) {
  if (serverMongooseConnected && Course) {
    const docs = await Course.find().lean();
    return res.json(docs.map((d) => ({ id: d._id, title: d.title, instructor: d.instructor, duration: d.duration, level: d.level })));
  }
  return res.json(inMemoryCourses);
}

async function createCourse(req, res) {
  const payload = { ...req.body };
  console.log('Courses POST payload:', payload, '-', Course);
  if (serverMongooseConnected && Course) {
    const created = await Course.create(payload);
    return res.status(201).json({ id: created._id, title: created.title, instructor: created.instructor, duration: created.duration, level: created.level });
  }

  const course = { id: uuid(), ...payload };
  inMemoryCourses.push(course);
  return res.status(201).json(course);
}

async function getCourseById(req, res) {
  const { id } = req.params;
  if (serverMongooseConnected && Course) {
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
  return res.json(course);
}

function handleEvent(req, res) {
  console.log('course-service received event:', req.body?.eventType || 'unknown');
  return res.status(200).json({ received: true });
}

// Wire routes to handler functions
app.get('/courses', getCourses);
app.post('/courses', createCourse);
app.get('/courses/:id', getCourseById);
app.post('/events', handleEvent);

// Export handlers for external invocation (e.g., when events trigger actions)
module.exports = {
  getCourses,
  createCourse,
  getCourseById,
  handleEvent,
  connectDB,
  // export Course reference for advanced uses (may be null until DB connected)
  Course,
};

app.listen(port, () => {
  console.log(`course-service running on http://localhost:${port}`);
});
