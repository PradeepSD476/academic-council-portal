import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import resourceRoutes from './routes/resource.js'


dotenv.config();

const app = express();

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
app.use('/api/resource', resourceRoutes);

server.listen(process.env.PORT, () => {
  console.log(`Server is running on PORT: ${process.env.PORT}`);
})