import * as SQLite from 'expo-sqlite';
import { format, startOfDay, endOfDay, subDays, getHours, getDay } from 'date-fns';

interface MoodRecord {
  id: number;
  timestamp: number;
  energy: number;
  emoji: string;
  note: string | null;
  created_at: number;
}

interface EnergyPattern {
  id: number;
  day_of_week: number;
  hour_of_day: number;
  average_energy: number;
  sample_count: number;
  last_updated: number;
}

interface EnergyPrediction {
  currentEnergy: number;
  predictedEnergy: number;
  confidence: number;
  peakHours: number[];
  lowEnergyHours: number[];
}

class EnergyService {
  private db: SQLite.WebSQLDatabase;

  constructor() {
    this.db = SQLite.openDatabase('mindflow.db');
  }

  async getCurrentEnergy(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT energy FROM moods 
           ORDER BY timestamp DESC 
           LIMIT 1`,
          [],
          (_, { rows }) => {
            if (rows.length > 0) {
              resolve(rows.item(0).energy);
            } else {
              resolve(50);
            }
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getAverageEnergyForPeriod(startTimestamp: number, endTimestamp: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT AVG(energy) as avg_energy FROM moods 
           WHERE timestamp >= ? AND timestamp <= ?`,
          [startTimestamp, endTimestamp],
          (_, { rows }) => {
            if (rows.length > 0 && rows.item(0).avg_energy !== null) {
              resolve(Math.round(rows.item(0).avg_energy));
            } else {
              resolve(50);
            }
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getEnergyTrend(days: number = 7): Promise<{ date: string; energy: number }[]> {
    const now = Date.now();
    const startDate = subDays(now, days);
    const startTimestamp = Math.floor(startDate.getTime() / 1000);

    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT 
             DATE(timestamp, 'unixepoch', 'localtime') as date,
             AVG(energy) as avg_energy
           FROM moods
           WHERE timestamp >= ?
           GROUP BY date
           ORDER BY date ASC`,
          [startTimestamp],
          (_, { rows }) => {
            const trend: { date: string; energy: number }[] = [];
            for (let i = 0; i < rows.length; i++) {
              const item = rows.item(i);
              trend.push({
                date: item.date,
                energy: Math.round(item.avg_energy)
              });
            }
            resolve(trend);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getEnergyByHour(date?: Date): Promise<{ hour: number; energy: number }[]> {
    const targetDate = date || new Date();
    const startTimestamp = Math.floor(startOfDay(targetDate).getTime() / 1000);
    const endTimestamp = Math.floor(endOfDay(targetDate).getTime() / 1000);

    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT 
             CAST(strftime('%H', timestamp, 'unixepoch', 'localtime') AS INTEGER) as hour,
             AVG(energy) as avg_energy
           FROM moods
           WHERE timestamp >= ? AND timestamp <= ?
           GROUP BY hour
           ORDER BY hour ASC`,
          [startTimestamp, endTimestamp],
          (_, { rows }) => {
            const hourlyData: { hour: number; energy: number }[] = [];
            for (let i = 0; i < rows.length; i++) {
              const item = rows.item(i);
              hourlyData.push({
                hour: item.hour,
                energy: Math.round(item.avg_energy)
              });
            }
            resolve(hourlyData);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async updateEnergyPatterns(): Promise<void> {
    const thirtyDaysAgo = Math.floor(subDays(Date.now(), 30).getTime() / 1000);

    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT 
             CAST(strftime('%w', timestamp, 'unixepoch', 'localtime') AS INTEGER) as day_of_week,
             CAST(strftime('%H', timestamp, 'unixepoch', 'localtime') AS INTEGER) as hour_of_day,
             AVG(energy) as avg_energy,
             COUNT(*) as sample_count
           FROM moods
           WHERE timestamp >= ?
           GROUP BY day_of_week, hour_of_day`,
          [thirtyDaysAgo],
          (_, { rows }) => {
            for (let i = 0; i < rows.length; i++) {
              const item = rows.item(i);
              this.upsertEnergyPattern(
                item.day_of_week,
                item.hour_of_day,
                item.avg_energy,
                item.sample_count
              );
            }
            resolve();
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  private async upsertEnergyPattern(
    dayOfWeek: number,
    hourOfDay: number,
    avgEnergy: number,
    sampleCount: number
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);

    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO energy_patterns (day_of_week, hour_of_day, average_energy, sample_count, last_updated)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(day_of_week, hour_of_day) 
           DO UPDATE SET 
             average_energy = ?,
             sample_count = ?,
             last_updated = ?`,
          [dayOfWeek, hourOfDay, avgEnergy, sampleCount, now, avgEnergy, sampleCount, now],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getPredictedEnergy(timestamp: number): Promise<number> {
    const date = new Date(timestamp);
    const dayOfWeek = getDay(date);
    const hourOfDay = getHours(date);

    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT average_energy FROM energy_patterns
           WHERE day_of_week = ? AND hour_of_day = ?`,
          [dayOfWeek, hourOfDay],
          (_, { rows }) => {
            if (rows.length > 0) {
              resolve(Math.round(rows.item(0).average_energy));
            } else {
              this.getDefaultEnergyForHour(hourOfDay).then(resolve).catch(reject);
            }
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  private async getDefaultEnergyForHour(hour: number): Promise<number> {
    if (hour >= 6 && hour < 9) return 60;
    if (hour >= 9 && hour < 12) return 75;
    if (hour >= 12 && hour < 14) return 55;
    if (hour >= 14 && hour < 17) return 70;
    if (hour >= 17 && hour < 20) return 60;
    if (hour >= 20 && hour < 22) return 45;
    return 35;
  }

  async getEnergyPrediction(): Promise<EnergyPrediction> {
    const currentEnergy = await this.getCurrentEnergy();
    const now = Date.now();
    const predictedEnergy = await this.getPredictedEnergy(now);
    const peakHours = await this.getPeakEnergyHours();
    const lowEnergyHours = await this.getLowEnergyHours();
    const confidence = await this.calculateConfidence();

    return {
      currentEnergy,
      predictedEnergy,
      confidence,
      peakHours,
      lowEnergyHours
    };
  }

  async getPeakEnergyHours(): Promise<number[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT hour_of_day, AVG(average_energy) as avg_energy
           FROM energy_patterns
           GROUP BY hour_of_day
           HAVING avg_energy >= 70
           ORDER BY avg_energy DESC
           LIMIT 3`,
          [],
          (_, { rows }) => {
            const hours: number[] = [];
            for (let i = 0; i < rows.length; i++) {
              hours.push(rows.item(i).hour_of_day);
            }
            resolve(hours);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getLowEnergyHours(): Promise<number[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT hour_of_day, AVG(average_energy) as avg_energy
           FROM energy_patterns
           GROUP BY hour_of_day
           HAVING avg_energy <= 50
           ORDER BY avg_energy ASC
           LIMIT 3`,
          [],
          (_, { rows }) => {
            const hours: number[] = [];
            for (let i = 0; i < rows.length; i++) {
              hours.push(rows.item(i).hour_of_day);
            }
            resolve(hours);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  private async calculateConfidence(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT COUNT(*) as total_records FROM moods`,
          [],
          (_, { rows }) => {
            const totalRecords = rows.item(0).total_records;
            if (totalRecords < 10) {
              resolve(0.2);
            } else if (totalRecords < 50) {
              resolve(0.5);
            } else if (totalRecords < 100) {
              resolve(0.7);
            } else {
              resolve(0.9);
            }
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getEnergyForTimeRange(startHour: number, endHour: number, dayOfWeek?: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const query = dayOfWeek !== undefined
        ? `SELECT AVG(average_energy) as avg_energy FROM energy_patterns
           WHERE hour_of_day >= ? AND hour_of_day <= ? AND day_of_week = ?`
        : `SELECT AVG(average_energy) as avg_energy FROM energy_patterns
           WHERE hour_of_day >= ? AND hour_of_day <= ?`;

      const params = dayOfWeek !== undefined ? [startHour, endHour, dayOfWeek] : [startHour, endHour];

      this.db.transaction(tx => {
        tx.executeSql(
          query,
          params,
          (_, { rows }) => {
            if (rows.length > 0 && rows.item(0).avg_energy !== null) {
              resolve(Math.round(rows.item(0).avg_energy));
            } else {
              const midHour = Math.floor((startHour + endHour) / 2);
              this.getDefaultEnergyForHour(midHour).then(resolve).catch(reject);
            }
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getBestTimeForTask(duration: number, priority: 'low' | 'medium' | 'high'): Promise<number[]> {
    const energyThreshold = priority === 'high' ? 70 : priority === 'medium' ? 60 : 50;
    const now = new Date();
    const currentHour = getHours(now);
    const dayOfWeek = getDay(now);

    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT hour_of_day, average_energy
           FROM energy_patterns
           WHERE day_of_week = ? AND hour_of_day >= ? AND average_energy >= ?
           ORDER BY average_energy DESC
           LIMIT 5`,
          [dayOfWeek, currentHour, energyThreshold],
          (_, { rows }) => {
            const hours: number[] = [];
            for (let i = 0; i < rows.length; i++) {
              hours.push(rows.item(i).hour_of_day);
            }
            resolve(hours);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getEnergyVariability(): Promise<number> {
    const thirtyDaysAgo = Math.floor(subDays(Date.now(), 30).getTime() / 1000);

    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT 
             AVG(energy) as mean,
             COUNT(*) as count
           FROM moods
           WHERE timestamp >= ?`,
          [thirtyDaysAgo],
          (_, { rows }) => {
            if (rows.length === 0 || rows.item(0).count < 2) {
              resolve(0);
              return;
            }

            const mean = rows.item(0).mean;

            tx.executeSql(
              `SELECT energy FROM moods WHERE timestamp >= ?`,
              [thirtyDaysAgo],
              (_, { rows: energyRows }) => {
                let sumSquaredDiff = 0;
                for (let i = 0; i < energyRows.length; i++) {
                  const energy = energyRows.item(i).energy;
                  sumSquaredDiff += Math.pow(energy - mean, 2);
                }
                const variance = sumSquaredDiff / energyRows.length;
                const stdDev = Math.sqrt(variance);
                resolve(Math.round(stdDev));
              },
              (_, error) => {
                reject(error);
                return false;
              }
            );
          },
          (_, error) => {