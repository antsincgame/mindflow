import { useState, useEffect } from 'react';

export const useHealthData = () => {
  const [heartRate, setHeartRate] = useState<number | null>(74);
  const [heartRateHistory, setHeartRateHistory] = useState<number[]>([72, 75, 71, 78, 74, 73, 76]);
  const [sleepData, setSleepData] = useState<{ quality: number } | null>({ quality: 78 });
  const [sleepHistory, setSleepHistory] = useState<number[]>([7.2, 6.8, 7.5, 6.5, 7.8, 7.0, 7.3]);

  return {
    heartRate,
    heartRateHistory,
    sleepData,
    sleepHistory,
  };
};
