'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { onAuthStateChange, signInWithGoogle } from '@/lib/firebase';

export default function LoginPage() {
  // Optionally, handle redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        // Redirect or handle logged-in user
        window.location.href = '/';
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    const { user, error } = await signInWithGoogle();
    if (error) {
      alert('Google sign-in failed');
    }
    // User is signed in, onAuthStateChanged will handle redirect
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Section */}
      <div className="flex flex-col justify-center items-center md:items-start w-full md:w-1/2 px-8 md:px-24 py-12 bg-white">
        <div className="mb-8 flex items-center">
          <div className="bg-[#88DF95] rounded-md p-2 mr-3">
            {/* Placeholder for logo checkmark */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="6" fill="#88DF95"/>
              <path d="M10 17L15 22L22 12" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-2xl font-semibold text-black">Apprvd</span>
        </div>
        <h1 className="text-3xl font-bold mb-2 text-black">Welcome back!</h1>
        <p className="mb-8 text-black">Enter your credentials to access your account</p>
        <form className="w-full max-w-sm flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-black mb-1">Email Address</label>
            <input id="email" type="email" placeholder="hello@apprvd.co" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#88DF95] text-black" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-black mb-1">Password</label>
            <input id="password" type="password" placeholder="your password" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#88DF95] text-black" />
          </div>
          <div className="flex items-center">
            <input id="terms" type="checkbox" className="mr-2" />
            <label htmlFor="terms" className="text-sm text-black">I agree to the term & policy</label>
          </div>
          <button type="submit" className="w-full bg-[#88DF95] text-black py-2 rounded-md font-semibold hover:bg-[#7ACF87] transition">Login</button>
        </form>
        <div className="w-full max-w-sm flex flex-col items-center mt-6">
          <button type="button" onClick={handleGoogleSignIn} className="w-full border border-gray-300 py-2 rounded-md flex items-center justify-center gap-2 hover:bg-gray-50 transition mb-4 text-black">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_993_156)">
                <path d="M19.8052 10.2309C19.8052 9.55021 19.7491 8.86706 19.6309 8.19849H10.2V12.0491H15.6261C15.3983 13.2721 14.6522 14.3416 13.6017 15.0377V17.0377H16.6017C18.4017 15.3416 19.8052 13.0377 19.8052 10.2309Z" fill="#4285F4"/>
                <path d="M10.2 20C12.7009 20 14.8009 19.1839 16.4017 17.8377L13.6017 15.0377C12.7009 15.6377 11.5522 16 10.2 16C7.80174 16 5.80174 14.3416 5.05217 12.0491H2.15217V14.117C3.80174 17.1839 6.80174 20 10.2 20Z" fill="#34A853"/>
                <path d="M5.05217 12.0491C4.80174 11.4491 4.65217 10.7839 4.65217 10C4.65217 9.21606 4.80174 8.55021 5.05217 7.95021V5.88232H2.15217C1.55217 7.08394 1.2 8.49155 1.2 10C1.2 11.5085 1.55217 12.9161 2.15217 14.117L5.05217 12.0491Z" fill="#FBBC05"/>
                <path d="M10.2 3.99999C11.6522 3.99999 12.9522 4.49155 13.9522 5.44155L16.4743 2.91944C14.8009 1.36605 12.7009 0.5 10.2 0.5C6.80174 0.5 3.80174 3.31606 2.15217 6.38232L5.05217 8.45021C5.80174 6.15845 7.80174 3.99999 10.2 3.99999Z" fill="#EA4335"/>
              </g>
              <defs>
                <clipPath id="clip0_993_156">
                  <rect width="20" height="20" fill="white"/>
                </clipPath>
              </defs>
            </svg>
            Sign in with Google
          </button>
          <p className="text-sm text-black">Join our waitlist <a href="#" className="text-[#88DF95] font-medium hover:underline">here</a></p>
        </div>
      </div>
      {/* Right Section */}
      <div className="hidden md:block w-1/2 h-full relative">
        <Image
          src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80"
          alt="Team working"
          fill
          className="object-cover h-full w-full rounded-l-3xl"
        />
      </div>
    </div>
  );
} 