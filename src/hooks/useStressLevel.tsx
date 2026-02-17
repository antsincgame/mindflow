import { useState, useEffect } from 'react';

export const useStressLevel = () => {
  const [stressLevel, setStressLevel] = useState<number | null>(42);
  const [stressHistory, setStressHistory] = useState<number[]>([45, 52, 48, 55, 42, 38, 40]);

  return {
    stressLevel,
    stressHistory,
  };
};
