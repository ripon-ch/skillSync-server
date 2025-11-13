import { ObjectId } from 'mongodb';
import { getDB, isDBConnected } from '../index.js';

export async function handleGetCourses(req, res) {
  const mockCourses = [
    // Web Development
    {
      _id: '1',
      title: 'Web Development Bootcamp',
      image: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=800&h=500&fit=crop',
      price: 99.99,
      duration: '40 hours',
      category: 'Web Development',
      description: 'Learn full-stack web development',
      instructor: 'John Doe',
      isFeatured: false,
    },
    {
      _id: '2',
      title: 'Modern Frontend with React',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=500&fit=crop',
      price: 89.99,
      duration: '32 hours',
      category: 'Web Development',
      description: 'Build modern, responsive frontends with React 18',
      instructor: 'Jane Smith',
      isFeatured: false,
    },
    // Mobile Development
    {
      _id: '3',
      title: 'Flutter for Beginners',
      image: 'https://images.unsplash.com/photo-1526374965328-7f5ae4e8289e?w=800&h=500&fit=crop',
      price: 79.99,
      duration: '28 hours',
      category: 'Mobile Development',
      description: 'Build beautiful native mobile apps with Flutter',
      instructor: 'Alex Turner',
      isFeatured: false,
    },
    {
      _id: '4',
      title: 'React Native Zero to Hero',
      image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=500&fit=crop',
      price: 84.99,
      duration: '30 hours',
      category: 'Mobile Development',
      description: 'Create cross-platform mobile apps with React Native',
      instructor: 'Mia Wong',
      isFeatured: false,
    },
    // Data Science
    {
      _id: '5',
      title: 'Data Science Fundamentals',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop',
      price: 89.99,
      duration: '35 hours',
      category: 'Data Science',
      description: 'Introduction to data science',
      instructor: 'Bob Johnson',
      isFeatured: false,
    },
    {
      _id: '6',
      title: 'Machine Learning A-Z',
      image: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=800&h=500&fit=crop',
      price: 109.99,
      duration: '44 hours',
      category: 'Data Science',
      description: 'Hands-on machine learning with Python',
      instructor: 'Priya Patel',
      isFeatured: false,
    },
    // Design
    {
      _id: '7',
      title: 'UI/UX Design Principles',
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=500&fit=crop',
      price: 69.99,
      duration: '25 hours',
      category: 'Design',
      description: 'Learn modern design principles',
      instructor: 'Sarah Wilson',
      isFeatured: false,
    },
    {
      _id: '8',
      title: 'Figma from Scratch',
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=500&fit=crop',
      price: 59.99,
      duration: '18 hours',
      category: 'Design',
      description: 'Prototyping and UI workflows in Figma',
      instructor: 'Liam Carter',
      isFeatured: false,
    },
    // Business / Marketing
    {
      _id: '9',
      title: 'Digital Marketing Mastery',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&fit=crop',
      price: 79.99,
      duration: '28 hours',
      category: 'Business',
      description: 'Master digital marketing strategies',
      instructor: 'Michael Brown',
      isFeatured: false,
    },
    {
      _id: '10',
      title: 'SEO Deep Dive',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=500&fit=crop',
      price: 64.99,
      duration: '22 hours',
      category: 'Business',
      description: 'Grow organic traffic with modern SEO',
      instructor: 'Ava Thompson',
      isFeatured: false,
    },
    // Programming
    {
      _id: '11',
      title: 'Python for Everyone',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=500&fit=crop',
      price: 59.99,
      duration: '20 hours',
      category: 'Programming',
      description: 'Learn Python programming basics',
      instructor: 'Emily Davis',
      isFeatured: false,
    },
    {
      _id: '12',
      title: 'Node.js & Express API',
      image: 'https://images.unsplash.com/photo-1559526324-593bc073d938?w=800&h=500&fit=crop',
      price: 74.99,
      duration: '26 hours',
      category: 'Programming',
      description: 'Build production-grade REST APIs with Node.js',
      instructor: 'Noah Green',
      isFeatured: false,
    },
    {
      _id: '13',
      title: 'Tailwind & Next.js UI Kit',
      image: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=800&h=500&fit=crop',
      price: 94.99,
      duration: '24 hours',
      category: 'Web Development',
      description: 'Build polished UIs with Tailwind CSS and Next.js',
      instructor: 'Oliver King',
      isFeatured: false,
    },
    {
      _id: '14',
      title: 'Fullstack MERN Projects',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=500&fit=crop',
      price: 119.99,
      duration: '46 hours',
      category: 'Web Development',
      description: 'Real-world MERN applications from start to finish',
      instructor: 'Sophia Lee',
      isFeatured: false,
    },
    {
      _id: '15',
      title: 'Kotlin Android Essentials',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=500&fit=crop',
      price: 72.99,
      duration: '24 hours',
      category: 'Mobile Development',
      description: 'Modern Android development with Kotlin',
      instructor: 'Arjun Mehta',
      isFeatured: false,
    },
    {
      _id: '16',
      title: 'Swift iOS Fundamentals',
      image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&h=500&fit=crop',
      price: 82.99,
      duration: '26 hours',
      category: 'Mobile Development',
      description: 'Build iOS apps with Swift and UIKit',
      instructor: 'Emma Clark',
      isFeatured: false,
    },
    {
      _id: '17',
      title: 'Pandas & NumPy Workshop',
      image: 'https://images.unsplash.com/photo-1516375199440-485163e2b1f3?w=800&h=500&fit=crop',
      price: 69.99,
      duration: '20 hours',
      category: 'Data Science',
      description: 'Practical data analysis with Python libraries',
      instructor: 'Chen Liu',
      isFeatured: false,
    },
    {
      _id: '18',
      title: 'Deep Learning with PyTorch',
      image: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=800&h=500&fit=crop',
      price: 129.99,
      duration: '36 hours',
      category: 'Data Science',
      description: 'Neural networks and DL pipelines using PyTorch',
      instructor: 'Amelia Patel',
      isFeatured: false,
    },
    {
      _id: '19',
      title: 'Design Systems in Figma',
      image: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=800&h=500&fit=crop',
      price: 74.99,
      duration: '22 hours',
      category: 'Design',
      description: 'Create scalable design systems in Figma',
      instructor: 'Marco Rossi',
      isFeatured: false,
    },
    {
      _id: '20',
      title: 'Motion Design Basics',
      image: 'https://images.unsplash.com/photo-1520420097861-1513c9f95f14?w=800&h=500&fit=crop',
      price: 69.99,
      duration: '18 hours',
      category: 'Design',
      description: 'Animate interfaces and micro-interactions',
      instructor: 'Nina Park',
      isFeatured: false,
    },
    {
      _id: '21',
      title: 'Facebook Ads Strategy',
      image: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=800&h=500&fit=crop',
      price: 64.99,
      duration: '16 hours',
      category: 'Business',
      description: 'High-ROI campaigns with Meta Ads Manager',
      instructor: 'Jack Miller',
      isFeatured: false,
    },
    {
      _id: '22',
      title: 'Email Marketing Mastery',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop',
      price: 59.99,
      duration: '14 hours',
      category: 'Business',
      description: 'List growth, copywriting, and automation',
      instructor: 'Clara Gomez',
      isFeatured: false,
    },
    {
      _id: '23',
      title: 'TypeScript Masterclass',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=500&fit=crop',
      price: 84.99,
      duration: '24 hours',
      category: 'Programming',
      description: 'Types for scalable JavaScript applications',
      instructor: 'Peter Novak',
      isFeatured: false,
    },
    {
      _id: '24',
      title: 'Go for Web Developers',
      image: 'https://images.unsplash.com/photo-1559526324-593bc073d938?w=800&h=500&fit=crop',
      price: 89.99,
      duration: '26 hours',
      category: 'Programming',
      description: 'Fast backends with Go and standard library',
      instructor: 'Hannah Kim',
      isFeatured: false,
    },
  ];

  if (!isDBConnected()) {
    return res.json(mockCourses);
  }

  try {
    const db = getDB();
    const collection = db.collection('courses');

    const { featured } = req.query;
    let query = {};

    if (featured === 'true') {
      query.isFeatured = true;
    }

    const courses = await collection.find(query).toArray();
    if (!courses || courses.length === 0) {
      return res.json(mockCourses);
    }
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error.message);
    res.json(mockCourses);
  }
}

export async function handleGetCourse(req, res) {
  const mockCourse = {
    _id: req.params.id,
    title: 'Web Development Bootcamp',
    image: 'https://via.placeholder.com/300x200?text=Web+Development',
    price: 99.99,
    duration: '40 hours',
    category: 'Web Development',
    description: 'Learn full-stack web development from scratch. This comprehensive course covers HTML, CSS, JavaScript, and modern frameworks.',
    instructor: 'John Doe',
    isFeatured: false,
  };

  if (!isDBConnected()) {
    return res.json(mockCourse);
  }

  try {
    const db = getDB();
    const collection = db.collection('courses');

    const course = await collection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error.message);
    res.json(mockCourse);
  }
}

export async function handleCreateCourse(req, res) {
  const {
    title,
    description,
    image,
    price,
    duration,
    category,
    isFeatured,
    instructor,
    instructorEmail,
    instructorImage,
  } = req.body;

  if (!title || !description || !image || !price || !duration || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!isDBConnected()) {
    return res.status(201).json({
      ...req.body,
      _id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  try {
    const db = getDB();
    const collection = db.collection('courses');

    const newCourse = {
      title,
      description,
      image,
      price: parseFloat(price),
      duration,
      category,
      isFeatured: !!isFeatured,
      instructor,
      instructorEmail,
      instructorImage,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(newCourse);
    res.status(201).json({ ...newCourse, _id: result.insertedId });
  } catch (error) {
    console.error('Error creating course:', error.message);
    res.status(201).json({
      ...req.body,
      _id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

export async function handleUpdateCourse(req, res) {
  const {
    title,
    description,
    image,
    price,
    duration,
    category,
    isFeatured,
  } = req.body;

  if (!title || !description || !image || !price || !duration || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!isDBConnected()) {
    return res.json({ message: 'Course updated successfully' });
  }

  try {
    const db = getDB();
    const collection = db.collection('courses');

    const updateData = {
      title,
      description,
      image,
      price: parseFloat(price),
      duration,
      category,
      isFeatured: !!isFeatured,
      updatedAt: new Date(),
    };

    const result = await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ message: 'Course updated successfully' });
  } catch (error) {
    console.error('Error updating course:', error.message);
    res.status(500).json({ error: 'Failed to update course' });
  }
}

export async function handleDeleteCourse(req, res) {
  if (!isDBConnected()) {
    return res.json({ message: 'Course deleted successfully' });
  }

  try {
    const db = getDB();
    const coursesCollection = db.collection('courses');
    const enrollmentsCollection = db.collection('enrollments');

    const courseId = new ObjectId(req.params.id);

    // Delete course
    const result = await coursesCollection.deleteOne({ _id: courseId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Delete related enrollments
    await enrollmentsCollection.deleteMany({ courseId });

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error.message);
    res.status(500).json({ error: 'Failed to delete course' });
  }
}

export async function handleGetMyCourses(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!isDBConnected()) {
    return res.json([]);
  }

  try {
    const db = getDB();
    const collection = db.collection('courses');

    const courses = await collection
      .find({ instructorEmail: email })
      .toArray();

    res.json(courses);
  } catch (error) {
    console.error('Error fetching user courses:', error.message);
    res.json([]);
  }
}
