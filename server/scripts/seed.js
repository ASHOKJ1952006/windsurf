require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const ForumPost = require('../models/Forum');
const Job = require('../models/Job');
const Mentorship = require('../models/Mentorship');
const Review = require('../models/Review');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
    await ForumPost.deleteMany({});
    await Job.deleteMany({});
    await Mentorship.deleteMany({});
    await Review.deleteMany({});

    // Create users
    console.log('👥 Creating users...');
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@elearn.com',
      password: 'password123',
      role: 'admin',
      bio: 'Platform administrator'
    });

    const instructor1 = await User.create({
      name: 'John Doe',
      email: 'john@elearn.com',
      password: 'password123',
      role: 'instructor',
      bio: 'Full-stack developer with 10+ years experience',
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
      instructorBio: 'Passionate about teaching web development',
      instructorRating: 4.8,
      xp: 500,
      level: 5
    });

    const instructor2 = await User.create({
      name: 'Jane Smith',
      email: 'jane@elearn.com',
      password: 'password123',
      role: 'instructor',
      bio: 'Data Science expert and ML enthusiast',
      skills: ['Python', 'Machine Learning', 'Data Science', 'TensorFlow'],
      instructorBio: 'Making AI accessible to everyone',
      instructorRating: 4.9,
      xp: 600,
      level: 6
    });

    const student1 = await User.create({
      name: 'Alice Johnson',
      email: 'alice@elearn.com',
      password: 'password123',
      role: 'student',
      bio: 'Aspiring web developer',
      skills: ['HTML', 'CSS', 'JavaScript'],
      goals: ['Learn React', 'Build full-stack apps', 'Get a frontend developer job'],
      interests: ['Web Development', 'UI/UX Design', 'Mobile Development', 'React'],
      xp: 150,
      level: 2,
      streak: { current: 5, longest: 10 }
    });

    const student2 = await User.create({
      name: 'Bob Williams',
      email: 'bob@elearn.com',
      password: 'password123',
      role: 'student',
      bio: 'Data enthusiast',
      skills: ['Python', 'SQL'],
      goals: ['Master Machine Learning', 'Get a data science job', 'Learn deep learning'],
      interests: ['Data Science', 'AI', 'Machine Learning', 'Business Analytics'],
      xp: 200,
      level: 3,
      streak: { current: 3, longest: 7 }
    });

    const student3 = await User.create({
      name: 'Charlie Brown',
      email: 'charlie@elearn.com',
      password: 'password123',
      role: 'student',
      bio: 'Career switcher to tech',
      skills: ['JavaScript'],
      goals: ['Become a full-stack developer', 'Learn cloud computing', 'Build SaaS applications'],
      interests: ['Web Development', 'Mobile Development', 'DevOps', 'Cloud Computing'],
      xp: 80,
      level: 1
    });

    console.log('✅ Users created');

    // Create courses
    console.log('📚 Creating courses...');
    const course1 = await Course.create({
      title: 'Complete MERN Stack Bootcamp',
      description: 'Learn MongoDB, Express, React, and Node.js from scratch to build modern web applications.',
      instructor: instructor1._id,
      category: 'Web Development',
      tags: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Express', 'Full Stack'],
      level: 'intermediate',
      price: 0,
      status: 'published',
      isApproved: true,
      modules: [
        {
          title: 'Module 1: Introduction to MERN Stack',
          description: 'Overview of the stack and setup',
          order: 1,
          estimatedDuration: 35,
          learningObjectives: ['Understand MERN stack components', 'Set up development environment'],
          lectures: [
            {
              title: 'What is MERN Stack?',
              description: 'Introduction to MongoDB, Express, React, and Node.js',
              type: 'video',
              duration: 15,
              order: 1,
              isFree: true
            },
            {
              title: 'Setting up Development Environment',
              description: 'Install Node.js, MongoDB, and VS Code',
              type: 'video',
              duration: 20,
              order: 2,
              isFree: true
            }
          ]
        },
        {
          title: 'Module 2: Backend with Node.js & Express',
          description: 'Build RESTful APIs',
          order: 2,
          estimatedDuration: 75,
          learningObjectives: ['Create Express servers', 'Connect to MongoDB', 'Build REST APIs'],
          lectures: [
            {
              title: 'Express Basics',
              description: 'Creating your first Express server',
              type: 'video',
              duration: 30,
              order: 1
            },
            {
              title: 'MongoDB Integration',
              description: 'Connect to MongoDB with Mongoose',
              type: 'video',
              duration: 35,
              order: 2
            },
            {
              title: 'Quiz: Backend Fundamentals',
              type: 'quiz',
              order: 3,
              duration: 10,
              quiz: {
                questions: [
                  {
                    type: 'multiple-choice',
                    question: 'What is Express.js?',
                    options: ['A database', 'A web framework', 'A frontend library', 'An IDE'],
                    correctAnswer: 1,
                    points: 10,
                    explanation: 'Express.js is a minimal and flexible Node.js web application framework.'
                  }
                ],
                passingScore: 70,
                timeLimit: 15,
                attempts: 3
              }
            }
          ]
        }
      ],
      finalTest: {
        title: 'MERN Stack Final Assessment',
        description: 'Comprehensive test covering all MERN stack concepts',
        questions: [
          {
            type: 'multiple-choice',
            question: 'Which database is used in the MERN stack?',
            options: ['MySQL', 'PostgreSQL', 'MongoDB', 'SQLite'],
            correctAnswer: 2,
            points: 5,
            explanation: 'MongoDB is the NoSQL database used in the MERN stack.'
          },
          {
            type: 'true-false',
            question: 'React is a backend framework.',
            options: ['True', 'False'],
            correctAnswer: 1,
            points: 5,
            explanation: 'React is a frontend library for building user interfaces.'
          }
        ],
        passingScore: 70,
        timeLimit: 30,
        attempts: 3,
        isEnabled: true
      },
      requirements: ['Basic JavaScript knowledge', 'Computer with internet'],
      whatYouWillLearn: ['Build full-stack apps', 'Create RESTful APIs', 'Use MongoDB', 'Deploy applications'],
      averageRating: 4.7,
      totalRatings: 15,
      enrolledCount: 25
    });

    course1.calculateDuration();
    await course1.save();

    const course2 = await Course.create({
      title: 'Machine Learning with Python',
      description: 'Master machine learning algorithms and build real-world AI applications.',
      instructor: instructor2._id,
      category: 'Machine Learning',
      tags: ['Python', 'Machine Learning', 'AI', 'Data Science', 'TensorFlow'],
      level: 'advanced',
      price: 0,
      status: 'published',
      isApproved: true,
      modules: [
        {
          title: 'Module 1: Introduction to Machine Learning',
          description: 'Fundamentals of ML and Python setup',
          order: 1,
          estimatedDuration: 55,
          learningObjectives: ['Understand ML concepts', 'Set up Python environment'],
          lectures: [
            {
              title: 'What is Machine Learning?',
              type: 'video',
              duration: 25,
              order: 1,
              isFree: true
            },
            {
              title: 'Python for ML',
              type: 'video',
              duration: 30,
              order: 2
            }
          ]
        }
      ],
      finalTest: {
        title: 'Machine Learning Assessment',
        description: 'Test your understanding of ML fundamentals',
        questions: [
          {
            type: 'multiple-choice',
            question: 'What is supervised learning?',
            options: ['Learning without labels', 'Learning with labeled data', 'Unsupervised learning', 'Reinforcement learning'],
            correctAnswer: 1,
            points: 10,
            explanation: 'Supervised learning uses labeled training data to learn a mapping function.'
          }
        ],
        passingScore: 70,
        timeLimit: 45,
        attempts: 3,
        isEnabled: true
      },
      requirements: ['Python basics', 'Math fundamentals'],
      whatYouWillLearn: ['ML algorithms', 'Neural networks', 'Model deployment'],
      averageRating: 4.9,
      totalRatings: 20,
      enrolledCount: 30
    });

    course2.calculateDuration();
    await course2.save();

    const course3 = await Course.create({
      title: 'React for Beginners',
      description: 'Learn React from scratch and build interactive UIs.',
      instructor: instructor1._id,
      category: 'Web Development',
      tags: ['React', 'JavaScript', 'Frontend', 'UI'],
      level: 'beginner',
      price: 0,
      status: 'published',
      isApproved: true,
      sections: [
        {
          title: 'React Basics',
          order: 1,
          lectures: [
            {
              title: 'Introduction to React',
              type: 'video',
              duration: 20,
              order: 1,
              isFree: true
            }
          ]
        }
      ],
      requirements: ['HTML & CSS', 'Basic JavaScript'],
      whatYouWillLearn: ['React components', 'State management', 'Hooks'],
      averageRating: 4.6,
      totalRatings: 12,
      enrolledCount: 40
    });

    course3.calculateDuration();
    await course3.save();

    // Create 10 additional courses
    const course4 = await Course.create({
      title: 'Python for Data Science',
      description: 'Learn Python programming specifically for data analysis and visualization.',
      instructor: instructor2._id,
      category: 'Data Science',
      tags: ['Python', 'Data Analysis', 'Pandas', 'NumPy', 'Matplotlib'],
      level: 'beginner',
      price: 0,
      status: 'published',
      isApproved: true,
      sections: [
        {
          title: 'Python Fundamentals',
          order: 1,
          lectures: [
            {
              title: 'Python Basics for Data Science',
              type: 'video',
              duration: 30,
              order: 1,
              isFree: true
            }
          ]
        }
      ],
      requirements: ['Basic programming knowledge'],
      whatYouWillLearn: ['Python syntax', 'Data manipulation', 'Data visualization'],
      averageRating: 4.5,
      totalRatings: 18,
      enrolledCount: 35
    });

    const course5 = await Course.create({
      title: 'Mobile App Development with Flutter',
      description: 'Build cross-platform mobile apps using Flutter and Dart.',
      instructor: instructor1._id,
      category: 'Mobile Development',
      tags: ['Flutter', 'Dart', 'Mobile', 'Cross-platform', 'iOS', 'Android'],
      level: 'intermediate',
      price: 0,
      status: 'published',
      isApproved: true,
      sections: [
        {
          title: 'Flutter Basics',
          order: 1,
          lectures: [
            {
              title: 'Introduction to Flutter',
              type: 'video',
              duration: 25,
              order: 1,
              isFree: true
            }
          ]
        }
      ],
      requirements: ['Basic programming knowledge', 'OOP concepts'],
      whatYouWillLearn: ['Flutter framework', 'Dart language', 'Mobile UI design'],
      averageRating: 4.7,
      totalRatings: 22,
      enrolledCount: 28
    });

    const course6 = await Course.create({
      title: 'UI/UX Design Fundamentals',
      description: 'Master the principles of user interface and user experience design.',
      instructor: instructor1._id,
      category: 'Design',
      tags: ['UI', 'UX', 'Design', 'Figma', 'Prototyping', 'User Research'],
      level: 'beginner',
      price: 0,
      status: 'published',
      isApproved: true,
      sections: [
        {
          title: 'Design Principles',
          order: 1,
          lectures: [
            {
              title: 'Introduction to UI/UX',
              type: 'video',
              duration: 35,
              order: 1,
              isFree: true
            }
          ]
        }
      ],
      requirements: ['Creative mindset', 'Basic computer skills'],
      whatYouWillLearn: ['Design principles', 'User research', 'Prototyping'],
      averageRating: 4.8,
      totalRatings: 16,
      enrolledCount: 42
    });

    const course7 = await Course.create({
      title: 'Digital Marketing Mastery',
      description: 'Learn comprehensive digital marketing strategies and tactics.',
      instructor: instructor2._id,
      category: 'Marketing',
      tags: ['Digital Marketing', 'SEO', 'Social Media', 'Content Marketing', 'Analytics'],
      level: 'intermediate',
      price: 0,
      status: 'published',
      isApproved: true,
      sections: [
        {
          title: 'Marketing Fundamentals',
          order: 1,
          lectures: [
            {
              title: 'Digital Marketing Overview',
              type: 'video',
              duration: 40,
              order: 1,
              isFree: true
            }
          ]
        }
      ],
      requirements: ['Basic business knowledge'],
      whatYouWillLearn: ['SEO strategies', 'Social media marketing', 'Analytics'],
      averageRating: 4.6,
      totalRatings: 24,
      enrolledCount: 38
    });

    const course8 = await Course.create({
      title: 'Blockchain and Cryptocurrency',
      description: 'Understand blockchain technology and cryptocurrency fundamentals.',
      instructor: instructor1._id,
      category: 'Other',
      tags: ['Blockchain', 'Cryptocurrency', 'Bitcoin', 'Ethereum', 'Smart Contracts'],
      level: 'advanced',
      price: 0,
      status: 'published',
      isApproved: true,
      sections: [
        {
          title: 'Blockchain Basics',
          order: 1,
          lectures: [
            {
              title: 'What is Blockchain?',
              type: 'video',
              duration: 45,
              order: 1,
              isFree: true
            }
          ]
        }
      ],
      requirements: ['Basic programming knowledge', 'Cryptography basics'],
      whatYouWillLearn: ['Blockchain concepts', 'Smart contracts', 'DeFi'],
      averageRating: 4.4,
      totalRatings: 19,
      enrolledCount: 26
    });

    const course9 = await Course.create({
      title: 'DevOps and Cloud Computing',
      description: 'Learn DevOps practices and cloud deployment strategies.',
      instructor: instructor2._id,
      category: 'Other',
      tags: ['DevOps', 'AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Cloud'],
      level: 'advanced',
      price: 0,
      status: 'published',
      isApproved: true,
      sections: [
        {
          title: 'DevOps Introduction',
          order: 1,
          lectures: [
            {
              title: 'DevOps Fundamentals',
              type: 'video',
              duration: 50,
              order: 1,
              isFree: true
            }
          ]
        }
      ],
      requirements: ['Linux basics', 'Programming experience'],
      whatYouWillLearn: ['Docker containers', 'Kubernetes', 'AWS services'],
      averageRating: 4.7,
      totalRatings: 21,
      enrolledCount: 31
    });

    const course10 = await Course.create({
      title: 'Cybersecurity Essentials',
      description: 'Learn fundamental cybersecurity concepts and practices.',
      instructor: instructor1._id,
      category: 'Other',
      tags: ['Cybersecurity', 'Network Security', 'Ethical Hacking', 'Penetration Testing'],
      level: 'intermediate',
      price: 0,
      status: 'published',
      isApproved: true,
      sections: [
        {
          title: 'Security Fundamentals',
          order: 1,
          lectures: [
            {
              title: 'Introduction to Cybersecurity',
              type: 'video',
              duration: 35,
              order: 1,
              isFree: true
            }
          ]
        }
      ],
      requirements: ['Networking basics', 'Computer fundamentals'],
      whatYouWillLearn: ['Security principles', 'Threat analysis', 'Risk management'],
      averageRating: 4.5,
      totalRatings: 17,
      enrolledCount: 29
    });

    const course11 = await Course.create({
      title: 'Business Analytics with Excel',
      description: 'Master business analytics using Microsoft Excel and Power BI.',
      instructor: instructor2._id,
      category: 'Business',
      tags: ['Excel', 'Power BI', 'Business Analytics', 'Data Visualization', 'Reporting'],
      level: 'beginner',
      price: 0,
      status: 'published',
      isApproved: true,
      sections: [
        {
          title: 'Excel Fundamentals',
          order: 1,
          lectures: [
            {
              title: 'Excel for Business',
              type: 'video',
              duration: 30,
              order: 1,
              isFree: true
            }
          ]
        }
      ],
      requirements: ['Basic computer skills'],
      whatYouWillLearn: ['Excel formulas', 'Data analysis', 'Dashboard creation'],
      averageRating: 4.3,
      totalRatings: 25,
      enrolledCount: 45
    });

    const course12 = await Course.create({
      title: 'Game Development with Unity',
      description: 'Create 2D and 3D games using Unity game engine.',
      instructor: instructor1._id,
      category: 'Other',
      tags: ['Unity', 'Game Development', 'C#', '2D Games', '3D Games'],
      level: 'intermediate',
      price: 0,
      status: 'published',
      isApproved: true,
      sections: [
        {
          title: 'Unity Basics',
          order: 1,
          lectures: [
            {
              title: 'Getting Started with Unity',
              type: 'video',
              duration: 40,
              order: 1,
              isFree: true
            }
          ]
        }
      ],
      requirements: ['Basic programming knowledge', 'C# fundamentals'],
      whatYouWillLearn: ['Unity interface', 'Game mechanics', 'Physics systems'],
      averageRating: 4.6,
      totalRatings: 20,
      enrolledCount: 33
    });

    const course13 = await Course.create({
      title: 'Artificial Intelligence Fundamentals',
      description: 'Introduction to AI concepts, algorithms, and applications.',
      instructor: instructor2._id,
      category: 'Machine Learning',
      tags: ['AI', 'Artificial Intelligence', 'Neural Networks', 'Deep Learning', 'Computer Vision'],
      level: 'advanced',
      price: 0,
      status: 'published',
      isApproved: true,
      sections: [
        {
          title: 'AI Introduction',
          order: 1,
          lectures: [
            {
              title: 'What is Artificial Intelligence?',
              type: 'video',
              duration: 45,
              order: 1,
              isFree: true
            }
          ]
        }
      ],
      requirements: ['Mathematics background', 'Python programming'],
      whatYouWillLearn: ['AI algorithms', 'Neural networks', 'Computer vision'],
      averageRating: 4.8,
      totalRatings: 23,
      enrolledCount: 27
    });

    // Calculate durations for new courses
    [course4, course5, course6, course7, course8, course9, course10, course11, course12, course13].forEach(course => {
      course.calculateDuration();
    });

    await Promise.all([
      course4.save(), course5.save(), course6.save(), course7.save(), course8.save(),
      course9.save(), course10.save(), course11.save(), course12.save(), course13.save()
    ]);

    console.log('✅ Courses created');

    // Update students with wishlist (interested courses)
    console.log('📝 Adding wishlist to students...');
    
    // Alice is interested in web development and UI/UX courses
    student1.wishlist = [course3._id, course6._id, course5._id]; // React, UI/UX, Flutter
    await student1.save();
    
    // Bob is interested in data science and AI courses
    student2.wishlist = [course4._id, course13._id, course11._id]; // Python Data Science, AI, Business Analytics
    await student2.save();
    
    // Charlie is interested in full-stack and cloud courses
    student3.wishlist = [course1._id, course9._id, course8._id]; // MERN Stack, DevOps, Blockchain
    await student3.save();

    console.log('✅ Wishlist added to students');

    // Create enrollments
    console.log('📝 Creating enrollments...');
    const enrollment1 = await Enrollment.create({
      student: student1._id,
      course: course1._id,
      progress: [
        {
          lectureId: course1.sections[0].lectures[0]._id,
          completed: true,
          watchedPercentage: 100
        },
        {
          lectureId: course1.sections[0].lectures[1]._id,
          completed: true,
          watchedPercentage: 100
        }
      ],
      completionPercentage: 40
    });

    const enrollment2 = await Enrollment.create({
      student: student2._id,
      course: course2._id,
      progress: [
        {
          lectureId: course2.sections[0].lectures[0]._id,
          completed: true,
          watchedPercentage: 100
        }
      ],
      completionPercentage: 50
    });

    const enrollment3 = await Enrollment.create({
      student: student3._id,
      course: course3._id,
      progress: [],
      completionPercentage: 0
    });

    console.log('✅ Enrollments created');

    // Create reviews
    console.log('⭐ Creating reviews...');
    await Review.create({
      course: course1._id,
      student: student1._id,
      rating: 5,
      comment: 'Excellent course! Very comprehensive and well-structured.'
    });

    await Review.create({
      course: course2._id,
      student: student2._id,
      rating: 5,
      comment: 'Best ML course I have taken. Jane is an amazing instructor!'
    });

    console.log('✅ Reviews created');

    // Create forum posts
    console.log('💬 Creating forum posts...');
    await ForumPost.create({
      title: 'How to deploy MERN app to production?',
      content: 'I have completed the MERN course and built my app. What are the best practices for deploying to production?',
      author: student1._id,
      course: course1._id,
      category: 'question',
      tags: ['deployment', 'production', 'mern'],
      answers: [
        {
          author: instructor1._id,
          content: 'Great question! I recommend using services like Heroku for backend and Vercel for frontend. Make sure to use environment variables for sensitive data.',
          upvotes: [student1._id, student3._id]
        }
      ],
      upvotes: [student2._id, student3._id],
      views: 45
    });

    await ForumPost.create({
      title: 'Best resources for learning TensorFlow?',
      content: 'Looking for additional resources to supplement the ML course.',
      author: student2._id,
      course: course2._id,
      category: 'discussion',
      tags: ['tensorflow', 'resources', 'ml'],
      views: 30
    });

    console.log('✅ Forum posts created');

    // Create jobs
    console.log('💼 Creating jobs...');
    await Job.create({
      title: 'Full Stack Developer',
      company: 'Tech Startup Inc',
      location: 'Remote',
      type: 'full-time',
      description: 'We are looking for a talented full-stack developer to join our team.',
      requirements: ['3+ years experience', 'MERN stack proficiency', 'Good communication skills'],
      skills: ['React', 'Node.js', 'MongoDB', 'Express'],
      salary: { min: 80000, max: 120000, currency: 'USD' },
      applyUrl: 'https://example.com/apply',
      postedBy: admin._id,
      isActive: true
    });

    await Job.create({
      title: 'Machine Learning Engineer',
      company: 'AI Solutions Ltd',
      location: 'San Francisco, CA',
      type: 'full-time',
      description: 'Join our AI team to build cutting-edge ML models.',
      requirements: ['MS in CS or related field', 'Python expertise', 'ML frameworks experience'],
      skills: ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning'],
      salary: { min: 100000, max: 150000, currency: 'USD' },
      applyUrl: 'https://example.com/apply-ml',
      postedBy: admin._id,
      isActive: true
    });

    await Job.create({
      title: 'Frontend Developer Internship',
      company: 'WebDev Agency',
      location: 'New York, NY',
      type: 'internship',
      description: 'Great opportunity for students to gain real-world experience.',
      requirements: ['Currently enrolled in CS program', 'React knowledge'],
      skills: ['React', 'JavaScript', 'HTML', 'CSS'],
      salary: { min: 20, max: 25, currency: 'USD' },
      applyUrl: 'https://example.com/internship',
      postedBy: admin._id,
      isActive: true
    });

    console.log('✅ Jobs created');

    // Create mentorships
    console.log('🤝 Creating mentorships...');
    await Mentorship.create({
      mentor: instructor1._id,
      mentee: student1._id,
      topic: 'Career guidance in web development',
      description: 'Looking for advice on transitioning to a full-stack role',
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      duration: 60,
      status: 'confirmed',
      roomId: 'mentorship-room-1'
    });

    await Mentorship.create({
      mentor: instructor2._id,
      mentee: student2._id,
      topic: 'ML project review',
      description: 'Need feedback on my ML project',
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      duration: 45,
      status: 'requested',
      roomId: 'mentorship-room-2'
    });

    console.log('✅ Mentorships created');

    console.log('\n🎉 Seed data created successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('Admin: admin@elearn.com / password123');
    console.log('Instructor 1: john@elearn.com / password123');
    console.log('Instructor 2: jane@elearn.com / password123');
    console.log('Student 1: alice@elearn.com / password123');
    console.log('Student 2: bob@elearn.com / password123');
    console.log('Student 3: charlie@elearn.com / password123');

  } catch (error) {
    console.error('❌ Seed error:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
};

connectDB().then(() => seedData());
