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
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
        if (!firebaseUser) {
          router.replace('/login');
        }
      });
      return () => unsubscribe();
    }, [router]);

    if (loading) {
      return null; // Or a spinner if you want
    }
    if (!user) {
      return null;
    }
    return <Component {...(props as any)} />;
  };
} 