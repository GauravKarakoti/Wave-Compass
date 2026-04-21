import { Router } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const router = Router();

// Env vars
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_please_change';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// 🔹 1. Redirect to GitHub
router.get('/github', (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${BACKEND_URL}/api/auth/github/callback&scope=read:user user:email public_repo`;
  res.redirect(githubAuthUrl);
});

// 🔹 2. GitHub Callback
router.get('/github/callback', async (req, res) => {
  const code = req.query.code as string;

  if (!code) {
    return res.status(400).send('No code provided');
  }

  try {
    // Exchange code → access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenResponse.data.access_token;

    // Fetch GitHub user
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const githubUser = userResponse.data;

    // Upsert user
    const user = await prisma.user.upsert({
      where: { githubId: githubUser.id.toString() },
      update: {
        githubLogin: githubUser.login,
        avatarUrl: githubUser.avatar_url,
      },
      create: {
        githubId: githubUser.id.toString(),
        githubLogin: githubUser.login,
        avatarUrl: githubUser.avatar_url,
      },
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, login: user.githubLogin, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend
    res.redirect(`${FRONTEND_URL}/auth/success?token=${token}`);
  } catch (error) {
    console.error('GitHub Auth Error:', error);
    res.redirect(`${FRONTEND_URL}/auth/error`);
  }
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split(' ')[1]; // Expecting "Bearer <token>"
  
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_please_change');
    
    // UPDATE: Use `include` to fetch the related claimedIssues
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.userId },
      include: {
        claimedIssues: {
          orderBy: { createdAt: 'desc' } // Show newest claims first
        }
      }
    });
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;