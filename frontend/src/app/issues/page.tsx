"use client";

import { useEffect, useState } from "react";

type Issue = {
  id: string;
  githubIssueId: string;
  repoName: string;
  title: string;
  url: string;
  labels: string[];
  estimatedPoints: number;
  difficulty: string | null;
  status: string;
};

type User = {
  id: string;
  githubLogin: string;
  avatarUrl: string;
  pointsEarned: number;
};

export default function IssueExplorer() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      // 1. Check for authenticated user
      const token = localStorage.getItem("wave_token");
      if (token) {
        try {
          const userRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (userRes.ok) {
            setCurrentUser(await userRes.json());
          } else {
            localStorage.removeItem("wave_token"); // Token expired/invalid
          }
        } catch (err) {
          console.error("Failed to fetch user session");
        }
      }

      // 2. Fetch issues
      try {
        const issuesRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/issues`);
        if (issuesRes.ok) {
          setIssues(await issuesRes.json());
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const handleClaim = async (issueId: string) => {
    if (!currentUser) {
      alert("Please log in to claim issues!");
      return;
    }

    setClaimingId(issueId);
    try {
      const token = localStorage.getItem("wave_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/issues/${issueId}/claim`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Secure the endpoint!
        },
        // We pass the userId, but realistically the backend should read it from the JWT token for true security!
        body: JSON.stringify({ userId: currentUser.id }), 
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to claim issue");
      }

      // Optimistically update the UI
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId ? { ...issue, status: "CLAIMED" } : issue
        )
      );
      
      alert("🎉 Issue successfully claimed! A comment has been posted on GitHub.");
    } catch (error: any) {
      console.error(error);
      alert(`Failed to claim: ${error.message}`);
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 pb-4 border-b">
          <h1 className="text-3xl font-bold">🌊 Wave Explorer</h1>
          {currentUser ? (
            <div className="flex items-center gap-4">
              {/* Added Dashboard Link */}
              <a href="/dashboard" className="text-sm font-medium hover:text-blue-600 transition">
                Dashboard
              </a>
              <div className="flex items-center gap-2 bg-gray-100 pl-3 pr-1 py-1 rounded-full">
                <span className="text-sm font-bold text-gray-700">{currentUser.pointsEarned} pts</span>
                <img src={currentUser.avatarUrl} alt="Avatar" className="w-7 h-7 rounded-full border border-gray-300" />
              </div>
            </div>
          ) : (
            <a href="/" className="text-sm px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition">Log in</a>
          )}
        </div>

        {loading ? (
          <p>Loading issues...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {issues.map((issue) => (
              <div key={issue.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
                <div>
                  {/* Issue Header Info */}
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {issue.repoName}
                    </span>
                    {issue.estimatedPoints > 0 && (
                      <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                        {issue.estimatedPoints} pts
                      </span>
                    )}
                  </div>
                  
                  <h2 className="text-lg font-semibold mb-2 line-clamp-2">
                    {issue.title}
                  </h2>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {issue.difficulty && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {issue.difficulty}
                      </span>
                    )}
                    {issue.status === 'CLAIMED' && (
                       <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                         Claimed
                       </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  <a 
                    href={issue.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 text-center px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition text-sm font-medium"
                  >
                    View on GitHub
                  </a>
                  
                  {issue.status === 'OPEN' ? (
                    <button 
                      onClick={() => handleClaim(issue.id)}
                      disabled={claimingId === issue.id}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
                    >
                      {claimingId === issue.id ? 'Claiming...' : 'Claim Issue'}
                    </button>
                  ) : (
                    <button disabled className="flex-1 px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed text-sm font-medium">
                      Unavailable
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}