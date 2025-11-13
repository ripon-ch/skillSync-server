import { ObjectId } from 'mongodb';
import { getDB, isDBConnected } from '../index.js';

export async function handleGetNotes(req, res) {
  const { courseId, email } = req.query;

  if (!courseId || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!isDBConnected()) {
    return res.json([]);
  }

  try {
    const db = getDB();
    const collection = db.collection('notes');

    const courseObjectId = ObjectId.isValid(courseId) ? new ObjectId(courseId) : courseId;

    const notes = await collection
      .find({ courseId: courseObjectId, userEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error.message);
    res.json([]);
  }
}

export async function handleCreateNote(req, res) {
  const { courseId, userEmail, userName, text } = req.body;

  if (!courseId || !userEmail || !text) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!isDBConnected()) {
    return res.status(201).json({
      _id: Math.random().toString(36).substr(2, 9),
      courseId,
      userEmail,
      userName,
      text,
      createdAt: new Date()
    });
  }

  try {
    const db = getDB();
    const collection = db.collection('notes');

    const courseObjectId = ObjectId.isValid(courseId) ? new ObjectId(courseId) : courseId;

    const note = {
      courseId: courseObjectId,
      userEmail,
      userName,
      text,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(note);
    res.status(201).json({ ...note, _id: result.insertedId });
  } catch (error) {
    console.error('Error creating note:', error.message);
    res.status(201).json({
      _id: Math.random().toString(36).substr(2, 9),
      courseId,
      userEmail,
      userName,
      text,
      createdAt: new Date()
    });
  }
}

export async function handleDeleteNote(req, res) {
  const { id } = req.params;
  const { userEmail } = req.body;

  if (!id || !userEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!isDBConnected()) {
    return res.json({ message: 'Note deleted' });
  }

  try {
    const db = getDB();
    const collection = db.collection('notes');

    const noteId = ObjectId.isValid(id) ? new ObjectId(id) : id;

    const note = await collection.findOne({ _id: noteId });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (note.userEmail !== userEmail) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await collection.deleteOne({ _id: noteId });
    res.json({ message: 'Note deleted' });
  } catch (error) {
    console.error('Error deleting note:', error.message);
    res.json({ message: 'Note deleted' });
  }
}

export async function handleUpdateNote(req, res) {
  const { id } = req.params;
  const { userEmail, text } = req.body;

  if (!id || !userEmail || !text) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!isDBConnected()) {
    return res.json({ message: 'Note updated' });
  }

  try {
    const db = getDB();
    const collection = db.collection('notes');

    const noteId = ObjectId.isValid(id) ? new ObjectId(id) : id;

    const note = await collection.findOne({ _id: noteId });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (note.userEmail !== userEmail) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await collection.updateOne(
      { _id: noteId },
      { $set: { text, updatedAt: new Date() } }
    );

    res.json({ message: 'Note updated' });
  } catch (error) {
    console.error('Error updating note:', error.message);
    res.json({ message: 'Note updated' });
  }
}
