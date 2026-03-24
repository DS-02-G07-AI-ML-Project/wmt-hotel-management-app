# 🏨 WMT Hotel Management App

A full-stack hotel/boarding room management system with:
- **Backend API** (Node.js + Express + MongoDB)
- **Mobile Frontend** (React Native + Expo)

Built for collaborative student team development with role-based API access, room CRUD, and mobile-first UX.

---

## ✨ Highlights

- 📱 Expo-based React Native app (Android/iOS)
- 🧩 Modular Express backend (`routes`, `controllers`, `middleware`, `models`)
- 🔐 JWT authentication with role-based authorization (`user`, `staff`, `admin`)
- 🏠 Room management: list, detail, create, update, delete
- 🖼️ Multer image upload support (`/uploads`)
- 🌐 LAN-ready local development (Expo Go + local backend IP)
- 👥 Team-friendly setup with `.env.example`

---

## 🧱 Tech Stack

### Frontend
- Expo SDK 54
- React Native 0.81.x
- React Navigation

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- JWT (`jsonwebtoken`)
- Bcrypt (`bcryptjs`)
- Multer (file uploads)
- CORS, dotenv

---

## 📂 Project Structure

```text
wmt project/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── config/
│   │   └── screens/
│   ├── App.js
│   └── package.json
└── README.md
```

---

## 🚀 Quick Start

## 1) Clone

```bash
git clone https://github.com/DS-02-G07-AI-ML-Project/wmt-hotel-management-app.git
cd wmt-hotel-management-app
```

## 2) Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Update `.env` with your real values:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.rnsmfin.mongodb.net/hotel_management?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=replace_with_strong_secret
```

Run backend:

```bash
npm start
```

Expected output:
- `Server running on http://<your-ip>:5000`
- `MongoDB Connected: ...`

## 3) Frontend Setup

```bash
cd ../frontend
npm install
npx expo install --fix
npx expo start -c --lan
```

Scan QR code with **Expo Go**.

---

## 🌐 Team Development Notes

- Keep backend running on one machine and expose via LAN IP (e.g. `192.168.x.x:5000`)
- Ensure all teammates are on the **same Wi-Fi network** for Expo Go + local API
- In MongoDB Atlas, allow teammate IPs in **Network Access**
- All teammates can share one Atlas cluster using their own `.env`

---

## 🔐 Authentication & Roles

- `POST /api/users/register` → creates user + returns JWT
- `POST /api/users/login` → returns JWT
- `GET /api/users/me` → requires `Authorization: Bearer <token>`

Role restrictions:
- `admin` and `staff`: can create/update rooms
- `admin` only: can delete rooms

---

## 📡 API Reference

### Base URL (local)

```text
http://<your-ip>:5000
```

### Health

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | API health check |

### Users

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/users/register` | Public | Register and get JWT |
| POST | `/api/users/login` | Public | Login and get JWT |
| GET | `/api/users/me` | Private | Get current user |

### Rooms

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/rooms` | Public | List all rooms |
| GET | `/api/rooms/:id` | Public | Get room by ID |
| POST | `/api/rooms` | Private (`admin`,`staff`) | Create room (supports photos upload) |
| PUT | `/api/rooms/:id` | Private (`admin`,`staff`) | Update room |
| DELETE | `/api/rooms/:id` | Private (`admin`) | Delete room |

---

## 🖼️ Uploads

- Upload middleware supports image types: `jpeg`, `jpg`, `png`, `gif`
- Max size: **10MB** per file
- Room routes accept up to **5 photos** with field name `photos`
- Static files served from: `/uploads`

---

## 🧪 Common Troubleshooting

### 1) `Network request failed` in Expo Go
- Confirm backend is running
- Confirm mobile + laptop are on same Wi-Fi
- Confirm API URL uses laptop LAN IP and port `5000`
- Try opening `http://<your-ip>:5000/` on mobile browser

### 2) MongoDB `ECONNREFUSED 127.0.0.1:27017`
- You are likely using local Mongo URI without local Mongo service
- Use MongoDB Atlas URI in `.env`

### 3) Expo package mismatch warnings
Run:

```bash
npx expo install --fix
```

---

## 🤝 Collaboration Workflow

```bash
# create your branch
git checkout -b feature/<your-feature>

# commit changes
git add .
git commit -m "feat: add <your-feature>"

# push branch
git push -u origin feature/<your-feature>
```

Then open a Pull Request into `main`.

---

## 🛡️ Security Notes

- Do **not** commit real `.env` files
- Rotate credentials if accidentally shared
- Use strong JWT secret in production
- Restrict CORS and Atlas IP allow-list for production deployments

---

## 📌 Roadmap Ideas

- Booking management module
- Payment integration
- Staff dashboard and analytics
- Media storage migration (S3/Cloudinary)
- CI/CD + automated tests

---

### Maintained by
DS-02 G07 AI/ML Project Team
