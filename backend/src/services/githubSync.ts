import axios from 'axios';
import prisma from '../prisma';

const WAVE_PROGRAM_ID = 'fdc01c95-806f-4b6a-998b-a6ed37e0d81b';

type Repo = {
  fullName: string;
  url: string;
  stars: number;
};

async function fetchWaveRepos(): Promise<Repo[]> {
  let page = 1;
  const allRepos: Repo[] = [];

  while (true) {
    const res = await axios.get(
      `https://wave-api.drips.network/api/wave-programs/${WAVE_PROGRAM_ID}/repos`,
      {
        params: {
          limit: 100,
          page,
          sortBy: 'stargazersCount',
        },
        // headers: {
        //   Authorization: `Bearer ${process.env.WAVE_TOKEN}`,
        // },
      }
    );
    const repos = res.data?.data || [];

    if (!repos.length) break;

    allRepos.push(
        ...repos.map((r: any) => ({
            fullName: r.repo.gitHubRepoFullName,
            url: r.repo.gitHubRepoUrl,
            stars: r.repo.stargazersCount,
        }))
    );
    page++;
  }

  return allRepos;
}

export async function syncWaveIssues() {
  console.log(`[${new Date().toISOString()}] Starting GitHub issue synchronization...`);

  const githubToken = process.env.GITHUB_ACCESS_TOKEN;
  if (!githubToken) {
    console.error('Missing GITHUB_ACCESS_TOKEN in environment variables.');
    return;
  }

  // 🔹 Get repos dynamically
  const repos = await fetchWaveRepos();
  console.log(`Fetched ${repos.length} repos from Drips`);

  for (const repo of repos) {
    try {
        const response = await axios.get(
        `https://api.github.com/repos/${repo.fullName}/issues`,
        {
          params: {
            state: 'open',
            per_page: 100,
          },
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      const issues = response.data;

      for (const issue of issues) {
        if (issue.pull_request) continue;

        const labels: string[] = issue.labels.map((l: any) => l.name);

        let estimatedPoints = 0;
        const pointLabel = labels.find((l) =>
          l.toLowerCase().includes('point')
        );
        if (pointLabel) {
          const match = pointLabel.match(/\d+/);
          if (match) estimatedPoints = parseInt(match[0], 10);
        }

        let difficulty: string | null = null;
        if (labels.some((l) => l.toLowerCase() === 'good first issue'))
          difficulty = 'Beginner';
        if (labels.some((l) => l.toLowerCase() === 'help wanted'))
          difficulty = 'Intermediate';

        // Check if the issue has assignees on GitHub
        const isAssigned = issue.assignees && issue.assignees.length > 0;
        let dbAssigneeId: string | null = null;

        if (isAssigned) {
          const githubAssigneeLogin = issue.assignees[0].login;
          
          // Attempt to find the assigned user in your Wave Compass database
          const mappedUser = await prisma.user.findUnique({
            where: { githubLogin: githubAssigneeLogin }
          });

          if (mappedUser) {
            dbAssigneeId = mappedUser.id;
          }
        }

        await prisma.issue.upsert({
          where: { githubIssueId: issue.id.toString() },
          update: {
            title: issue.title,
            labels,
            estimatedPoints,
            difficulty,
            status: isAssigned ? 'CLAIMED' : 'OPEN',
            assigneeId: dbAssigneeId, // Link the user if they exist in your DB
            updatedAt: new Date(),
          },
          create: {
            githubIssueId: issue.id.toString(),
            repoName: repo.fullName,
            title: issue.title,
            url: issue.html_url,
            labels,
            estimatedPoints,
            difficulty,
            status: isAssigned ? 'CLAIMED' : 'OPEN',
            assigneeId: dbAssigneeId, // Link the user if they exist in your DB
          },
        });
      }

      console.log(`✅ Synced ${repo.fullName}`);
    } catch (error: any) {
      console.error(`❌ Failed for${repo.fullName}:`, error?.response?.status || error.message);
    }
  }

  console.log(`[${new Date().toISOString()}] GitHub issue synchronization completed.`);
}