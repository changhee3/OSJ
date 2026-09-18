import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { auth, db } from '@/lib/firebase';

export type UserRole = '운영자' | '일반회원';

// 로그인한 회원의 역할을 실시간으로 구독한다. 값을 아직 못 받아왔으면 null.
export function useUserRole(): UserRole | null {
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    return onSnapshot(doc(db, 'users', uid), (snap) => {
      const value = snap.data()?.['역할'] as UserRole | undefined;
      setRole(value ?? '일반회원');
    });
  }, []);

  return role;
}
