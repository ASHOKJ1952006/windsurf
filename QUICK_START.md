# ⚡ Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Install MongoDB
If you don't have MongoDB installed:

**Windows:**
```bash
# Download from https://www.mongodb.com/try/download/community
# Or use Chocolatey:
choco install mongodb
```

**Start MongoDB:**
```bash
mongod
```

### Step 2: Setup Environment
```bash
# Copy environment file
copy server\.env.sample server\.env
```

**Edit `server\.env`** (use any text editor):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/elearn
JWT_SECRET=my_super_secret_jwt_key_12345
JWT_REFRESH_SECRET=my_refresh_secret_67890
CLIENT_URL=http://localhost:5173
```

### Step 3: Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ..\client
npm install
```

### Step 4: Seed Database (Recommended)
```bash
cd ..\server
npm run seed
```

**You'll see:**
- ✅ 6 test users created
- ✅ 3 sample courses created
- ✅ Enrollments, reviews, forum posts, jobs created

### Step 5: Run the Application

**Open TWO terminals:**

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```
✅ Server running on http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
✅ Client running on http://localhost:5173

### Step 6: Login & Explore! 🎉

Open browser: **http://localhost:5173**

**Test Accounts:**

| Role | Email | Password |
|------|-------|----------|
| **Student** | alice@elearn.com | password123 |
| **Instructor** | john@elearn.com | password123 |
| **Admin** | admin@elearn.com | password123 |

---

## 🎯 What to Try

### As a Student (alice@elearn.com)
1. ✅ View enrolled courses in dashboard
2. ✅ Browse course catalog
3. ✅ Check recommendations
4. ✅ Try the chatbot assistant
5. ✅ Visit the forum
6. ✅ Check job board

### As an Instructor (john@elearn.com)
1. ✅ View your courses
2. ✅ See student enrollments
3. ✅ Check course statistics

### As an Admin (admin@elearn.com)
1. ✅ View platform statistics
2. ✅ Approve/reject courses
3. ✅ Manage users
4. ✅ View all data

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running
```bash
mongod
```

### Port Already in Use
```
Error: Port 5000 is already in use
```
**Solution:** Change port in `server\.env`
```env
PORT=5001
```

### Module Not Found
```
Error: Cannot find module 'express'
```
**Solution:** Install dependencies
```bash
cd server
npm install
```

---

## 📱 Features to Explore

### 🎓 Learning Features
- Browse courses with filters
- Enroll in courses
- Track progress
- Get AI recommendations
- Earn XP and badges
- Download certificates

### 💬 Community
- Forum discussions
- Ask questions
- Upvote answers
- Connect with learners

### 🧑‍🏫 Mentorship
- Request mentorship sessions
- Book time slots
- Get personalized guidance

### 💼 Career
- Browse job listings
- Apply to jobs
- Build your portfolio

### 🤖 AI Assistant
- Ask questions
- Get course recommendations
- Navigate the platform

---

## 🎨 UI Features

- **Dark Mode**: Toggle in settings (coming soon)
- **Responsive**: Works on mobile, tablet, desktop
- **Modern Design**: Tailwind CSS
- **Icons**: Lucide React icons
- **Notifications**: Toast notifications

---

## 📊 Sample Data Included

After running `npm run seed`:

- **6 Users**: 1 admin, 2 instructors, 3 students
- **3 Courses**: MERN Stack, Machine Learning, React
- **Enrollments**: Students enrolled in courses
- **Reviews**: Course ratings and comments
- **Forum Posts**: Sample discussions
- **Jobs**: 3 job listings
- **Mentorships**: Sample sessions

---

## 🔧 Development Tips

### Hot Reload
Both frontend and backend support hot reload:
- **Frontend**: Changes auto-refresh
- **Backend**: Nodemon auto-restarts

### API Testing
Backend API available at: **http://localhost:5000/api**

Test endpoints:
- GET http://localhost:5000/api/health
- GET http://localhost:5000/api/courses
- POST http://localhost:5000/api/auth/login

### Database Viewing
Use MongoDB Compass to view data:
```
mongodb://127.0.0.1:27017/elearn
```

---

## 📚 Next Steps

1. **Explore the code**: Check `server/` and `client/` folders
2. **Read the docs**: See `README.md` for full documentation
3. **Customize**: Modify features to your needs
4. **Extend**: Add new features (see PROJECT_SUMMARY.md)

---

## 🎉 You're All Set!

The platform is now running locally. Enjoy exploring all the features!

**Questions?** Check the main README.md for detailed documentation.
