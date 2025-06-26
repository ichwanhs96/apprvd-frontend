import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function withAuth<P>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
      console.log('withAuth: Setting up auth listener');
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        console.log('withAuth: Auth state changed', firebaseUser ? 'User logged in' : 'No user');
        setUser(firebaseUser);
        setLoading(false);
        if (!firebaseUser) {
          console.log('withAuth: Redirecting to login');
          router.replace('/login');
        }
      });
      return () => unsubscribe();
    }, [router]);

    if (loading) {
      return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-lg text-black dark:text-white">Checking authentication...</div>
          </div>
        </div>
      );
    }
    
    if (!user) {
      return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-lg text-black dark:text-white">Redirecting to login...</div>
          </div>
        </div>
      );
    }
    
    console.log('withAuth: Rendering component with user:', user.email);
    return <Component {...(props as any)} />;
  };
} 