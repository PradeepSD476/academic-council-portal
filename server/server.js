import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import prisma from './config/db.js';


dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

const server = http.createServer(app);

app.get('/', (req, res) => {
  res.send('server is live...');
})

async function main() {
  const allUsers = await prisma.user.findMany()
  console.log(allUsers);
}

main()

server.listen(process.env.PORT, () => {
  console.log(`Server is running on PORT: ${process.env.PORT}`);
})