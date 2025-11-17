# 🌊 ChatWave - Discord-Inspired Real-Time Chat Application

A learning project focused on **backend development**, real-time communication, database design, and authentication.

## 🎯 Learning Objectives

### Phase 1: Foundation (Weeks 1-2) ✅ YOU ARE HERE
- [ ] REST API design and implementation
- [ ] Database schema design with PostgreSQL + Prisma
- [ ] JWT Authentication flow
- [ ] Password hashing with bcrypt
- [ ] Express middleware concepts
- [ ] Error handling patterns

### Phase 2: Real-time Features (Weeks 3-4)
- [ ] WebSocket communication with Socket.io
- [ ] Real-time message broadcasting
- [ ] User presence tracking
- [ ] Room-based communication

### Phase 3: Advanced Features (Weeks 5-6)
- [ ] Security best practices (rate limiting, validation)
- [ ] File uploads (avatars, images)
- [ ] Database optimization and indexing
- [ ] Advanced querying

### Phase 4: Deployment (Weeks 7-8)
- [ ] Environment configuration
- [ ] Database migrations
- [ ] Deployment to cloud platform
- [ ] Monitoring and logging

---

## 🏗️ Architecture

```
Frontend (React + TypeScript)
    ↕ HTTP Requests (REST API)
    ↕ WebSocket Connection (Socket.io)
Backend (Node.js + Express)
    ↕ Database Queries (Prisma ORM)
Database (PostgreSQL)
```

---

## 🛠️ Tech Stack

### Backend (Your Focus)
- **Node.js + Express** - Server framework
- **Socket.io** - Real-time WebSocket communication
- **PostgreSQL** - Relational database
- **Prisma** - Modern TypeScript ORM
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **express-validator** - Input validation

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling (Black/Blue/Purple theme)
- **Socket.io-client** - WebSocket client
- **Axios** - HTTP client
- **React Router** - Navigation

---

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ installed
- PostgreSQL 14+ installed
- Git

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 2: Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### Step 3: Database Setup
1. Create a PostgreSQL database:
```sql
CREATE DATABASE chatwave;
```

2. Copy environment variables:
```bash
cd ../backend
cp .env.example .env
```

3. Edit `.env` with your database credentials:
```
DATABASE_URL="postgresql://username:password@localhost:5432/chatwave"
JWT_SECRET="your-super-secret-key-change-this"
```

4. Run Prisma migrations:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### Step 4: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Backend runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 📚 Learning Resources

### Backend Fundamentals
- [Express.js Documentation](https://expressjs.com/)
- [Prisma Getting Started](https://www.prisma.io/docs/getting-started)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Authentication & Security
- [JWT Introduction](https://jwt.io/introduction)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [bcrypt Explained](https://auth0.com/blog/hashing-in-action-understanding-bcrypt/)

### Real-time Communication
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [WebSockets vs HTTP](https://www.pubnub.com/blog/websockets-vs-http/)

### Database Design
- [Database Normalization](https://www.guru99.com/database-normalization.html)
- [SQL Relationships](https://www.databasestar.com/database-relationships/)
- [Prisma Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)

### React Hooks
- [React Hooks Documentation](https://react.dev/reference/react)
- [useEffect Complete Guide](https://overreacted.io/a-complete-guide-to-useeffect/)

---

## 🗂️ Project Structure

```
chatApp/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files (database, JWT)
│   │   ├── controllers/     # Request handlers (business logic)
│   │   ├── middleware/      # Custom middleware (auth, validation)
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic layer
│   │   ├── utils/           # Helper functions
│   │   ├── socket/          # Socket.io event handlers
│   │   └── server.js        # Main entry point
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── contexts/        # React Context providers
│   │   ├── services/        # API and Socket services
│   │   ├── types/           # TypeScript type definitions
│   │   └── App.tsx
│   └── package.json
└── README.md
```

---

## 🎨 Design Theme

**Color Palette:**
- Background: `#0a0a0f` (Deep Black)
- Secondary: `#1a1a2e` (Dark Blue-Black)
- Primary: `#6366f1` (Indigo/Blue)
- Accent: `#8b5cf6` (Purple)
- Text: `#e5e7eb` (Light Gray)

---

## 🚀 API Endpoints (Phase 1)

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Servers
- `POST /api/servers` - Create server (requires auth)
- `GET /api/servers` - Get user's servers (requires auth)
- `GET /api/servers/:id` - Get server details (requires auth)
- `POST /api/servers/:id/join` - Join server with invite code (requires auth)

### Channels
- `GET /api/servers/:serverId/channels` - Get channels in server
- `POST /api/servers/:serverId/channels` - Create channel (admin only)

### Messages
- `GET /api/channels/:channelId/messages` - Get messages (paginated)
- `POST /api/channels/:channelId/messages` - Send message

---

## 🔧 Development Tips

1. **Read the comments!** Every file has extensive documentation
2. **Look for `// TODO (LEARNING):` comments** - These are fill-in-the-blank exercises
3. **Use Prisma Studio** to visualize your database:
   ```bash
   cd backend
   npx prisma studio
   ```
4. **Test APIs with Postman** or Thunder Client VS Code extension
5. **Check logs** - The server logs explain what's happening

---

## 📝 Learning Challenges (Fill in the Blanks)

Throughout the codebase, you'll find sections marked with:
- `// TODO (LEARNING):` - Code you should write yourself
- `// CHALLENGE:` - Advanced features to implement
- `// WHY?:` - Questions to think about

Example:
```javascript
// TODO (LEARNING): Add rate limiting middleware here
// HINT: Use express-rate-limit package
// WHY?: Prevents brute force attacks
```

---

## 🎓 Next Steps

1. ✅ Follow the installation steps above
2. ✅ Start both backend and frontend servers
3. ✅ Open `backend/src/server.js` and read through the comments
4. ✅ Register a user via the frontend
5. ✅ Check Prisma Studio to see the user in the database
6. ✅ Create your first server and channel
7. ✅ Send your first real-time message!

---

## 🤝 Getting Help

- Read error messages carefully - they often tell you exactly what's wrong
- Check the browser console (F12) for frontend errors
- Check the terminal for backend errors
- Use `console.log()` liberally to understand data flow
- Refer to the learning resources section

---

## 📈 Progress Tracking

Mark your progress as you complete each feature:

**Week 1-2: Foundation**
- [ ] Backend setup complete
- [ ] Database schema understood
- [ ] User registration working
- [ ] User login working
- [ ] JWT authentication working
- [ ] Create server working
- [ ] Create channel working
- [ ] Join server working

**Week 3-4: Real-time**
- [ ] Socket.io connected
- [ ] Real-time messages sending
- [ ] User presence working
- [ ] Multiple channels working

**Week 5-6: Advanced**
- [ ] File uploads working
- [ ] Input validation complete
- [ ] Rate limiting implemented
- [ ] Security hardened

**Week 7-8: Deployment**
- [ ] App deployed
- [ ] Database migrated
- [ ] Environment configured

---

Good luck! You're about to learn a ton about backend development! 🚀

