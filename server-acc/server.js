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
import { ensureBucket } from './config/minio.js';
import dashboardRoutes from './routes/dashboard.js'
import { checkAuth } from './middlewares/checkAuth.js'

dotenv.config();
await ensureBucket();

const app = express();
const PORT = process.env.PORT || 3000

app.use(cors({
  origin: [
    process.env.CLIENT_URL, 
    "https://academic-council-portal.vercel.app"
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
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
app.use('/api/v1', courseRoutes);
app.use('/api/v1', signedURLRoutes);
app.use('/api/v1', announcementRoutes);
app.use('/api/v1', profileRoutes);
app.use('/api/v1', resourceRoutes);
app.use('/api/v1', userRoutes);
app.use('/api/v1', dashboardRoutes);

server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
})