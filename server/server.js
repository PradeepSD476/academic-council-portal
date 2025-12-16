import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/course.js'
import signedURLRoutes from './routes/signedURL.js'
import announcementRoutes from './routes/announcement.js'
import profileRoutes from './routes/profile.js'
import userRoutes from './routes/user.js'
import resourceRoutes from './routes/resource.js'
import dashboardRoutes from './routes/dashboard.js'
import { checkAuth } from './middlewares/checkAuth.js'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: ["http://localhost:5173", "https://academic-council-portal.vercel.app"],
  methods: ['GET', 'POST', 'PUT','PATCH','DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

const server = http.createServer(app);

app.get('/', (req, res) => {
  res.send('The server is live and running. The API is ready to accept requests.');
})

app.get("/health", (req, res) => {
  res.json({ status: "OK", uptime: process.uptime() });
});

app.use('/api/v1', authRoutes);
app.use('/api/v1', checkAuth, courseRoutes);
app.use('/api/v1', checkAuth, signedURLRoutes);
app.use('/api/v1', checkAuth, announcementRoutes);
app.use('/api/v1', checkAuth, profileRoutes);
app.use('/api/v1', checkAuth, resourceRoutes);
app.use('/api/v1', checkAuth, userRoutes);
app.use('/api/v1', checkAuth, dashboardRoutes);

server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
})