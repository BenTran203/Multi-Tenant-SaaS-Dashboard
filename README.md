# 🌊 ChatWave - Real-Time Chat Application

A Discord-inspired chat application with real-time messaging, server-based communities, and channel organization.

## 📝 Overview

ChatWave is a full-stack real-time chat application that allows users to:

- 👤 **Create accounts** with secure JWT authentication
- 🏢 **Create and join servers** (communities) using invite codes
- 💬 **Chat in real-time** across multiple channels
- 🎯 **Organize conversations** with channel-based communication
- 🔒 **Secure messaging** with password hashing and authentication
- ⚡ **Instant updates** using WebSocket connections

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express
- Socket.io (WebSockets)
- PostgreSQL + Prisma ORM
- JWT Authentication
- bcrypt password hashing

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS
- Socket.io-client
- Axios
- React Router

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Clone and Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

Create a PostgreSQL database:
```sql
CREATE DATABASE chatwave;
```

Configure environment variables:
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/chatwave"
JWT_SECRET="your-super-secret-key-change-this"
PORT=5000
```

Run database migrations:
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

### 4. Access the App

Open your browser and navigate to: **http://localhost:5173**

## 📖 How to Use

1. **Register** - Create a new account
2. **Create a Server** - Start your own community
3. **Create Channels** - Add text channels to your server
4. **Invite Friends** - Share your server's invite code
5. **Start Chatting** - Send real-time messages!

## 🗂️ Project Structure

```
chatApp/
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth & validation
│   │   ├── socket/        # WebSocket handlers
│   │   └── server.js      # Entry point
│   └── prisma/
│       └── schema.prisma  # Database schema
└── frontend/              # React + TypeScript UI
    ├── src/
    │   ├── components/    # UI components
    │   ├── pages/         # Page views
    │   ├── hooks/         # Custom hooks
    │   └── services/      # API & Socket services
    └── package.json
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Servers
- `GET /api/servers` - Get user's servers
- `POST /api/servers` - Create new server
- `GET /api/servers/:id` - Get server details
- `POST /api/servers/:id/join` - Join with invite code

### Channels
- `GET /api/servers/:serverId/channels` - Get channels
- `POST /api/servers/:serverId/channels` - Create channel

### Messages
- `GET /api/channels/:channelId/messages` - Get messages
- `POST /api/channels/:channelId/messages` - Send message

## 🛠️ Development Tools

**View Database:**
```bash
cd backend
npx prisma studio
# Opens GUI at http://localhost:5555
```

**Reset Database:**
```bash
cd backend
npx prisma migrate reset
```

## 🤝 Contributing

This is a learning project. Feel free to fork and experiment!

## 📄 License

MIT

