"use client";

export default function Home() {
  const handleLogin = () => {
    // Redirect directly to the Express backend route
    window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/github`;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Wave Compass 🧭</h1>
      <button 
        onClick={handleLogin}
        className="px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition"
      >
        Sign in with GitHub
      </button>
    </main>
  );
}