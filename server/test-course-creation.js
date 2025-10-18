/**
 * Test script to verify course creation works
 * Run with: node test-course-creation.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

console.log('🧪 Testing Course Creation...\n');

async function testCourseCreation() {
  try {
    // Connect to MongoDB
    console.log('1. Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('   ✅ MongoDB connected successfully');

    // Load models
    console.log('2. Loading Course model...');
    const Course = require('./models/Course');
    console.log('   ✅ Course model loaded successfully');

    // Test course data
    const testCourseData = {
      title: 'Test Course - ' + Date.now(),
      description: 'This is a test course description',
      category: 'Web Development',
      level: 'beginner',
      price: 0,
      isPremium: false,
      instructor: new mongoose.Types.ObjectId(), // Fake instructor ID for test
      modules: [
        {
          title: 'Test Module 1',
          description: 'Test module description',
          lectures: [
            {
              title: 'Test Lecture 1',
              description: 'Test lecture description',
              type: 'video',
              videoUrl: 'https://example.com/video.mp4',
              duration: 30
            }
          ]
        }
      ],
      status: 'published',
      isApproved: true
    };

    console.log('3. Testing course creation...');
    console.log('   Course data:', {
      title: testCourseData.title,
      category: testCourseData.category,
      modulesCount: testCourseData.modules.length
    });

    const course = await Course.create(testCourseData);
    console.log('   ✅ Course created successfully with ID:', course._id);

    // Test calculateDuration method
    console.log('4. Testing calculateDuration method...');
    course.calculateDuration();
    await course.save();
    console.log('   ✅ Duration calculated:', course.totalDuration, 'minutes');

    // Clean up - delete test course
    console.log('5. Cleaning up test data...');
    await Course.findByIdAndDelete(course._id);
    console.log('   ✅ Test course deleted');

    console.log('\n✅ All course creation tests passed!');
    console.log('\n📝 Course creation should work properly now.');
    console.log('   Try creating a course in the frontend.');

  } catch (error) {
    console.error('\n❌ Course creation test failed:');
    console.error('Error:', error.message);
    
    if (error.name === 'ValidationError') {
      console.error('Validation errors:');
      Object.values(error.errors).forEach(err => {
        console.error('  -', err.message);
      });
    }
    
    console.error('\n📝 Stack trace:');
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected');
  }
}

testCourseCreation();
