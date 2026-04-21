import { Router } from 'express';
import prisma from '../prisma';
import axios from 'axios';
import jwt from 'jsonwebtoken';

const router = Router();

// Ensure this matches the secret used in your auth.ts route
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_please_change';

router.get('/', async (req, res) => {
  try {
    const { difficulty, repoName, label } = req.query; // Add label to destructured query

    // Build the query dynamically based on optional filters
    const whereClause: any = {
      status: 'OPEN', // Default to only showing open issues
    };

    if (difficulty) {
      whereClause.difficulty = String(difficulty);
    }
    if (repoName) {
      whereClause.repoName = String(repoName);
    }
    // New: Filter by label if it's provided
    if (label) {
      whereClause.labels = {
        has: String(label), // Prisma Postgres array filter
      };
    }

    const issues = await prisma.issue.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(issues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

router.post('/:id/claim', async (req, res) => {
  try {
    const issueId = req.params.id;
    
    // --- AUTHENTICATION & AUTHORIZATION ---
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1]; // Expecting "Bearer <token>"
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }

    // Extract the verified user ID directly from the token payload
    const userId = decoded.userId;
    // --------------------------------------

    // 1. Fetch user and issue from Database
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const issue = await prisma.issue.findUnique({ where: { id: issueId } });

    if (!user || !issue) {
      return res.status(404).json({ error: 'User or Issue not found' });
    }

    if (issue.status !== 'OPEN') {
      return res.status(400).json({ error: 'Issue is not open for claiming' });
    }

    // GitHub API setup using your app's bot/access token
    const githubToken = process.env.GITHUB_ACCESS_TOKEN;
    const githubHeaders = {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github.v3+json',
    };

    // We need the repository issue *number*, which we can parse from the URL
    // (e.g., https://github.com/stellar/stellar-core/issues/123 -> "123")
    const issueNumberMatch = issue.url.match(/\/issues\/(\d+)$/);
    const issueNum = issueNumberMatch ? issueNumberMatch[1] : null;

    if (!issueNum) {
      return res.status(400).json({ error: 'Could not parse GitHub issue number' });
    }

    const commentBody = `🌊 **Issue claim request by @${user.githubLogin}** via [Wave Compass](https://wavecompass.dev)\n\n_Note: Assign this to @${user.githubLogin} to mark this as claimed!!._`;
    
    await axios.post(
      `https://api.github.com/repos/${issue.repoName}/issues/${issueNum}/comments`,
      { body: commentBody },
      { headers: githubHeaders }
    );

    // 2. Attempt to assign the user (Will likely fail if they are not a contributor yet, but good to keep as a fallback)
    try {
      await axios.post(
        `https://api.github.com/repos/${issue.repoName}/issues/${issueNum}/assignees`,
        { assignees: [user.githubLogin] },
        { headers: githubHeaders }
      );
    } catch (assignError: any) {
      console.warn(`Could not assign @${user.githubLogin} on GitHub. They may need to comment manually first.`, assignError.response?.data || assignError.message);
    }
    
    res.json({ 
      success: true, 
      message: 'Claim request posted to GitHub. Waiting for maintainer to assign the issue.' 
    });

  } catch (error: any) {
    console.error('Error claiming issue:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to claim issue' });
  }
});

export default router;