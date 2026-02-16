import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '../models/Session';
import { BiometricData } from '../models/BiometricData';
import { Statistics } from '../models/Statistics';
import { Emotion } from '../models/Emotion';
import { Exercise } from '../models/Exercise';
import { startOfDay, endOfDay, subDays, format, parseISO, differenceInDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

const STORAGE_KEYS = {
  SESSIONS: '@mindflow_sessions',
  BIOMETRIC_DATA: '@mindflow_biometric_data',
  STATISTICS: '@mindflow_statistics',
};

interface StressLevel {
  level: number; // 0-100
  category: 'low' | 'moderate' | 'high' | 'very_high';
  timestamp: string;
}

interface ProgressMetrics {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  averageSessionDuration: number;
  completionRate: number;
  improvementRate: number;
}

interface EmotionTrend {
  emotion: Emotion;
  count: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface ExerciseEffectiveness {
  exercise: Exercise;
  totalSessions: number;
  averageStressReduction: number;
  averageRating: number;
  effectiveness: number; // 0-100
}

interface TimeDistribution {
  morning: number; // 6-12
  afternoon: number; // 12-18
  evening: number; // 18-24
  night: number; // 0-6
}

interface WeeklyComparison {
  currentWeek: {
    sessions: number;
    minutes: number;
    averageStress: number;
  };
  previousWeek: {
    sessions: number;
    minutes: number;
    averageStress: number;
  };
  change: {
    sessions: number;
    minutes: number;
    averageStress: number;
  };
}

class AnalyticsService {
  private sessionsCache: Session[] | null = null;
  private biometricCache: BiometricData[] | null = null;
  private statisticsCache: Statistics | null = null;

  async getSessions(startDate?: Date, endDate?: Date): Promise<Session[]> {
    try {
      const sessionsJson = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      const sessions: Session[] = sessionsJson ? JSON.parse(sessionsJson) : [];

      if (!startDate && !endDate) {
        this.sessionsCache = sessions;
        return sessions;
      }

      return sessions.filter(session => {
        const sessionDate = parseISO(session.startTime);
        if (startDate && sessionDate < startOfDay(startDate)) return false;
        if (endDate && sessionDate > endOfDay(endDate)) return false;
        return true;
      });
    } catch (error) {
      console.error('Error getting sessions:', error);
      return [];
    }
  }

  async getBiometricData(startDate?: Date, endDate?: Date): Promise<BiometricData[]> {
    try {
      const biometricJson = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_DATA);
      const biometricData: BiometricData[] = biometricJson ? JSON.parse(biometricJson) : [];

      if (!startDate && !endDate) {
        this.biometricCache = biometricData;
        return biometricData;
      }

      return biometricData.filter(data => {
        const dataDate = parseISO(data.timestamp);
        if (startDate && dataDate < startOfDay(startDate)) return false;
        if (endDate && dataDate > endOfDay(endDate)) return false;
        return true;
      });
    } catch (error) {
      console.error('Error getting biometric data:', error);
      return [];
    }
  }

  async saveSession(session: Session): Promise<void> {
    try {
      const sessions = await this.getSessions();
      sessions.push(session);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      this.sessionsCache = sessions;
      await this.updateStatistics();
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  }

  async saveBiometricData(data: BiometricData): Promise<void> {
    try {
      const biometricData = await this.getBiometricData();
      biometricData.push(data);
      await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_DATA, JSON.stringify(biometricData));
      this.biometricCache = biometricData;
    } catch (error) {
      console.error('Error saving biometric data:', error);
      throw error;
    }
  }

  async calculateStressLevel(biometricData?: BiometricData): Promise<StressLevel> {
    try {
      let data = biometricData;
      
      if (!data) {
        const allData = await this.getBiometricData();
        data = allData[allData.length - 1];
      }

      if (!data) {
        return {
          level: 50,
          category: 'moderate',
          timestamp: new Date().toISOString(),
        };
      }

      let stressScore = 0;
      let factors = 0;

      // Heart rate factor (40-100 bpm normal, >100 stressed)
      if (data.heartRate) {
        const hrStress = Math.max(0, Math.min(100, ((data.heartRate - 60) / 40) * 100));
        stressScore += hrStress;
        factors++;
      }

      // HRV factor (lower HRV = higher stress)
      if (data.heartRateVariability) {
        const hrvStress = Math.max(0, Math.min(100, (100 - data.heartRateVariability)));
        stressScore += hrvStress;
        factors++;
      }

      // Sleep quality factor
      if (data.sleepQuality !== undefined) {
        const sleepStress = (100 - data.sleepQuality);
        stressScore += sleepStress;
        factors++;
      }

      // Activity level factor (low activity = higher stress)
      if (data.activityLevel !== undefined) {
        const activityStress = (100 - data.activityLevel);
        stressScore += activityStress * 0.5; // Lower weight
        factors += 0.5;
      }

      const averageStress = factors > 0 ? stressScore / factors : 50;

      let category: StressLevel['category'];
      if (averageStress < 25) category = 'low';
      else if (averageStress < 50) category = 'moderate';
      else if (averageStress < 75) category = 'high';
      else category = 'very_high';

      return {
        level: Math.round(averageStress),
        category,
        timestamp: data.timestamp,
      };
    } catch (error) {
      console.error('Error calculating stress level:', error);
      return {
        level: 50,
        category: 'moderate',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getProgressMetrics(days: number = 30): Promise<ProgressMetrics> {
    try {
      const startDate = subDays(new Date(), days);
      const sessions = await this.getSessions(startDate);

      const totalSessions = sessions.length;
      const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration / 60), 0);
      const averageSessionDuration = totalSessions > 0 ? totalMinutes / totalSessions : 0;

      const currentStreak = await this.calculateCurrentStreak();
      const longestStreak = await this.calculateLongestStreak();

      const completedSessions = sessions.filter(s => s.completed).length;
      const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

      const improvementRate = await this.calculateImprovementRate(sessions);

      return {
        totalSessions,
        totalMinutes: Math.round(totalMinutes),
        currentStreak,
        longestStreak,
        averageSessionDuration: Math.round(averageSessionDuration),
        completionRate: Math.round(completionRate),
        improvementRate: Math.round(improvementRate),
      };
    } catch (error) {
      console.error('Error getting progress metrics:', error);
      return {
        totalSessions: 0,
        totalMinutes: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageSessionDuration: 0,
        completionRate: 0,
        improvementRate: 0,
      };
    }
  }

  async calculateCurrentStreak(): Promise<number> {
    try {
      const sessions = await this.getSessions();
      if (sessions.length === 0) return 0;

      const sessionDates = sessions
        .map(s => format(parseISO(s.startTime), 'yyyy-MM-dd'))
        .filter((date, index, self) => self.indexOf(date) === index)
        .sort((a, b) => b.localeCompare(a));

      let streak = 0;
      let currentDate = new Date();

      for (const dateStr of sessionDates) {
        const sessionDate = parseISO(dateStr);
        const daysDiff = differenceInDays(startOfDay(currentDate), startOfDay(sessionDate));

        if (daysDiff === 0 || daysDiff === 1) {
          streak++;
          currentDate = sessionDate;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating current streak:', error);
      return 0;
    }
  }

  async calculateLongestStreak(): Promise<number> {
    try {
      const sessions = await this.getSessions();
      if (sessions.length === 0) return 0;

      const sessionDates = sessions
        .map(s => format(parseISO(s.startTime), 'yyyy-MM-dd'))
        .filter((date, index, self) => self.indexOf(date) === index)
        .sort();

      let longestStreak = 0;
      let currentStreak = 1;

      for (let i = 1; i < sessionDates.length; i++) {
        const prevDate = parseISO(sessionDates[i - 1]);
        const currDate = parseISO(sessionDates[i]);
        const daysDiff = differenceInDays(currDate, prevDate);

        if (daysDiff === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      }

      return Math.max(longestStreak, currentStreak);
    } catch (error) {
      console.error('Error calculating longest streak:', error);
      return 0;
    }
  }

  async calculateImprovementRate(sessions: Session[]): Promise<number> {
    try {
      if (sessions.length < 2) return 0;

      const sortedSessions = sessions.sort((a, b) => 
        parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime()
      );

      const firstHalf = sortedSessions.slice(0, Math.floor(sortedSessions.length / 2));
      const secondHalf = sortedSessions.slice(Math.floor(sortedSessions.length / 2));

      const avgStressFirstHalf = firstHalf.reduce((sum, s) => sum + (s.stressLevelBefore || 50), 0) / firstHalf.length;
      const avgStressSecondHalf = secondHalf.reduce((sum, s) => sum + (s.stressLevelAfter || 50), 0) / secondHalf.length;

      const improvement = ((avgStressFirstHalf - avgStressSecondHalf) / avgStressFirstHalf) * 100;

      return Math.max(-100, Math.min(100, improvement));
    } catch (error) {
      console.error('Error calculating improvement rate:', error);
      return 0;
    }
  }

  async getEmotionTrends(days: number = 30): Promise<EmotionTrend[]> {
    try {
      const startDate = subDays(new Date(), days);
      const sessions = await this.getSessions(startDate);

      const emotionCounts = new Map<string, number>();
      sessions.forEach(session => {
        const count = emotionCounts.get(session.emotion) || 0;
        emotionCounts.set(session.emotion, count + 1);
      });

      const total = sessions.length;
      const trends: EmotionTrend[] = [];

      emotionCounts.forEach((count, emotion) => {
        const percentage = (count / total) * 100;
        const trend = this.calculateEmotionTrend(sessions, emotion as Emotion);

        trends.push({
          emotion: emotion as Emotion,
          count,
          percentage: Math.round(percentage),
          trend,
        });
      });

      return trends.sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Error getting emotion trends:', error);
      return [];
    }
  }

  private calculateEmotionTrend(sessions: Session[], emotion: Emotion): 'increasing' | 'decreasing' | 'stable' {
    const emotionSessions = sessions.filter(s => s.emotion === emotion);
    if (emotionSessions.length < 2) return 'stable';

    const midpoint = Math.floor(emotionSessions.length / 2);
    const firstHalf = emotionSessions.slice(0, midpoint).length;
    const secondHalf = emotionSessions.slice(midpoint).length;

    const difference = ((secondHalf - firstHalf) / firstHalf) * 100;

    if (difference > 10) return 'increasing';
    if (difference < -10) return 'decreasing';
    return 'stable';
  }

  async getExerciseEffectiveness(days: number = 30): Promise<ExerciseEffectiveness[]> {
    try {
      const startDate = subDays(new Date(), days);
      const sessions = await this.getSessions(startDate);

      const exerciseStats = new Map<string, {
        sessions: Session[];
        totalStressReduction: number;
        totalRating: number;
      }>();

      sessions.forEach(session => {
        if (!session.completed) return;

        const stats = exerciseStats.get(session.exerciseType) || {
          sessions: [],
          totalStressReduction: 0,
          totalRating: 0,
        };

        stats.sessions.push(session);
        
        if (session.stressLevelBefore && session.stressLevelAfter) {
          stats.totalStressReduction += (session.stressLevelBefore - session.stressLevelAfter);
        }

        if (session.rating) {
          stats.totalRating += session.rating;
        }

        exerciseStats.set(session.exerciseType, stats);
      });

      const effectiveness: ExerciseEffectiveness[] = [];

      exerciseStats.forEach((stats, exercise) => {
        const totalSessions = stats.sessions.length;
        const averageStressReduction = stats.totalStressReduction / totalSessions;
        const averageRating = stats.totalRating / totalSessions;

        // Effectiveness = weighted