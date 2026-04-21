'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// 1. Move the logic that uses `useSearchParams` into a separate component
function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // 🔐 Store token
      localStorage.setItem('wave_token', token);

      // 🚀 Redirect to issues page (your main flow)
      router.push('/issues');
    } else {
      // ❌ Fallback
      router.push('/');
    }
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-900">
      <div className="text-center">
        <p className="text-2xl mb-4 animate-pulse">🌊</p>
        <h1 className="text-xl font-medium">
          Authenticating with GitHub...
        </h1>
      </div>
    </div>
  );
}

// 2. Wrap that component in a Suspense boundary in the default export
export default function AuthSuccess() {
  return (
    <Suspense 
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-900">
          <div className="text-center">
            <p className="text-2xl mb-4 animate-pulse">🌊</p>
            <h1 className="text-xl font-medium">Loading...</h1>
          </div>
        </div>
      }
    >
      <AuthSuccessContent />
    </Suspense>
  );
}