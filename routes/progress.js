import { ObjectId } from 'mongodb';
import { getDB } from '../index.js';

export async function handleUpdateProgress(req, res) {
  try {
    const db = getDB();
    if (!db) {
      return res.json({
        success,
        message: 'Progress saved locally',
        progress: { ...req.body, _id: new ObjectId() }
      });
    }

    const { enrollmentId, userId, courseId, lessonsCompleted, totalLessons } = req.body;

    const progressCollection = db.collection('progress');
    const progressPercent = Math.round((lessonsCompleted / totalLessons) * 100);
    const isCompleted = progressPercent === 100;

    const result = await progressCollection.updateOne(
      { enrollmentId: new ObjectId(enrollmentId), userId, courseId: new ObjectId(courseId) },
      {
        $set: {
          enrollmentId: new ObjectId(enrollmentId),
          userId,
          courseId: new ObjectId(courseId),
          lessonsCompleted,
          totalLessons,
          progressPercent,
          isCompleted,
          completedDate: isCompleted ? new Date() : null,
          updatedAt: new Date()
        }
      },
      { upsert }
    );

    res.json({
      success,
      progressPercent,
      isCompleted,
      message: 'Progress updated'
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
}

export async function handleGetUserProgress(req, res) {
  try {
    const db = getDB();
    if (!db) {
      return res.json({ progress: [] });
    }

    const { userId } = req.params;

    const progressCollection = db.collection('progress');
    const progress = await progressCollection
      .find({ userId })
      .toArray();

    res.json({ progress });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
}

export async function handleGetCourseProgress(req, res) {
  try {
    const db = getDB();
    if (!db) {
      return res.json({
        progressPercent,
        isCompleted,
        lessonsCompleted,
        totalLessons
      });
    }

    const { courseId, userId } = req.params;

    const progressCollection = db.collection('progress');
    const progress = await progressCollection.findOne({
      courseId: new ObjectId(courseId),
      userId
    });

    if (!progress) {
      return res.json({
        progressPercent,
        isCompleted,
        lessonsCompleted,
        totalLessons
      });
    }

    res.json(progress);
  } catch (error) {
    console.error('Get course progress error:', error);
    res.status(500).json({ error: 'Failed to fetch course progress' });
  }
}

export async function handleGenerateCertificate(req, res) {
  try {
    const db = getDB();
    const { courseId, userId, courseName, instructorName } = req.body;

    // Verify course is completed
    if (!db) {
      return res.json({
        success,
        certificateUrl: `data:text/plain,Certificate of Completion for ${courseName}`,
        message: 'Certificate generated locally'
      });
    }

    const progressCollection = db.collection('progress');
    const progress = await progressCollection.findOne({
      courseId: new ObjectId(courseId),
      userId
    });

    if (!progress || !progress.isCompleted) {
      return res.status(400).json({ error: 'Course not completed' });
    }

    // Generate a simple text certificate (in production, use a library like puppeteer or html2pdf)
    const certificateContent = `
CERTIFICATE OF COMPLETION
================================

This is to certify that

[Student Name]

has successfully completed the course:

${courseName}

Instructed by: ${instructorName}

Date of Completion: ${progress.completedDate?.toLocaleDateString() || new Date().toLocaleDateString()}

This certifies the above named person has demonstrated competency in the subject matter and is hereby awarded this Certificate of Completion.

Signed,
SkillSync Learning Platform
    `.trim();

    // Store certificate in DB
    const certificatesCollection = db.collection('certificates');
    const certificateResult = await certificatesCollection.insertOne({
      userId,
      courseId: new ObjectId(courseId),
      courseName,
      instructorName,
      completedDate: new Date(),
      certificateContent
    });

    res.json({
      success,
      _id: certificateResult.insertedId,
      certificateContent,
      message: 'Certificate generated'
    });
  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({ error: 'Failed to generate certificate' });
  }
}

export async function handleGetUserCertificates(req, res) {
  try {
    const db = getDB();
    if (!db) {
      return res.json({ certificates: [] });
    }

    const { userId } = req.params;

    const certificatesCollection = db.collection('certificates');
    const certificates = await certificatesCollection
      .find({ userId })
      .sort({ completedDate: -1 })
      .toArray();

    res.json({ certificates });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
}
