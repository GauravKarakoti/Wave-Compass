'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Store token for future API requests
      localStorage.setItem('wave_compass_token', token);
      // Redirect to the dashboard
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-xl">Authenticating...</p>
    </div>
  );
}