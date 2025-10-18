// Test Script for Job Application System
// Run this in browser console or as a Node.js script

const API_BASE = 'http://localhost:5000/api';

// Test data
const testApplication = {
  personalInfo: {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    location: 'New York, NY'
  },
  experience: 'Software Developer with 3 years experience in React and Node.js',
  education: 'Bachelor of Science in Computer Science',
  skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
  resumeUrl: 'https://drive.google.com/file/d/sample-resume',
  portfolioUrl: 'https://johndoe.dev',
  coverLetter: 'I am excited to apply for this position...'
};

// Test Functions
async function testJobApplicationFlow() {
  console.log('🧪 Testing Job Application System...\n');

  try {
    // 1. Test fetching jobs
    console.log('1. Fetching available jobs...');
    const jobsResponse = await fetch(`${API_BASE}/jobs`);
    const jobsData = await jobsResponse.json();
    console.log(`✅ Found ${jobsData.jobs?.length || 0} jobs`);

    if (!jobsData.jobs || jobsData.jobs.length === 0) {
      console.log('❌ No jobs available for testing');
      return;
    }

    const testJob = jobsData.jobs[0];
    console.log(`📋 Testing with job: ${testJob.title} at ${testJob.company}\n`);

    // 2. Test student application submission
    console.log('2. Testing student application submission...');
    const token = localStorage.getItem('token'); // Assumes user is logged in
    
    if (!token) {
      console.log('❌ No authentication token found. Please login first.');
      return;
    }

    const applyResponse = await fetch(`${API_BASE}/job-applications/apply/${testJob._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testApplication)
    });

    const applyData = await applyResponse.json();
    
    if (applyData.success) {
      console.log('✅ Application submitted successfully');
      console.log(`📝 Application ID: ${applyData.application._id}`);
    } else {
      console.log('❌ Application submission failed:', applyData.message);
    }

    // 3. Test fetching user applications
    console.log('\n3. Testing user applications fetch...');
    const myAppsResponse = await fetch(`${API_BASE}/job-applications/my`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const myAppsData = await myAppsResponse.json();
    console.log(`✅ Found ${myAppsData.applications?.length || 0} user applications`);

    // 4. Test admin functionality (if admin token available)
    console.log('\n4. Testing admin functionality...');
    const adminAppsResponse = await fetch(`${API_BASE}/job-applications/admin/all`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (adminAppsResponse.ok) {
      const adminAppsData = await adminAppsResponse.json();
      console.log(`✅ Admin can view ${adminAppsData.applications?.length || 0} applications`);
      
      // Test status update if applications exist
      if (adminAppsData.applications && adminAppsData.applications.length > 0) {
        const testAppId = adminAppsData.applications[0]._id;
        
        console.log('\n5. Testing status update...');
        const statusUpdateResponse = await fetch(`${API_BASE}/job-applications/admin/${testAppId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'reviewing',
            note: 'Application under review - automated test'
          })
        });

        const statusUpdateData = await statusUpdateResponse.json();
        if (statusUpdateData.success) {
          console.log('✅ Status update successful');
          console.log('🔔 Notification should be sent to student');
        } else {
          console.log('❌ Status update failed:', statusUpdateData.message);
        }
      }
    } else {
      console.log('ℹ️ Admin functionality not accessible (user may not be admin)');
    }

    console.log('\n🎉 Job Application System test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Socket.IO Test
function testSocketConnection() {
  console.log('🔌 Testing Socket.IO connection...');
  
  if (typeof io === 'undefined') {
    console.log('❌ Socket.IO not loaded. Include socket.io-client library first.');
    return;
  }

  const socket = io('http://localhost:5000');
  
  socket.on('connect', () => {
    console.log('✅ Socket.IO connected:', socket.id);
    
    // Join user room (replace with actual user ID)
    const userId = 'USER_ID_HERE';
    socket.emit('join-user-room', userId);
    console.log(`📡 Joined user room: user_${userId}`);
  });

  socket.on('notification', (notification) => {
    console.log('🔔 Received notification:', notification);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket.IO disconnected');
  });

  // Test notification after 5 seconds
  setTimeout(() => {
    socket.disconnect();
    console.log('🔚 Socket.IO test completed');
  }, 5000);
}

// Manual test functions for browser console
window.testJobApplicationSystem = testJobApplicationFlow;
window.testSocketConnection = testSocketConnection;

console.log(`
🧪 Job Application System Test Suite Loaded!

Available test functions:
- testJobApplicationSystem() - Test complete application flow
- testSocketConnection() - Test real-time notifications

Prerequisites:
1. Backend server running on http://localhost:5000
2. User logged in (JWT token in localStorage)
3. At least one job posting available

Usage:
1. Open browser console
2. Run: testJobApplicationSystem()
3. Check console output for test results

For Socket.IO testing:
1. Include Socket.IO client library
2. Run: testSocketConnection()
`);

// Auto-run tests if in Node.js environment
if (typeof window === 'undefined') {
  console.log('Running in Node.js environment - skipping browser-specific tests');
}
