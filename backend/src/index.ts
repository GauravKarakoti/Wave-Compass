import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import prisma from './prisma';
import authRoutes from './routes/auth';
import cron from 'node-cron';
import { syncWaveIssues } from './services/githubSync';
import issueRoutes from './routes/issues';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Example route fetching users
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

cron.schedule('0 * * * *', () => {
  syncWaveIssues();
});

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await syncWaveIssues();
});