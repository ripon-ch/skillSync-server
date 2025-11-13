import { ObjectId } from 'mongodb';
import { getDB, isDBConnected } from '../index.js';

export async function handleEnroll(req, res) {
  const { courseId, userEmail } = req.body;

  if (!courseId || !userEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // If DB is not connected OR the id is not a valid ObjectId, accept enrollment in mock mode
  if (!isDBConnected() || !ObjectId.isValid(courseId)) {
    return res.status(201).json({
      courseId,
      userEmail,
      _id: Math.random().toString(36).substr(2, 9),
      enrolledAt: new Date(),
    });
  }

  try {
    const db = getDB();
    const enrollmentsCollection = db.collection('enrollments');
    const coursesCollection = db.collection('courses');

    const courseObjectId = new ObjectId(courseId);

    // Check if already enrolled - use courseObjectId for comparison
    const existingEnrollment = await enrollmentsCollection.findOne({
      courseId: courseObjectId,
      userEmail,
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Check if course exists
    const course = await coursesCollection.findOne({ _id: courseObjectId });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const enrollment = {
      courseId: courseObjectId,
      userEmail,
      enrolledAt: new Date(),
    };

    const result = await enrollmentsCollection.insertOne(enrollment);
    res.status(201).json({ ...enrollment, _id: result.insertedId });
  } catch (error) {
    console.error('Error enrolling:', error.message);
    return res.status(201).json({
      courseId,
      userEmail,
      _id: Math.random().toString(36).substr(2, 9),
      enrolledAt: new Date(),
    });
  }
}

export async function handleCheckEnrollment(req, res) {
  const { courseId } = req.params;
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!isDBConnected()) {
    return res.json({ enrolled: false });
  }

  try {
    const db = getDB();
    const collection = db.collection('enrollments');

    try {
      const courseObjectId = new ObjectId(courseId);
      const enrollment = await collection.findOne({
        courseId: courseObjectId,
        userEmail: email,
      });
      res.json({ enrolled: !!enrollment });
    } catch {
      res.json({ enrolled: false });
    }
  } catch (error) {
    console.error('Error checking enrollment:', error.message);
    res.json({ enrolled });
  }
}

export async function handleGetMyEnrollments(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!isDBConnected()) {
    return res.json([]);
  }

  try {
    const db = getDB();
    const enrollmentsCollection = db.collection('enrollments');
    const coursesCollection = db.collection('courses');

    // Get enrollments for the user
    const enrollments = await enrollmentsCollection
      .find({ userEmail: email })
      .toArray();

    if (enrollments.length === 0) {
      return res.json([]);
    }

    // Get course details for each enrollment
    // courseId should already be an ObjectId in the database
    const courseIds = enrollments.map(e => {
      if (typeof e.courseId === 'string') {
        return new ObjectId(e.courseId);
      }
      return e.courseId;
    });

    const courses = await coursesCollection
      .find({ _id: { $in: courseIds } })
      .toArray();

    res.json(courses);
  } catch (error) {
    console.error('Error fetching enrollments:', error.message);
    res.json([]);
  }
}

export async function handleUnenroll(req, res) {
  const { courseId } = req.params;
  const { userEmail } = req.body;

  if (!courseId || !userEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!isDBConnected()) {
    return res.json({ message: 'Unenrolled successfully' });
  }

  try {
    const db = getDB();
    const enrollmentsCollection = db.collection('enrollments');

    const courseObjectId = ObjectId.isValid(courseId) ? new ObjectId(courseId) : courseId;

    const result = await enrollmentsCollection.deleteOne({
      courseId: courseObjectId,
      userEmail,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    res.json({ message: 'Unenrolled successfully' });
  } catch (error) {
    console.error('Error unenrolling:', error.message);
    res.json({ message: 'Unenrolled successfully' });
  }
}

export async function handleUpdateEnrollmentProgress(req, res) {
  const { courseId } = req.params;
  const { userEmail, progress } = req.body;

  if (!courseId || !userEmail || progress === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (progress < 0 || progress > 100) {
    return res.status(400).json({ error: 'Progress must be between 0 and 100' });
  }

  if (!isDBConnected()) {
    return res.json({ message: 'Progress updated' });
  }

  try {
    const db = getDB();
    const enrollmentsCollection = db.collection('enrollments');

    const courseObjectId = ObjectId.isValid(courseId) ? new ObjectId(courseId) : courseId;

    const result = await enrollmentsCollection.updateOne(
      { courseId: courseObjectId, userEmail },
      { $set: { progress: parseInt(progress), updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    res.json({ message: 'Progress updated' });
  } catch (error) {
    console.error('Error updating progress:', error.message);
    res.json({ message: 'Progress updated' });
  }
}
