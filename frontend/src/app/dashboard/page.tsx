"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Extending our types based on the Prisma schema
type Issue = {
  id: string;
  repoName: string;
  title: string;
  url: string;
  estimatedPoints: number;
  difficulty: string | null;
  status: string;
};

type UserProfile = {
  id: string;
  githubLogin: string;
  avatarUrl: string;
  pointsEarned: number;
  claimedIssues: Issue[];
};

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("wave_token");
      
      if (!token) {
        // Kick unauthenticated users back to the home page
        router.push("/");
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          throw new Error("Session expired");
        }

        const data = await res.json();
        setProfile(data);
      } catch (error) {
        console.error(error);
        localStorage.removeItem("wave_token");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
        <p className="animate-pulse text-lg">Loading your dashboard...</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <main className="min-h-screen p-8 bg-gray-50 text-gray-900">
      <div className="max-w-5xl mx-auto">
        
        {/* Navigation Bar */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b">
          <h1 className="text-3xl font-bold">🧭 Your Dashboard</h1>
          <Link href="/issues" className="text-sm bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition">
            Explore More Issues
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Profile & Stats */}
          <div className="col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
              <img 
                src={profile.avatarUrl} 
                alt={profile.githubLogin} 
                className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-blue-50"
              />
              <h2 className="text-xl font-bold">@{profile.githubLogin}</h2>
              <p className="text-gray-500 text-sm mb-6">Wave Contributor</p>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-blue-800 text-sm font-semibold uppercase tracking-wider mb-1">Total Points</p>
                <p className="text-4xl font-black text-blue-600">{profile.pointsEarned}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Claimed Issues */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold mb-4">Your Claimed Issues</h3>
            
            {profile.claimedIssues.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center border-dashed">
                <p className="text-gray-500 mb-4">You haven't claimed any issues yet.</p>
                <Link href="/issues" className="text-blue-600 hover:underline font-medium">
                  Find an issue to start building 🌊
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.claimedIssues.map((issue) => (
                  <div key={issue.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-500">{issue.repoName}</span>
                        {issue.status === 'MERGED' ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Completed</span>
                        ) : (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">In Progress</span>
                        )}
                      </div>
                      <a href={issue.url} target="_blank" rel="noreferrer" className="text-lg font-semibold hover:text-blue-600 transition line-clamp-1">
                        {issue.title}
                      </a>
                    </div>

                    <div className="flex items-center gap-4 sm:border-l sm:pl-4 border-gray-100">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Points</p>
                        <p className="font-bold text-gray-900">{issue.estimatedPoints}</p>
                      </div>
                      <a 
                        href={issue.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition"
                        title="Open on GitHub"
                      >
                        ↗
                      </a>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}