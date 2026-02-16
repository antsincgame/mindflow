import { Emotion } from '../models/Emotion';
import { Exercise } from '../models/Exercise';
import { Session } from '../models/Session';
import { Achievement } from '../models/Achievement';
import { BiometricData } from '../models/BiometricData';
import { UserSettings } from '../models/UserSettings';

export const validators = {
  // Валидация эмоции
  isValidEmotion: (emotion: any): emotion is Emotion => {
    if (!emotion || typeof emotion !== 'object') return false;
    
    return (
      typeof emotion.id === 'string' &&
      typeof emotion.name === 'string' &&
      typeof emotion.description === 'string' &&
      typeof emotion.color === 'string' &&
      typeof emotion.icon === 'string' &&
      typeof emotion.intensity === 'number' &&
      emotion.intensity >= 1 &&
      emotion.intensity <= 10
    );
  },

  // Валидация упражнения
  isValidExercise: (exercise: any): exercise is Exercise => {
    if (!exercise || typeof exercise !== 'object') return false;

    const validTypes = ['breathing', 'meditation', 'movement', 'visualization', 'journaling'];
    const validDurations = [60, 120, 180, 300, 600, 900, 1200, 1800];

    return (
      typeof exercise.id === 'string' &&
      typeof exercise.name === 'string' &&
      typeof exercise.description === 'string' &&
      validTypes.includes(exercise.type) &&
      validDurations.includes(exercise.duration) &&
      typeof exercise.difficulty === 'string' &&
      ['beginner', 'intermediate', 'advanced'].includes(exercise.difficulty) &&
      Array.isArray(exercise.emotionIds) &&
      exercise.emotionIds.every((id: any) => typeof id === 'string') &&
      Array.isArray(exercise.steps) &&
      exercise.steps.every((step: any) => typeof step === 'string') &&
      (exercise.audioUrl === undefined || typeof exercise.audioUrl === 'string') &&
      (exercise.videoUrl === undefined || typeof exercise.videoUrl === 'string')
    );
  },

  // Валидация сессии
  isValidSession: (session: any): session is Session => {
    if (!session || typeof session !== 'object') return false;

    return (
      typeof session.id === 'string' &&
      typeof session.exerciseId === 'string' &&
      typeof session.emotionId === 'string' &&
      session.startTime instanceof Date &&
      session.endTime instanceof Date &&
      session.startTime <= session.endTime &&
      typeof session.duration === 'number' &&
      session.duration > 0 &&
      typeof session.completed === 'boolean' &&
      typeof session.rating === 'number' &&
      session.rating >= 1 &&
      session.rating <= 5 &&
      (session.notes === undefined || typeof session.notes === 'string') &&
      (session.biometricData === undefined || validators.isValidBiometricData(session.biometricData))
    );
  },

  // Валидация достижения
  isValidAchievement: (achievement: any): achievement is Achievement => {
    if (!achievement || typeof achievement !== 'object') return false;

    const validCategories = ['streak', 'sessions', 'time', 'variety', 'special'];

    return (
      typeof achievement.id === 'string' &&
      typeof achievement.name === 'string' &&
      typeof achievement.description === 'string' &&
      validCategories.includes(achievement.category) &&
      typeof achievement.icon === 'string' &&
      typeof achievement.unlocked === 'boolean' &&
      (achievement.unlockedAt === undefined || achievement.unlockedAt instanceof Date) &&
      typeof achievement.progress === 'number' &&
      achievement.progress >= 0 &&
      achievement.progress <= 100 &&
      typeof achievement.target === 'number' &&
      achievement.target > 0
    );
  },

  // Валидация биометрических данных
  isValidBiometricData: (data: any): data is BiometricData => {
    if (!data || typeof data !== 'object') return false;

    return (
      typeof data.timestamp === 'number' &&
      data.timestamp > 0 &&
      (data.heartRate === undefined || (typeof data.heartRate === 'number' && data.heartRate > 0 && data.heartRate < 300)) &&
      (data.heartRateVariability === undefined || (typeof data.heartRateVariability === 'number' && data.heartRateVariability >= 0)) &&
      (data.respiratoryRate === undefined || (typeof data.respiratoryRate === 'number' && data.respiratoryRate > 0 && data.respiratoryRate < 100)) &&
      (data.oxygenSaturation === undefined || (typeof data.oxygenSaturation === 'number' && data.oxygenSaturation >= 0 && data.oxygenSaturation <= 100)) &&
      (data.stressLevel === undefined || (typeof data.stressLevel === 'number' && data.stressLevel >= 0 && data.stressLevel <= 100)) &&
      (data.bloodPressureSystolic === undefined || (typeof data.bloodPressureSystolic === 'number' && data.bloodPressureSystolic > 0 && data.bloodPressureSystolic < 300)) &&
      (data.bloodPressureDiastolic === undefined || (typeof data.bloodPressureDiastolic === 'number' && data.bloodPressureDiastolic > 0 && data.bloodPressureDiastolic < 200))
    );
  },

  // Валидация настроек пользователя
  isValidUserSettings: (settings: any): settings is UserSettings => {
    if (!settings || typeof settings !== 'object') return false;

    return (
      typeof settings.notificationsEnabled === 'boolean' &&
      typeof settings.dailyReminderTime === 'string' &&
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(settings.dailyReminderTime) &&
      typeof settings.soundEnabled === 'boolean' &&
      typeof settings.hapticsEnabled === 'boolean' &&
      typeof settings.theme === 'string' &&
      ['light', 'dark', 'auto'].includes(settings.theme) &&
      typeof settings.biometricTrackingEnabled === 'boolean' &&
      Array.isArray(settings.preferredExerciseTypes) &&
      settings.preferredExerciseTypes.every((type: any) => 
        ['breathing', 'meditation', 'movement', 'visualization', 'journaling'].includes(type)
      ) &&
      typeof settings.defaultSessionDuration === 'number' &&
      [60, 120, 180, 300, 600, 900, 1200, 1800].includes(settings.defaultSessionDuration)
    );
  },

  // Валидация email
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Валидация имени пользователя
  isValidUsername: (username: string): boolean => {
    return (
      typeof username === 'string' &&
      username.length >= 3 &&
      username.length <= 30 &&
      /^[a-zA-Z0-9_]+$/.test(username)
    );
  },

  // Валидация даты
  isValidDate: (date: any): date is Date => {
    return date instanceof Date && !isNaN(date.getTime());
  },

  // Валидация диапазона дат
  isValidDateRange: (startDate: Date, endDate: Date): boolean => {
    return (
      validators.isValidDate(startDate) &&
      validators.isValidDate(endDate) &&
      startDate <= endDate
    );
  },

  // Валидация рейтинга
  isValidRating: (rating: number): boolean => {
    return (
      typeof rating === 'number' &&
      Number.isInteger(rating) &&
      rating >= 1 &&
      rating <= 5
    );
  },

  // Валидация интенсивности эмоции
  isValidEmotionIntensity: (intensity: number): boolean => {
    return (
      typeof intensity === 'number' &&
      Number.isInteger(intensity) &&
      intensity >= 1 &&
      intensity <= 10
    );
  },

  // Валидация длительности упражнения
  isValidExerciseDuration: (duration: number): boolean => {
    const validDurations = [60, 120, 180, 300, 600, 900, 1200, 1800];
    return validDurations.includes(duration);
  },

  // Валидация типа упражнения
  isValidExerciseType: (type: string): boolean => {
    const validTypes = ['breathing', 'meditation', 'movement', 'visualization', 'journaling'];
    return validTypes.includes(type);
  },

  // Валидация уровня сложности
  isValidDifficulty: (difficulty: string): boolean => {
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    return validDifficulties.includes(difficulty);
  },

  // Валидация URL
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Валидация HEX цвета
  isValidHexColor: (color: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  },

  // Валидация процента (0-100)
  isValidPercentage: (value: number): boolean => {
    return (
      typeof value === 'number' &&
      value >= 0 &&
      value <= 100
    );
  },

  // Валидация положительного числа
  isPositiveNumber: (value: number): boolean => {
    return typeof value === 'number' && value > 0 && !isNaN(value);
  },

  // Валидация неотрицательного числа
  isNonNegativeNumber: (value: number): boolean => {
    return typeof value === 'number' && value >= 0 && !isNaN(value);
  },

  // Валидация строки (не пустая)
  isNonEmptyString: (value: string): boolean => {
    return typeof value === 'string' && value.trim().length > 0;
  },

  // Валидация массива (не пустой)
  isNonEmptyArray: <T>(value: T[]): boolean => {
    return Array.isArray(value) && value.length > 0;
  },

  // Валидация времени в формате HH:MM
  isValidTimeFormat: (time: string): boolean => {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  },

  // Валидация пульса
  isValidHeartRate: (heartRate: number): boolean => {
    return (
      typeof heartRate === 'number' &&
      heartRate > 0 &&
      heartRate < 300
    );
  },

  // Валидация вариабельности пульса
  isValidHRV: (hrv: number): boolean => {
    return (
      typeof hrv === 'number' &&
      hrv >= 0
    );
  },

  // Валидация частоты дыхания
  isValidRespiratoryRate: (rate: number): boolean => {
    return (
      typeof rate === 'number' &&
      rate > 0 &&
      rate < 100
    );
  },

  // Валидация сатурации кислорода
  isValidOxygenSaturation: (saturation: number): boolean => {
    return (
      typeof saturation === 'number' &&
      saturation >= 0 &&
      saturation <= 100
    );
  },

  // Валидация уровня стресса
  isValidStressLevel: (level: number): boolean => {
    return (
      typeof level === 'number' &&
      level >= 0 &&
      level <= 100
    );
  },

  // Валидация кровяного давления
  isValidBloodPressure: (systolic: number, diastolic: number): boolean => {
    return (
      typeof systolic === 'number' &&
      typeof diastolic === 'number' &&
      systolic > 0 &&
      systolic < 300 &&
      diastolic > 0 &&
      diastolic < 200 &&
      systolic > diastolic
    );
  },

  // Валидация ID
  isValidId: (id: string): boolean => {
    return typeof id === 'string' && id.length > 0;
  },

  // Валидация токена уведомлений
  isValidPushToken: (token: string): boolean => {
    return typeof token === 'string' && token.length > 0;
  },

  // Валидация языка
  isValidLanguage: (language: string): boolean => {
    const validLanguages = ['en', 'ru', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ko'];
    return validLanguages.includes(language);
  },

  // Валидация единиц измерения
  isValidUnit: (unit: string): boolean => {
    const validUnits = ['metric', 'imperial'];
    return validUnits.includes(unit);
  },

  // Валидация JSON строки
  isValidJSON: (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  },

  // Валидация версии приложения
  isValidVersion: (version: string): boolean => {
    return /^\d+\.\d+\.\d+$/.test(version);
  },

  // Валидация streak (серии)
  isValidStreak: (streak: number): boolean => {
    return (
      typeof streak === 'number' &&
      Number.isInteger(streak) &&
      streak >= 0
    );
  },

  // Валидация заметок (ограничение по длине)
  isValidNotes: (notes: string, maxLength: number = 1000): boolean => {
    return (
      typeof notes === 'string' &&
      notes.length <= maxLength
    );
  },

  // Валидация тега
  isValidTag: (tag: string): boolean => {
    return (
      typeof tag === 'string' &&
      tag.length >= 2 &&
      tag.length <= 30 &&
      /^[a-zA-Z0-9_-]+$/.test(tag)
    );
  },

  // Валидация массива тегов
  isValidTags: (tags: string[]): boolean => {
    return (
      Array.isArray(tags) &&
      tags.every(tag => validators.isValidTag(tag)) &&
      tags.length <= 10
    );
  },

  // Валидация временной метки (timestamp)
  isValidTimestamp: (timestamp: number): boolean => {
    return (
      typeof timestamp === 'number' &&
      timestamp > 0 &&
      timestamp <= Date.now()
    );
  },

  // Валидация координат (широта, долгота)
  isValidCoordinates: (latitude: number, longitude: number): boolean => {
    return (
      typeof latitude === 'number'