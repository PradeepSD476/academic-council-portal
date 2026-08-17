import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './src/modules/auth/authRoutes.js';
import onboardingRoutes from './src/modules/onboarding/onboardingRoutes.js';
import adminRoutes from './src/modules/admin/adminRoutes.js';
import userRoutes from './src/modules/user/userRoutes.js';
import meetingRoutes from './src/modules/meeting/meetingRoutes.js';
import feedbackRoutes from './src/modules/feedback/feedbackRoutes.js';
import mediaRoutes from './src/modules/media/mediaRoutes.js';
import { protect, adminOnly } from './src/middlewares/authMiddleware.js';
import { ensureBucket } from './src/lib/minio.js';
const app = express();
app.set('trust proxy', 1);

const allowedOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()) 
    : ['http://localhost:5173', 'http://localhost'];
app.use(cors({
	origin: allowedOrigins,
	credentials: true
}));
app.use(express.json());
app.use(cookieParser());
// app.get('/', (req, res) => { res.send("Healthy") })
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);
app.use('/api/v1/admin', protect, adminOnly, adminRoutes);
app.use('/api/v1/user', protect, userRoutes);
app.use('/api/v1/meeting', meetingRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/media', mediaRoutes);



ensureBucket()

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));