import AppleHealthKit, {
  HealthValue,
  HealthKitPermissions,
  HealthInputOptions,
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
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      AppleHealthKit.Constants.Permissions.MindfulSession,
    ],
    write: [AppleHealthKit.Constants.Permissions.MindfulSession],
  },
};

class HealthKitService {
  private isInitialized: boolean = false;
  private isAvailable: boolean = false;

  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      console.log('HealthKit is only available on iOS');
      return false;
    }

    return new Promise((resolve) => {
      AppleHealthKit.isAvailable((error, available) => {
        if (error) {
          console.error('HealthKit availability check error:', error);
          this.isAvailable = false;
          resolve(false);
          return;
        }

        this.isAvailable = available;

        if (available) {
          AppleHealthKit.initHealthKit(permissions, (initError) => {
            if (initError) {
              console.error('HealthKit initialization error:', initError);
              this.isInitialized = false;
              resolve(false);
              return;
            }

            this.isInitialized = true;
            resolve(true);
          });
        } else {
          resolve(false);
        }
      });
    });
  }

  async getHeartRate(): Promise<number | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isAvailable) {
      return null;
    }

    return new Promise((resolve) => {
      const options: HealthInputOptions = {
        startDate: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        ascending: false,
        limit: 1,
      };

      AppleHealthKit.getHeartRateSamples(
        options,
        (error, results: HealthValue[]) => {
          if (error) {
            console.error('Error fetching heart rate:', error);
            resolve(null);
            return;
          }

          if (results && results.length > 0) {
            resolve(Math.round(results[0].value));
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  async getHeartRateVariability(): Promise<number | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isAvailable) {
      return null;
    }

    return new Promise((resolve) => {
      const options: HealthInputOptions = {
        startDate: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        ascending: false,
        limit: 10,
      };

      AppleHealthKit.getHeartRateVariabilitySamples(
        options,
        (error, results: HealthValue[]) => {
          if (error) {
            console.error('Error fetching HRV:', error);
            resolve(null);
            return;
          }

          if (results && results.length > 0) {
            const avgHRV =
              results.reduce((sum, item) => sum + item.value, 0) /
              results.length;
            resolve(Math.round(avgHRV));
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  async getRestingHeartRate(): Promise<number | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isAvailable) {
      return null;
    }

    return new Promise((resolve) => {
      const options: HealthInputOptions = {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        ascending: false,
        limit: 1,
      };

      AppleHealthKit.getRestingHeartRate(
        options,
        (error, results: HealthValue[]) => {
          if (error) {
            console.error('Error fetching resting heart rate:', error);
            resolve(null);
            return;
          }

          if (results && results.length > 0) {
            resolve(Math.round(results[0].value));
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  async getStepCount(): Promise<number | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isAvailable) {
      return null;
    }

    return new Promise((resolve) => {
      const options: HealthInputOptions = {
        startDate: new Date(
          new Date().setHours(0, 0, 0, 0)
        ).toISOString(),
        endDate: new Date().toISOString(),
      };

      AppleHealthKit.getStepCount(
        options,
        (error, results: { value: number }) => {
          if (error) {
            console.error('Error fetching step count:', error);
            resolve(null);
            return;
          }

          if (results) {
            resolve(Math.round(results.value));
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  async getSleepAnalysis(): Promise<number | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isAvailable) {
      return null;
    }

    return new Promise((resolve) => {
      const options: HealthInputOptions = {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      };

      AppleHealthKit.getSleepSamples(
        options,
        (error, results: any[]) => {
          if (error) {
            console.error('Error fetching sleep data:', error);
            resolve(null);
            return;
          }

          if (results && results.length > 0) {
            const totalSleepMinutes = results.reduce((sum, item) => {
              if (item.value === 'ASLEEP' || item.value === 'INBED') {
                const start = new Date(item.startDate).getTime();
                const end = new Date(item.endDate).getTime();
                return sum + (end - start) / (1000 * 60);
              }
              return sum;
            }, 0);

            resolve(Math.round(totalSleepMinutes / 60 * 10) / 10);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  async getMindfulMinutes(): Promise<number | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isAvailable) {
      return null;
    }

    return new Promise((resolve) => {
      const options: HealthInputOptions = {
        startDate: new Date(
          new Date().setHours(0, 0, 0, 0)
        ).toISOString(),
        endDate: new Date().toISOString(),
      };

      AppleHealthKit.getMindfulSession(
        options,
        (error, results: any[]) => {
          if (error) {
            console.error('Error fetching mindful sessions:', error);
            resolve(null);
            return;
          }

          if (results && results.length > 0) {
            const totalMinutes = results.reduce((sum, item) => {
              const start = new Date(item.startDate).getTime();
              const end = new Date(item.endDate).getTime();
              return sum + (end - start) / (1000 * 60);
            }, 0);

            resolve(Math.round(totalMinutes));
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  async saveMindfulSession(
    startDate: Date,
    endDate: Date
  ): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isAvailable) {
      return false;
    }

    return new Promise((resolve) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.saveMindfulSession(options, (error) => {
        if (error) {
          console.error('Error saving mindful session:', error);
          resolve(false);
          return;
        }

        resolve(true);
      });
    });
  }

  async getBiometricData(): Promise<BiometricData> {
    const [
      heartRate,
      hrv,
      restingHeartRate,
      stepCount,
      sleepHours,
      mindfulMinutes,
    ] = await Promise.all([
      this.getHeartRate(),
      this.getHeartRateVariability(),
      this.getRestingHeartRate(),
      this.getStepCount(),
      this.getSleepAnalysis(),
      this.getMindfulMinutes(),
    ]);

    return {
      heartRate,
      heartRateVariability: hrv,
      restingHeartRate,
      stepCount,
      sleepHours,
      mindfulMinutes,
      timestamp: new Date(),
    };
  }

  async getHistoricalHeartRate(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: Date; value: number }>> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isAvailable) {
      return [];
    }

    return new Promise((resolve) => {
      const options: HealthInputOptions = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: true,
      };

      AppleHealthKit.getHeartRateSamples(
        options,
        (error, results: HealthValue[]) => {
          if (error) {
            console.error('Error fetching historical heart rate:', error);
            resolve([]);
            return;
          }

          if (results && results.length > 0) {
            const data = results.map((item) => ({
              date: new Date(item.startDate),
              value: Math.round(item.value),
            }));
            resolve(data);
          } else {
            resolve([]);
          }
        }
      );
    });
  }

  async getHistoricalHRV(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: Date; value: number }>> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isAvailable) {
      return [];
    }

    return new Promise((resolve) => {
      const options: HealthInputOptions = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: true,
      };

      AppleHealthKit.getHeartRateVariabilitySamples(
        options,
        (error, results: HealthValue[]) => {
          if (error) {
            console.error('Error fetching historical HRV:', error);
            resolve([]);
            return;
          }

          if (results && results.length > 0) {
            const data = results.map((item) => ({
              date: new Date(item.startDate),
              value: Math.round(item.value),
            }));
            resolve(data);
          } else {
            resolve([]);
          }
        }
      );
    });
  }

  isHealthKitAvailable(): boolean {
    return this.isAvailable && this.isInitialized;
  }

  async requestPermissions(): Promise<boolean> {
    return this.initialize();
  }
}

export default new HealthKitService();