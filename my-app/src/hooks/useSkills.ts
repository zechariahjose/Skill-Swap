import { useCallback, useEffect, useRef, useState } from 'react';
import { getAllSkills, subscribeToSkills } from '../firebase/firestore';
import { Skill } from '../types';

export function useSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  const refreshSkills = useCallback(async () => {
    const latest = await getAllSkills();
    if (!isMounted.current) return;
    setSkills(latest);
    setLoading(false);
  }, []);

  useEffect(() => {
    isMounted.current = true;
    const unsub = subscribeToSkills((data) => {
      if (!isMounted.current) return;
      setSkills(data);
      setLoading(false);
    });

    return () => {
      isMounted.current = false;
      unsub();
    };
  }, []);

  return { skills, loading, refreshSkills };
}
