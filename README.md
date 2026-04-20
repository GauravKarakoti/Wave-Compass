# Wave Compass 🧭

Wave Compass is a discovery and tracking tool for the [Stellar Wave Program](https://docs.drips.network/wave). It aggregates eligible issues from all participating Stellar repositories, calculates estimated points, and provides a personalized dashboard for contributors to plan their monthly Wave contributions.

## Why Wave Compass?

- **Discover issues** – Filter by repo, difficulty, point range, or required skill.
- **Estimate points** – See how many points an issue is likely worth based on historical data.
- **Track your progress** – Monitor your points, rank on the leaderboard, and see upcoming Waves.
- **Integrate with Drips** – Automatically sync with the Drips API to reflect real reward distribution.

## Features

- 🔍 **Issue Explorer** – Browse all Wave-eligible issues with labels, points, and maintainer notes.
- 📊 **Contributor Dashboard** – Your earned points, merged PRs, and current Wave rank.
- 📈 **Leaderboard** – See top contributors (opt-in) for each Wave.
- ⏰ **Wave Calendar** – Countdown to next Wave start/end, with email reminders.
- 🧪 **Soroban Smart Contract Preview** – For Stellar smart contract issues, simulate gas and complexity.

## Tech Stack

- **Frontend**: Next.js (React), Tailwind CSS, Chart.js
- **Backend**: Node.js + Express, Prisma (PostgreSQL)
- **APIs**: GitHub REST & GraphQL, Drips Network API, Stellar Horizon
- **Auth**: GitHub OAuth

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL database
- GitHub OAuth App (for login and API rate limits)
- Drips API key (contact Wave program admin)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/GauravKarakoti/wave-compass.git
   cd wave-compass
   ```
2. **Install dependencies**
```bash
npm install
```
3. **Set up environment variables**
Create a .env.local file:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/wavecompass"
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
DRIPS_API_KEY=your_drips_api_key
NEXT_PUBLIC_WAVE_CONTRACT_ADDRESS=...
```
4. Run database migrations
```bash
npx prisma migrate dev --name init
```
5. Start the development server
```bash
npm run dev
```
Open http://localhost:3000

## Usage for Contributors
1. Sign in with GitHub – we only request public repo access.
2. Browse the Issue Explorer – filter by repo (e.g., stellar-core, soroban-rpc, drips-waves).
3. Claim an issue – clicking “Start” creates a comment on GitHub and marks it in your dashboard.
4. Submit your PR – when your PR is merged, the Wave bot will automatically award points.
5. Track points – your dashboard updates in real time.

## Contributing to Wave Compass
We welcome contributions! Wave Compass itself participates in the Stellar Wave Program. Look for issues labelled `wave-compass` in the [Wave Compass GitHub repo](https://github.com/GauravKarakoti/wave-compass/issues).

## Contribution Guidelines
- Check existing issues and PRs before starting work
- For new features, open a discussion issue first
- Points are awarded based on the Wave Rules: complexity, lines changed, and impact

## Local Development Setup for Contributors
1. Fork the repo and clone your fork.
2. Install dependencies as above.
3. Create a `.env` with your own test values (you can use a local SQLite for testing: set `DATABASE_URL="file:./dev.db"`).
4. Run `npm run dev` and test your changes.
5. Submit a PR against the `main` branch.

## Wave Program Integration
- Points are automatically synced from the [Drips Wave Program](https://docs.drips.network/wave) smart contract.
- Every merged PR to Wave Compass during an active Wave earns points.
- Rewards are distributed at the end of each Wave based on your point share.

## Roadmap
- Real-time notification when a claimed issue gets a review
- Team view for maintainers to assign points
- Soroban smart contract call simulation
- Mobile app (React Native)

## Support
- Join the [Stellar Wave Discord](https://discord.gg/stellar-wave)
- Open an issue on GitHub

---

Let’s Wave 🌊 – and build better tools for the Stellar ecosystem together.
