# 🚀 MiniChatGPT - AI Chat Application

A production-ready fullstack web application for AI-powered conversations with user authentication, chat history management, and admin dashboard.

**Tech Stack:** 
- 🎨 Frontend: React + Vite | Vercel
- 🖥️ Backend: Node.js + Express | Render
- 💾 Database: PostgreSQL | Supabase
- 🤖 AI: Google Generative AI (Gemini)

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git account (to push to Github)
- Accounts for: Supabase, Render, Vercel (for deployment)

### Local Development

**Windows:**
```bash
setup.bat
```

**macOS/Linux:**
```bash
bash setup.sh
```

Or manually:
```bash
# Backend
cd backend
cp .env.example .env
# Update .env with your credentials
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Access at: `http://localhost:5173`

---

## 🚀 Deployment

### Three-Step Deployment Process

#### Step 1: Push to GitHub
Before deploying, push your project to GitHub for version control and auto-deployment:

- **Quick Guide**: See [PUSH_GITHUB_QUICK.md](./PUSH_GITHUB_QUICK.md) (10 minutes)
- **Automated Script**: 
  - Windows: `.\push-to-github.ps1`
  - macOS/Linux: `bash push-to-github.sh`
- **Complete Guide**: See [GITHUB_PUSH_GUIDE.md](./GITHUB_PUSH_GUIDE.md)
- **Setup Checklist**: See [GITHUB_COMPLETE_CHECKLIST.md](./GITHUB_COMPLETE_CHECKLIST.md)
- **Workflow**: See [GITHUB_DEPLOYMENT_WORKFLOW.md](./GITHUB_DEPLOYMENT_WORKFLOW.md)

#### Step 2: Deploy Services

**Complete setup guide:** See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

**Quick reference:** See [DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md)

Services configured:
1. **Database**: Supabase (PostgreSQL)
   - Free tier: 500 MB storage
   - Auto-backup enabled

2. **Backend**: Render
   - Free tier: Limited resources
   - Auto-deploy from GitHub enabled

3. **Frontend**: Vercel
   - Free tier: Unlimited deployments
   - Auto-deploy from GitHub enabled

**Estimated total setup time:** 45 minutes

#### Step 3: Connect Auto-Deploy

After pushing to GitHub, Render and Vercel will automatically:
- Rebuild on every `git push`
- Deploy new versions instantly
- Show logs for debugging

---

### 📚 All Deployment Documentation

| Document | Purpose | Time |
|----------|---------|------|
| [START_HERE.md](./START_HERE.md) | 30-min quick start | 30 min |
| [PUSH_GITHUB_QUICK.md](./PUSH_GITHUB_QUICK.md) | Quick GitHub push | 10 min |
| [GITHUB_PUSH_GUIDE.md](./GITHUB_PUSH_GUIDE.md) | Complete GitHub guide | 20 min |
| [GITHUB_COMPLETE_CHECKLIST.md](./GITHUB_COMPLETE_CHECKLIST.md) | Full checklist | - |
| [GITHUB_DEPLOYMENT_WORKFLOW.md](./GITHUB_DEPLOYMENT_WORKFLOW.md) | Auto-deploy workflow | - |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Full deployment guide | 45 min |
| [DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md) | Quick reference | - |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Setup checklist | - |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture | - |
| [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) | Database migration | - |

---

### 🔧 Environment Variables

Before deployment, create these environment files:

**Backend** (`backend/.env`):
```env
DB_HOST=your-supabase-host.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=postgres
JWT_SECRET=your-random-secret-32-chars
GEMINI_API_KEY=your-google-api-key
GEMINI_MODEL=gemini-pro
NODE_ENV=production
CLIENT_ORIGIN=https://your-frontend.vercel.app
```

**Frontend** (`frontend/.env.production`):
```env
VITE_API_BASE_URL=https://your-backend.onrender.com
```

See [ENV_REFERENCE.md](./ENV_REFERENCE.md) for detailed guide.

---

### 💰 Cost Estimate

```
Supabase (Database):  $0/month (free tier)
Render (Backend):     $0/month (free tier, sleeps after 15min)
Vercel (Frontend):    $0/month (free tier, unlimited)
────────────────────────────────────
TOTAL:                $0/month ✅
```

Upgrade only when needed for better performance.

---

## ✨ Features

### Core Chat Features
- 💬 **Real-time AI Chat** - Powered by Google Gemini API
- 📝 **Conversation History** - Save and manage chat conversations
- 🔄 **Smart Error Handling** - Automatic retry logic for failures
- ⚠️ **Quota Management** - Graceful handling of API quotas
- 🎯 **Message Caching** - Reduce API calls with smart caching

### User Management
- 🔐 **Secure Authentication** - JWT-based with bcrypt
- 👤 **User Profiles** - Register, login, logout
- 🛡️ **Role-Based Access** - Admin and user roles
- 📊 **User Statistics** - Activity dashboard

### Admin Features
- 👥 **User Management** - View and manage users
- 📈 **Usage Analytics** - Track API usage
- 🔍 **Conversation Browsing** - View user chats
- ⚙️ **System Monitoring** - Health checks and logs

### User Experience
- 📱 **Fully Responsive** - Works on all devices
- 🎨 **Dark/Light Theme** - Theme toggle
- ⌨️ **Keyboard Shortcuts** - Enter to send
- 🎯 **Sidebar Navigation** - Quick access
- ♿ **Accessible UI** - WCAG-compliant

---

## 🏗️ Project Structure

```
MiniChatGPT/
│   ├── src/
│   │   ├── pages/              # Page components (Chat, Login, History, Admin)
│   │   ├── components/         # Reusable components (AppShell, Auth, etc)
│   │   ├── state/              # React context (auth, theme)
│   │   ├── utils/              # Utilities (error classifier, caching, etc)
│   │   ├── api/                # API client configuration
│   │   ├── App.jsx
│   │   └── styles.css          # Responsive design (mobile-first)
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                     # Node.js + Express API
│   ├── src/
│   │   ├── routes/             # API endpoints (auth, chat, conversations)
│   │   ├── middleware/         # Auth, error handling, logging
│   │   ├── utils/              # Gemini API, error handler, caching, rate limiter
│   │   ├── app.js              # Express app setup
│   │   ├── server.js           # Server entry point
│   │   └── db.js               # Database connection
│   ├── .env.example
│   └── package.json
│
├── database/
│   └── mini_chatgpt.sql        # MySQL schema
│
│
└── README.md                    # This file
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ (LTS recommended)
- **MySQL** 8.0+ (local or remote)
- **Google API Key** for Gemini API

### 1️⃣ Database Setup

```bash
# Create database
mysql -u root -p < database/mini_chatgpt.sql

# Make yourself admin (optional)
mysql -u root -p
UPDATE users SET role='admin' WHERE email='your_email@example.com';
```

### 2️⃣ Backend Setup

```bash
cd backend

# Copy and configure environment
cp .env.example .env
# Edit .env with your values:
# - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
# - JWT_SECRET (generate a random string)
# - GEMINI_API_KEY (from Google AI Studio)
# - CLIENT_ORIGIN=http://localhost:5173

# Install and run
npm install
npm run dev
```

Backend runs at `http://localhost:5000`

### 3️⃣ Frontend Setup

```bash
cd frontend

# Copy environment (optional - uses defaults)
cp .env.example .env

# Install and run
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## ⚙️ Configuration

### Backend Environment Variables

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=mini_chatgpt

# JWT
JWT_SECRET=your_random_secret_key_here

# Google Gemini API
GEMINI_API_KEY=your_google_api_key
GEMINI_MODEL=gemini-1.5-flash

# CORS
CLIENT_ORIGIN=http://localhost:5173

# Node Environment
NODE_ENV=development
PORT=5000
```

### Frontend Environment Variables

```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register` | Register new user |
| `POST` | `/login` | Login user |
| `POST` | `/logout` | Clear session |

### Conversation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/conversations` | Get all user conversations |
| `POST` | `/conversations` | Create new conversation |
| `GET` | `/conversations/:id` | Get conversation with messages |
| `DELETE` | `/conversations/:id` | Delete conversation |
| `POST` | `/conversations/:id/messages` | Send message to conversation |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users` | Get all users (admin only) |
| `DELETE` | `/users/:id` | Delete user (admin only) |

---

## 🔧 Development

### Start Development Environment

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Running Tests

```bash
# Backend tests (if available)
cd backend
npm test

# Frontend tests (if available)
cd frontend
npm test
```

### Code Structure Best Practices

- **React Components**: Keep components focused and reusable
- **API Calls**: Use `api/client.js` for all requests
- **Error Handling**: Use `errorClassifier.js` to categorize errors
- **State Management**: Use React context for auth and theme
- **Styling**: Use CSS variables for consistent theming

---

## 🚨 Troubleshooting

### Common Issues

**Problem: 429 Too Many Requests**
- **Cause**: API quota exceeded
- **Fix**: Check your Gemini API quota, wait until next day for reset

**Problem: Database connection failed**
- Check MySQL is running: `mysql -u root -p -e "SELECT 1"`
- Verify `.env` credentials match MySQL
- Ensure database exists: `CREATE DATABASE mini_chatgpt;`

**Problem: CORS errors**
- Verify `CLIENT_ORIGIN` in backend `.env` matches frontend URL
- Check both backend and frontend are running
- Clear browser cache and retry

**Problem: Conversations not loading**
- Check user is logged in (JWT token valid)
- Verify conversation belongs to logged-in user (security check)
- Check backend logs for database errors

**Problem: Slow responses**
- Check cache is enabled (should improve 2nd+ calls)
- Monitor API rate limits in backend logs
- Consider upgrading Gemini API plan

---

## 🐳 Docker Deployment (Optional)

```bash
# Build backend image
cd backend
docker build -t minichatgpt-backend .

# Build frontend image
cd frontend
docker build -t minichatgpt-frontend .

# Run with docker-compose
docker-compose up -d
```

---

## 📊 Performance Tips

1. **Enable Caching**
   - Response caching reduces API calls
   - Cache is cleared when user logs out

2. **Optimize Conversations**
   - Archive old conversations to reduce queries
   - Use pagination for large conversation lists

3. **Rate Limiting**
   - Default: 100 requests per 15 minutes per user
   - Adjust in `backend/src/utils/rateLimiter.js` if needed

4. **Database Optimization**
   - Create indexes on frequently queried columns
   - Archive messages older than 90 days

---

## 🔐 Security

- ✅ **Password Hashing**: bcryptjs with salt rounds
- ✅ **JWT Tokens**: Secure, HttpOnly cookies
- ✅ **SQL Injection Prevention**: Parameterized queries
- ✅ **CORS Protection**: Whitelist allowed origins
- ✅ **Rate Limiting**: Per-user request throttling
- ✅ **XSS Protection**: React's built-in escaping
- ✅ **CSRF Protection**: SameSite cookie flag

---

## 🧪 Testing Checklist

- [ ] Register new user
- [ ] Login with correct/incorrect credentials
- [ ] Send message and receive AI response
- [ ] Save conversation to history
- [ ] Load previous conversation
- [ ] Delete conversation
- [ ] View admin dashboard
- [ ] Delete user (admin only)
- [ ] Toggle dark/light theme
- [ ] Test on mobile device (responsive)
- [ ] Test with quota exhausted (should block sends)

---

## 📱 Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Latest 2 versions |
| Safari | ✅ Latest 2 versions |
| Firefox | ✅ Latest 2 versions |
| Edge | ✅ Latest 2 versions |
| Mobile Chrome | ✅ Latest |
| Mobile Safari | ✅ Latest |

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and test thoroughly
3. Commit: `git commit -m "feat: add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open Pull Request

---

## 📝 License

MIT License - see LICENSE file for details

---

## 📞 Support

For issues or questions:
1. Check [Troubleshooting](#-troubleshooting) section
2. Review relevant guide (see [Documentation](#-documentation))
3. Check backend logs: `tail -f backend.log`
4. Check browser console (F12 → Console tab)

---

## 🎉 Thank You!

Built with ❤️ using React, Node.js, and Google Gemini API

**Status**: ✅ Production Ready | Built: April 2026

