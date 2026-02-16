import { useState, useEffect, useCallback } from 'react';
import AppleHealthKit, {
  HealthValue,
  HealthKitPermissions,
} from 'react-native-health';
import { Platform } from 'react-native';
import { BiometricData } from '../models/BiometricData';

const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.HeartRateVariability,
      AppleHealthKit.Constants.Permissions.RestingHeartRate,
      AppleHealthKit.Constants.Permissions.StepCount,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
    ],
    write: [],
  },
};

interface UseHealthDataReturn {
  biometricData: BiometricData | null;
  isLoading: boolean;
  error: string | null;
  isAvailable: boolean;
  requestPermissions: () => Promise<boolean>;
  refreshData: () => Promise<void>;
  getHeartRateHistory: (days: number) => Promise<HealthValue[]>;
  getStepsHistory: (days: number) => Promise<HealthValue[]>;
}

export const useHealthData = (): UseHealthDataReturn => {
  const [biometricData, setBiometricData] = useState<BiometricData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = useCallback(() => {
    if (Platform.OS !== 'ios') {
      setIsAvailable(false);
      setError('HealthKit is only available on iOS');
      return;
    }

    AppleHealthKit.isAvailable((err: Object, available: boolean) => {
      if (err) {
        setIsAvailable(false);
        setError('HealthKit is not available on this device');
        return;
      }
      setIsAvailable(available);
    });
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!isAvailable) {
      setError('HealthKit is not available');
      return false;
    }

    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (err: string) => {
        if (err) {
          setError(`Failed to initialize HealthKit: ${err}`);
          resolve(false);
          return;
        }
        setError(null);
        resolve(true);
      });
    });
  }, [isAvailable]);

  const getHeartRate = useCallback((): Promise<number | null> => {
    return new Promise((resolve) => {
      const options = {
        unit: 'bpm',
        startDate: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        ascending: false,
        limit: 1,
      };

      AppleHealthKit.getHeartRateSamples(
        options,
        (err: Object, results: HealthValue[]) => {
          if (err || !results || results.length === 0) {
            resolve(null);
            return;
          }
          resolve(results[0].value);
        }
      );
    });
  }, []);

  const getRestingHeartRate = useCallback((): Promise<number | null> => {
    return new Promise((resolve) => {
      const options = {
        unit: 'bpm',
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      };

      AppleHealthKit.getRestingHeartRate(
        options,
        (err: Object, results: HealthValue[]) => {
          if (err || !results || results.length === 0) {
            resolve(null);
            return;
          }
          resolve(results[0].value);
        }
      );
    });
  }, []);

  const getHeartRateVariability = useCallback((): Promise<number | null> => {
    return new Promise((resolve) => {
      const options = {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      };

      AppleHealthKit.getHeartRateVariabilitySamples(
        options,
        (err: Object, results: HealthValue[]) => {
          if (err || !results || results.length === 0) {
            resolve(null);
            return;
          }
          const avgHRV =
            results.reduce((sum, item) => sum + item.value, 0) / results.length;
          resolve(avgHRV);
        }
      );
    });
  }, []);

  const getSteps = useCallback((): Promise<number | null> => {
    return new Promise((resolve) => {
      const options = {
        startDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
        endDate: new Date().toISOString(),
      };

      AppleHealthKit.getStepCount(
        options,
        (err: Object, results: { value: number }) => {
          if (err || !results) {
            resolve(null);
            return;
          }
          resolve(results.value);
        }
      );
    });
  }, []);

  const getActiveEnergy = useCallback((): Promise<number | null> => {
    return new Promise((resolve) => {
      const options = {
        startDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
        endDate: new Date().toISOString(),
      };

      AppleHealthKit.getActiveEnergyBurned(
        options,
        (err: Object, results: { value: number }) => {
          if (err || !results) {
            resolve(null);
            return;
          }
          resolve(results.value);
        }
      );
    });
  }, []);

  const getSleepAnalysis = useCallback((): Promise<number | null> => {
    return new Promise((resolve) => {
      const options = {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      };

      AppleHealthKit.getSleepSamples(
        options,
        (err: Object, results: any[]) => {
          if (err || !results || results.length === 0) {
            resolve(null);
            return;
          }

          const sleepMinutes = results.reduce((total, sample) => {
            if (sample.value === 'ASLEEP' || sample.value === 'INBED') {
              const start = new Date(sample.startDate).getTime();
              const end = new Date(sample.endDate).getTime();
              return total + (end - start) / (1000 * 60);
            }
            return total;
          }, 0);

          resolve(sleepMinutes / 60);
        }
      );
    });
  }, []);

  const refreshData = useCallback(async (): Promise<void> => {
    if (!isAvailable) {
      setError('HealthKit is not available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [
        heartRate,
        restingHeartRate,
        heartRateVariability,
        steps,
        activeEnergy,
        sleepHours,
      ] = await Promise.all([
        getHeartRate(),
        getRestingHeartRate(),
        getHeartRateVariability(),
        getSteps(),
        getActiveEnergy(),
        getSleepAnalysis(),
      ]);

      const newBiometricData: BiometricData = {
        heartRate,
        restingHeartRate,
        heartRateVariability,
        steps,
        activeEnergy,
        sleepHours,
        timestamp: new Date(),
      };

      setBiometricData(newBiometricData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health data');
    } finally {
      setIsLoading(false);
    }
  }, [
    isAvailable,
    getHeartRate,
    getRestingHeartRate,
    getHeartRateVariability,
    getSteps,
    getActiveEnergy,
    getSleepAnalysis,
  ]);

  const getHeartRateHistory = useCallback(
    async (days: number): Promise<HealthValue[]> => {
      if (!isAvailable) {
        return [];
      }

      return new Promise((resolve) => {
        const options = {
          unit: 'bpm',
          startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          ascending: true,
          limit: 1000,
        };

        AppleHealthKit.getHeartRateSamples(
          options,
          (err: Object, results: HealthValue[]) => {
            if (err || !results) {
              resolve([]);
              return;
            }
            resolve(results);
          }
        );
      });
    },
    [isAvailable]
  );

  const getStepsHistory = useCallback(
    async (days: number): Promise<HealthValue[]> => {
      if (!isAvailable) {
        return [];
      }

      return new Promise((resolve) => {
        const options = {
          startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          period: 1440,
        };

        AppleHealthKit.getDailyStepCountSamples(
          options,
          (err: Object, results: HealthValue[]) => {
            if (err || !results) {
              resolve([]);
              return;
            }
            resolve(results);
          }
        );
      });
    },
    [isAvailable]
  );

  useEffect(() => {
    if (isAvailable) {
      requestPermissions().then((granted) => {
        if (granted) {
          refreshData();
        }
      });
    }
  }, [isAvailable]);

  return {
    biometricData,
    isLoading,
    error,
    isAvailable,
    requestPermissions,
    refreshData,
    getHeartRateHistory,
    getStepsHistory,
  };
};