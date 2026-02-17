export const formatHeartRate = (rate: number): string => {
  return `${Math.round(rate)}`;
};

export const formatStressLevel = (level: number): string => {
  return `${Math.round(level)}%`;
};

export const formatSleepQuality = (quality: number): string => {
  return `${Math.round(quality)}%`;
};
