# 🔧 Fix 404 Error for Portfolio Routes

## The Problem
You're getting a **404 Not Found** error when trying to access the portfolio page. This means the server can't find the `/api/portfolios/my` endpoint.

---

## ✅ Solution: Restart Your Server

### Step 1: Stop the Server
Press `Ctrl+C` in the terminal where your server is running

### Step 2: Restart the Server
```bash
cd server
npm run dev
```

### Step 3: Wait for Confirmation
You should see:
```
✅ MongoDB connected
🚀 Server running on http://localhost:5000
```

### Step 4: Test the Portfolio API
Open a new terminal and run:
```bash
# Test if portfolio routes are loaded
curl http://localhost:5000/api/health
```

You should get: `{"status":"OK","timestamp":"..."}`

---

## 🧪 Verify Everything is Working

### Option 1: Test Script (Recommended)
```bash
cd server
node test-portfolio-routes.js
```

If all tests pass, you'll see:
```
✅ All portfolio components loaded successfully!
```

### Option 2: Manual Test
Open your browser console (F12) and run:
```javascript
// Test portfolio API
fetch('/api/portfolios/my', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(res => res.json())
.then(data => console.log('Portfolio:', data))
.catch(err => console.error('Error:', err))
```

---

## 🚨 If Server Won't Start

### Check for Errors

**Look for these common issues:**

1. **Port Already in Use**
   ```
   Error: listen EADDRINUSE: address already in use :::5000
   ```
   **Fix:** Kill the process using port 5000
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID_NUMBER> /F
   
   # Or change port in .env
   PORT=5001
   ```

2. **Missing Dependencies**
   ```
   Error: Cannot find module 'axios'
   ```
   **Fix:** Install dependencies
   ```bash
   cd server
   npm install axios
   ```

3. **MongoDB Not Running**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:27017
   ```
   **Fix:** Start MongoDB
   ```bash
   # Windows
   net start MongoDB
   
   # Or use MongoDB Atlas (cloud)
   # Update MONGO_URI in .env file
   ```

4. **Syntax Error in Code**
   ```
   SyntaxError: Unexpected token
   ```
   **Fix:** Check the error message for file and line number

---

## 📝 Checklist

Run through this checklist:

- [ ] Server is running (`npm run dev` in server folder)
- [ ] MongoDB is connected (check server logs)
- [ ] No errors in server terminal
- [ ] Browser is accessing correct URL (`http://localhost:5173`)
- [ ] User is logged in (check localStorage for 'token')
- [ ] Network tab shows request to `/api/portfolios/my`

---

## 🔍 Debugging Steps

### 1. Check Server Logs
Look for:
```
✅ MongoDB connected
🚀 Server running on http://localhost:5000
```

### 2. Check Browser Console
Open DevTools (F12) → Console tab
Look for errors or failed requests

### 3. Check Network Tab
Open DevTools (F12) → Network tab
- Find the failed request to `/api/portfolios/my`
- Click on it to see details
- Check the "Response" tab for error message
- Check "Headers" tab for status code

### 4. Verify Authentication
In browser console, run:
```javascript
console.log('Token:', localStorage.getItem('token'))
```

If null, you need to login again.

### 5. Test API Directly
Use a REST client (Postman, Insomnia) or curl:
```bash
# Get your token from browser localStorage first
curl http://localhost:5000/api/portfolios/my \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🎯 Quick Fix Commands

Run these in order:

```bash
# 1. Stop server (Ctrl+C)

# 2. Go to server directory
cd server

# 3. Install any missing dependencies
npm install

# 4. Run test script
node test-portfolio-routes.js

# 5. Start server
npm run dev

# 6. In another terminal, go to client
cd ../client

# 7. Make sure client is running
npm run dev
```

---

## 📊 Expected API Endpoints

After fixing, these should work:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/portfolios/my` | GET | Yes | Get your portfolio |
| `/api/portfolios/my` | PUT | Yes | Update portfolio |
| `/api/portfolios/public/:slug` | GET | No | View public portfolio |
| `/api/portfolios/projects` | POST | Yes | Add project |
| `/api/portfolios/sync-courses` | POST | Yes | Sync courses |
| `/api/portfolios/github/connect` | POST | Yes | Connect GitHub |
| `/api/portfolios/analytics` | GET | Yes | Get analytics |

---

## 💡 Common Mistakes

1. **Forgot to restart server** after adding new files
   - **Fix:** Always restart after code changes

2. **Wrong API URL** in frontend
   - Check: Should be `/api/portfolios/my` not `/portfolios/my`

3. **Not logged in**
   - **Fix:** Login again, check token in localStorage

4. **CORS issues**
   - Server should have CORS enabled for `http://localhost:5173`
   - Check `server.js` for CORS configuration

5. **Database connection failed**
   - Check MongoDB is running
   - Verify MONGO_URI in `.env` file

---

## ✅ Success Indicators

You'll know it's fixed when:

1. ✅ Server starts without errors
2. ✅ No 404 errors in browser console
3. ✅ Portfolio editor loads successfully
4. ✅ You can save portfolio changes
5. ✅ Public portfolio page works

---

## 🆘 Still Not Working?

### Check These Files Exist:

```bash
server/
├── models/
│   ├── Portfolio.js              ✅ Should exist
│   └── PortfolioAnalytics.js     ✅ Should exist
├── services/
│   ├── githubService.js          ✅ Should exist
│   └── linkedinService.js        ✅ Should exist
├── controllers/
│   └── portfolioController.js    ✅ Should exist
└── routes/
    └── portfolios.js             ✅ Should exist
```

### Verify in server.js:

```javascript
// Around line 111 in server.js
app.use('/api/portfolios', require('./routes/portfolios'));
```

This line MUST be present!

---

## 🔄 Nuclear Option (Last Resort)

If nothing works, rebuild:

```bash
# 1. Stop all servers

# 2. Clear node_modules
cd server
rm -rf node_modules package-lock.json
npm install

cd ../client
rm -rf node_modules package-lock.json
npm install

# 3. Clear browser cache
# - Open DevTools (F12)
# - Right-click refresh button
# - Select "Empty Cache and Hard Reload"

# 4. Start fresh
cd ../server
npm run dev

# In another terminal
cd client
npm run dev

# 5. Login again
```

---

## 📞 Need More Help?

1. Check server terminal for error messages
2. Check browser console for JavaScript errors
3. Verify all new files were created correctly
4. Make sure MongoDB is running
5. Confirm you're logged in with a valid token

---

## ✅ After Fixing

Once the 404 error is resolved:

1. Navigate to `/portfolio/editor`
2. You should see the Portfolio Editor page
3. Start customizing your portfolio!

**Your portfolio will be accessible at:**
- Editor: `http://localhost:5173/portfolio/editor`
- Public: `http://localhost:5173/portfolio/your-slug`
- Analytics: `http://localhost:5173/portfolio/analytics`

---

**Remember:** The most common fix is simply **restarting the server**! 🔄
