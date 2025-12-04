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
import resourceRoutes from './routes/resource.js'
import { checkAuth } from './middlewares/checkAuth.js'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

const server = http.createServer(app);

app.get('/', (req, res) => {
  res.send('server is live...');
})

app.use('/api/auth', authRoutes);
app.use('/api/course', checkAuth, courseRoutes);
app.use('/api/upload', checkAuth, signedURLRoutes);
app.use('/api/announcement', checkAuth, announcementRoutes);
app.use('/api/profile', checkAuth, profileRoutes);
app.use('/api/resource', checkAuth, resourceRoutes);

server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
})