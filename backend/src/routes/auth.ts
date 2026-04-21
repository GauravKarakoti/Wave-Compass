import { Router } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;
const JWT_SECRET = process.env.JWT_SECRET!;
const FRONTEND_URL = process.env.FRONTEND_URL!;

// Step 1: Redirect to GitHub
router.get('/github', (req, res) => {
  const redirectUri = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=read:user,public_repo`;
  res.redirect(redirectUri);
});

// Step 2: Handle GitHub Callback
router.get('/github/callback', async (req, res) => {
  const code = req.query.code as string;

  if (!code) {
    return res.status(400).send('No code provided');
  }

  try {
    // Exchange code for access token
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

    // Fetch user details from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const githubUser = userResponse.data;

    // Upsert user in the database
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
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Redirect back to frontend with the token
    res.redirect(`${FRONTEND_URL}/auth/success?token=${token}`);
  } catch (error) {
    console.error('OAuth Error:', error);
    res.redirect(`${FRONTEND_URL}/auth/error`);
  }
});

export default router;