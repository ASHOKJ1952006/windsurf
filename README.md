# 🎓 MERN E-Learning Platform

A full-featured e-learning platform with course recommendations, built with MongoDB, Express.js, React (Vite), and Node.js.

## 🌟 Features

### 🔐 Authentication & User Management
- JWT-based authentication (register, login, logout, refresh tokens)
- Three roles: **Student**, **Instructor**, **Admin**
- User profiles with skills, goals, interests, bio, and profile pictures
- Gamification: XP points, levels, badges, and streak tracking
- Social features: follow/unfollow users

### 📚 Courses & Learning
- **Course CRUD** for instructors (create, update, delete)
- Course structure: sections → lectures (video, text, quiz, assignment)
- Video streaming with progress tracking
- Quizzes with auto-grading
- Assignment submissions
- **Auto-generated PDF certificates** upon completion
- Course ratings & reviews
- Wishlist/saved courses

### 📊 Enrollment & Progress
- Enroll in courses
- Track lecture-by-lecture progress (watched %, completed status)
- Dashboard progress bars
- Completion unlocks certificates & XP
- Prevent duplicate enrollments

### 🤖 AI Recommendation System
- **Content-based filtering**: matches user skills/goals with course tags
- **Collaborative filtering**: suggests courses from similar users
- **Trending courses**: boosts popular & highly-rated courses
- Learning paths (career roadmaps like "Full Stack Developer")

### 💬 Community & Social Learning
- **Forum**: post questions, answers, comments with upvotes
- **Study Groups**: group chat with Socket.IO
- **Direct Messages**: peer-to-peer chat
- Leaderboards for most active learners

### 🧑‍🏫 Mentorship
- Mentors offer time slots for 1:1 or group sessions
- Book mentorship via calendar
- Session status: requested, confirmed, completed, cancelled
- Feedback & ratings after sessions
- Real-time chat (Socket.IO)

### 💼 Job Board & Career Tools
- Job listings with filters (skill, location, type)
- Apply to jobs
- Resume builder (from user profile)
- Portfolio showcase (certificates, badges, courses)

### 🤖 Chatbot Assistant
- FAQ support (login, certificates, navigation)
- Course recommendations
- Redirects to forum/mentorship

### 🎛️ Role-Based Dashboards
- **Student**: enrolled courses, progress, recommendations, chatbot, badges
- **Instructor**: manage courses, track enrollments, student stats
- **Admin**: user management, course approvals, analytics, flagged posts

### ⚡ Additional Features
- Dark mode support
- Real-time notifications (Socket.IO)
- Multi-language placeholder
- Responsive design (Tailwind CSS)
- PDF certificate generation

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16+)
- **MongoDB** (local or cloud)
- **npm** or **yarn**

### 1️⃣ Clone & Setup Environment

```bash
# Copy environment file
cp server/.env.sample server/.env
```

Edit `server/.env` with your values:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/elearn
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_REFRESH_SECRET=your_refresh_secret_change_this
CLIENT_URL=http://localhost:5173
```

### 2️⃣ Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3️⃣ Seed Sample Data (Optional but Recommended)

```bash
cd server
npm run seed
```

This creates:
- 1 Admin, 2 Instructors, 3 Students
- 3 Sample courses with sections & lectures
- Enrollments, reviews, forum posts, jobs, mentorships

**Test Accounts:**
- **Admin**: `admin@elearn.com` / `password123`
- **Instructor**: `john@elearn.com` / `password123`
- **Instructor**: `jane@elearn.com` / `password123`
- **Student**: `alice@elearn.com` / `password123`
- **Student**: `bob@elearn.com` / `password123`
- **Student**: `charlie@elearn.com` / `password123`

### 4️⃣ Run Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```
Server runs on: **http://localhost:5000**

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
Client runs on: **http://localhost:5173**

---

## 📁 Project Structure

```
├── server/                 # Backend (Node.js + Express + MongoDB)
│   ├── config/            # Database config
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Auth, upload, etc.
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API routes
│   ├── scripts/           # Seed script
│   ├── uploads/           # File uploads (videos, images, PDFs)
│   └── server.js          # Entry point
│
├── client/                # Frontend (React + Vite + Tailwind)
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   │   └── dashboards/  # Role-based dashboards
│   │   ├── store/        # Redux Toolkit slices
│   │   ├── utils/        # API client, helpers
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # Entry point
│   ├── index.html
│   └── package.json
│
└── README.md
```

---

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **JWT** (authentication)
- **Socket.IO** (real-time chat/notifications)
- **Multer** (file uploads)
- **PDFKit** (certificate generation)
- **bcryptjs** (password hashing)
- **Nodemailer** (email notifications - optional)

### Frontend
- **React 18** (Vite)
- **Redux Toolkit** (state management)
- **React Router v6** (routing)
- **Tailwind CSS** (styling)
- **Axios** (HTTP client)
- **Socket.IO Client** (real-time)
- **Lucide React** (icons)
- **React Hot Toast** (notifications)

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - Get all courses (with filters)
- `GET /api/courses/:id` - Get single course
- `POST /api/courses` - Create course (Instructor/Admin)
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `POST /api/courses/:id/reviews` - Add review

### Enrollments
- `POST /api/enrollments/:courseId` - Enroll in course
- `GET /api/enrollments/my` - Get my enrollments
- `PUT /api/enrollments/:id/progress` - Update progress
- `POST /api/enrollments/:id/certificate` - Generate certificate

### Forum
- `GET /api/forums` - Get all posts
- `GET /api/forums/:id` - Get single post
- `POST /api/forums` - Create post
- `POST /api/forums/:id/answers` - Add answer
- `POST /api/forums/:id/upvote` - Upvote post

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create job (Admin/Instructor)
- `POST /api/jobs/:id/apply` - Apply to job

### Recommendations
- `GET /api/recommendations` - Get personalized recommendations
- `GET /api/recommendations/learning-paths` - Get learning paths

### Mentorships
- `GET /api/mentorships` - Get mentorships
- `POST /api/mentorships` - Create mentorship request
- `PUT /api/mentorships/:id` - Update mentorship
- `POST /api/mentorships/:id/feedback` - Submit feedback

### Chatbot
- `POST /api/chatbot/chat` - Chat with AI assistant

### Admin
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/courses/:id/approve` - Approve course
- `DELETE /api/admin/courses/:id` - Delete course

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read

---

## 🎯 Usage Guide

### As a Student
1. Register/Login
2. Browse courses and enroll
3. Track progress in dashboard
4. Complete lectures, quizzes, assignments
5. Get AI-powered recommendations
6. Participate in forums
7. Request mentorship
8. Apply to jobs
9. Earn XP, badges, and certificates

### As an Instructor
1. Register as instructor
2. Create courses with sections & lectures
3. Upload videos and materials
4. Track student enrollments
5. Respond to student questions
6. Offer mentorship sessions
7. View analytics

### As an Admin
1. Login with admin account
2. View platform statistics
3. Approve/reject courses
4. Manage users
5. Moderate forum posts
6. Post job listings

---

## 🔧 Configuration

### MongoDB
Ensure MongoDB is running locally or use MongoDB Atlas:
```bash
# Local MongoDB
mongod

# Or use Atlas connection string in .env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/elearn
```

### File Uploads
Files are stored in `server/uploads/`:
- `profiles/` - Profile pictures
- `videos/` - Course videos
- `documents/` - Course materials
- `assignments/` - Student submissions
- `certificates/` - Generated PDFs

---

## 🐛 Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check `MONGO_URI` in `.env`

**Port Already in Use:**
- Change `PORT` in `server/.env`
- Change `server.port` in `client/vite.config.js`

**CORS Issues:**
- Verify `CLIENT_URL` in `server/.env`
- Check CORS settings in `server/server.js`

---

## 📝 License

This project is for educational purposes.

---

## 🙏 Acknowledgments

Built with the MERN stack for local development and learning. 
