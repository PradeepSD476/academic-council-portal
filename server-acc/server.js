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
import forumRoutes from './routes/forum.js'
import financeVaultRoutes from './routes/financeVault.js'

dotenv.config();

try {
  await ensureBucket();
} catch (error) {
  console.warn("Minio bucket initialization failed. Running without Minio.", error.message);
}

const app = express();
const PORT = process.env.PORT || 3000

app.use(cors({
  origin: [ 
    process.env.CLIENT_URL, // This matches http://localhost:5173 safely
    "https://academic-council-portal.vercel.app", 
    "http://localhost:800", // Matches your public domain endpoint configuration
    "https://acc.iitp.ac.in", 
    "http://acc.iitp.ac.in", 
    "https://172.16.1.254", 
    "http://172.16.1.254" 
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
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
app.use('/api/v1', forumRoutes);
app.use('/api/v1/finance-vault', financeVaultRoutes);

server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
})
