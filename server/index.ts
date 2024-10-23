import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { router as authRouter } from './routes/auth';
import { router as quizRouter } from './routes/quiz';
import { router as userRouter } from './routes/user';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/user', userRouter);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { prisma };