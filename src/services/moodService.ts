import * as SQLite from 'expo-sqlite';
import { Mood } from '../models/Mood';

const db = SQLite.openDatabase('mindflow.db');

export const moodService = {
  createMood: (energy: number, emoji: string, note?: string): Promise<number> => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO moods (timestamp, energy, emoji, note) VALUES (?, ?, ?, ?)`,
          [Date.now(), energy, emoji, note || null],
          (_, result) => {
            resolve(result.insertId || 0);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  },

  getMoodById: (id: number): Promise<Mood | null> => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM moods WHERE id = ?`,
          [id],
          (_, result) => {
            if (result.rows.length > 0) {
              const row = result.rows.item(0);
              resolve({
                id: row.id,
                timestamp: row.timestamp,
                energy: row.energy,
                emoji: row.emoji,
                note: row.note,
                createdAt: row.created_at
              });
            } else {
              resolve(null);
            }
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  },

  getAllMoods: (limit?: number): Promise<Mood[]> => {
    return new Promise((resolve, reject) => {
      const query = limit
        ? `SELECT * FROM moods ORDER BY timestamp DESC LIMIT ?`
        : `SELECT * FROM moods ORDER BY timestamp DESC`;
      const params = limit ? [limit] : [];

      db.transaction(tx => {
        tx.executeSql(
          query,
          params,
          (_, result) => {
            const moods: Mood[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              const row = result.rows.item(i);
              moods.push({
                id: row.id,
                timestamp: row.timestamp,
                energy: row.energy,
                emoji: row.emoji,
                note: row.note,
                createdAt: row.created_at
              });
            }
            resolve(moods);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  },

  getMoodsByDateRange: (startTimestamp: number, endTimestamp: number): Promise<Mood[]> => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM moods WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC`,
          [startTimestamp, endTimestamp],
          (_, result) => {
            const moods: Mood[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              const row = result.rows.item(i);
              moods.push({
                id: row.id,
                timestamp: row.timestamp,
                energy: row.energy,
                emoji: row.emoji,
                note: row.note,
                createdAt: row.created_at
              });
            }
            resolve(moods);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  },

  getLatestMood: (): Promise<Mood | null> => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM moods ORDER BY timestamp DESC LIMIT 1`,
          [],
          (_, result) => {
            if (result.rows.length > 0) {
              const row = result.rows.item(0);
              resolve({
                id: row.id,
                timestamp: row.timestamp,
                energy: row.energy,
                emoji: row.emoji,
                note: row.note,
                createdAt: row.created_at
              });
            } else {
              resolve(null);
            }
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  },

  updateMood: (id: number, energy: number, emoji: string, note?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `UPDATE moods SET energy = ?, emoji = ?, note = ? WHERE id = ?`,
          [energy, emoji, note || null, id],
          () => {
            resolve();
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  },

  deleteMood: (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `DELETE FROM moods WHERE id = ?`,
          [id],
          () => {
            resolve();
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  },

  getAverageEnergyByHour: (hour: number, dayOfWeek?: number): Promise<number> => {
    return new Promise((resolve, reject) => {
      const hourStart = hour * 3600 * 1000;
      const hourEnd = (hour + 1) * 3600 * 1000;

      let query = `
        SELECT AVG(energy) as avgEnergy 
        FROM moods 
        WHERE (timestamp % 86400000) >= ? AND (timestamp % 86400000) < ?
      `;
      const params: number[] = [hourStart, hourEnd];

      if (dayOfWeek !== undefined) {
        query += ` AND CAST(strftime('%w', timestamp / 1000, 'unixepoch') AS INTEGER) = ?`;
        params.push(dayOfWeek);
      }

      db.transaction(tx => {
        tx.executeSql(
          query,
          params,
          (_, result) => {
            const avgEnergy = result.rows.item(0).avgEnergy;
            resolve(avgEnergy || 50);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  },

  getMoodCountByDateRange: (startTimestamp: number, endTimestamp: number): Promise<number> => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT COUNT(*) as count FROM moods WHERE timestamp >= ? AND timestamp <= ?`,
          [startTimestamp, endTimestamp],
          (_, result) => {
            resolve(result.rows.item(0).count);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  },

  getEnergyTrend: (days: number): Promise<{ timestamp: number; avgEnergy: number }[]> => {
    return new Promise((resolve, reject) => {
      const startTimestamp = Date.now() - days * 24 * 60 * 60 * 1000;

      db.transaction(tx => {
        tx.executeSql(
          `
            SELECT 
              CAST(timestamp / 86400000 AS INTEGER) * 86400000 as dayTimestamp,
              AVG(energy) as avgEnergy
            FROM moods
            WHERE timestamp >= ?
            GROUP BY dayTimestamp
            ORDER BY dayTimestamp ASC
          `,
          [startTimestamp],
          (_, result) => {
            const trend: { timestamp: number; avgEnergy: number }[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              const row = result.rows.item(i);
              trend.push({
                timestamp: row.dayTimestamp,
                avgEnergy: row.avgEnergy
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
  },

  deleteOldMoods: (daysToKeep: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cutoffTimestamp = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

      db.transaction(tx => {
        tx.executeSql(
          `DELETE FROM moods WHERE timestamp < ?`,
          [cutoffTimestamp],
          () => {
            resolve();
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  },

  getMoodStats: (startTimestamp: number, endTimestamp: number): Promise<{
    count: number;
    avgEnergy: number;
    minEnergy: number;
    maxEnergy: number;
  }> => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `
            SELECT 
              COUNT(*) as count,
              AVG(energy) as avgEnergy,
              MIN(energy) as minEnergy,
              MAX(energy) as maxEnergy
            FROM moods
            WHERE timestamp >= ? AND timestamp <= ?
          `,
          [startTimestamp, endTimestamp],
          (_, result) => {
            const row = result.rows.item(0);
            resolve({
              count: row.count,
              avgEnergy: row.avgEnergy || 0,
              minEnergy: row.minEnergy || 0,
              maxEnergy: row.maxEnergy || 0
            });
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
};