import { useEffect, useState } from 'react';
import { subscribeToSkills } from '../firebase/firestore';
import { Skill } from '../types';

export function useSkills() {
  const [skills,  setSkills]  = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToSkills((data) => {
      setSkills(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { skills, loading };
}