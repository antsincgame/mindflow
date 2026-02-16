import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { Session } from '../models/Session';
import { Achievement } from '../models/Achievement';
import { StorageService } from './StorageService';

interface ShareProgress {
  totalSessions: number;
  totalMinutes: number;
  streak: number;
  achievements: Achievement[];
  lastSession?: Session;
}

interface ShareOptions {
  includeStats?: boolean;
  includeAchievements?: boolean;
  includeStreak?: boolean;
  message?: string;
}

class SharingServiceClass {
  private storageService: StorageService;

  constructor() {
    this.storageService = new StorageService();
  }

  async shareProgress(options: ShareOptions = {}): Promise<void> {
    try {
      const progress = await this.getProgressData();
      const message = this.generateShareMessage(progress, options);
      
      if (await Sharing.isAvailableAsync()) {
        const fileUri = await this.createShareableFile(message);
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Поделиться прогрессом',
          UTI: 'public.plain-text'
        });
        
        // Очистка временного файла
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing progress:', error);
      throw error;
    }
  }

  async shareSession(session: Session): Promise<void> {
    try {
      const message = this.generateSessionMessage(session);
      
      if (await Sharing.isAvailableAsync()) {
        const fileUri = await this.createShareableFile(message);
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Поделиться сессией',
          UTI: 'public.plain-text'
        });
        
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing session:', error);
      throw error;
    }
  }

  async shareAchievement(achievement: Achievement): Promise<void> {
    try {
      const message = this.generateAchievementMessage(achievement);
      
      if (await Sharing.isAvailableAsync()) {
        const fileUri = await this.createShareableFile(message);
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Поделиться достижением',
          UTI: 'public.plain-text'
        });
        
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing achievement:', error);
      throw error;
    }
  }

  async shareStreak(streakDays: number): Promise<void> {
    try {
      const message = this.generateStreakMessage(streakDays);
      
      if (await Sharing.isAvailableAsync()) {
        const fileUri = await this.createShareableFile(message);
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Поделиться серией',
          UTI: 'public.plain-text'
        });
        
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing streak:', error);
      throw error;
    }
  }

  generateDeepLink(type: 'session' | 'achievement' | 'progress', id?: string): string {
    const baseUrl = 'breathwork://';
    
    switch (type) {
      case 'session':
        return `${baseUrl}session/${id}`;
      case 'achievement':
        return `${baseUrl}achievement/${id}`;
      case 'progress':
        return `${baseUrl}progress`;
      default:
        return baseUrl;
    }
  }

  private async getProgressData(): Promise<ShareProgress> {
    const sessions = await this.storageService.getSessions();
    const achievements = await this.storageService.getAchievements();
    const streak = await this.calculateStreak(sessions);
    
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration, 0);
    const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : undefined;
    
    return {
      totalSessions,
      totalMinutes,
      streak,
      achievements: achievements.filter(a => a.unlocked),
      lastSession
    };
  }

  private generateShareMessage(progress: ShareProgress, options: ShareOptions): string {
    let message = options.message || '🧘‍♀️ Мой прогресс в дыхательных практиках\n\n';
    
    if (options.includeStats !== false) {
      message += `📊 Статистика:\n`;
      message += `• Всего сессий: ${progress.totalSessions}\n`;
      message += `• Общее время: ${this.formatMinutes(progress.totalMinutes)}\n`;
    }
    
    if (options.includeStreak !== false && progress.streak > 0) {
      message += `\n🔥 Серия: ${progress.streak} ${this.getDaysWord(progress.streak)}\n`;
    }
    
    if (options.includeAchievements !== false && progress.achievements.length > 0) {
      message += `\n🏆 Достижения: ${progress.achievements.length}\n`;
      const topAchievements = progress.achievements.slice(0, 3);
      topAchievements.forEach(achievement => {
        message += `• ${achievement.icon} ${achievement.title}\n`;
      });
    }
    
    if (progress.lastSession) {
      message += `\n✨ Последняя практика: ${this.formatDate(progress.lastSession.date)}\n`;
      message += `Упражнение: ${progress.lastSession.exerciseName}\n`;
      message += `Длительность: ${this.formatMinutes(progress.lastSession.duration)}\n`;
    }
    
    message += '\n#дыхательныепрактики #медитация #здоровье';
    
    return message;
  }

  private generateSessionMessage(session: Session): string {
    let message = '🧘‍♀️ Завершил дыхательную практику!\n\n';
    message += `📝 ${session.exerciseName}\n`;
    message += `⏱ Длительность: ${this.formatMinutes(session.duration)}\n`;
    message += `📅 ${this.formatDate(session.date)}\n`;
    
    if (session.emotion) {
      message += `😌 Эмоция: ${session.emotion}\n`;
    }
    
    if (session.heartRateAverage) {
      message += `💓 Средний пульс: ${Math.round(session.heartRateAverage)} уд/мин\n`;
    }
    
    if (session.stressLevelBefore !== undefined && session.stressLevelAfter !== undefined) {
      const reduction = session.stressLevelBefore - session.stressLevelAfter;
      message += `📉 Снижение стресса: ${Math.round(reduction)}%\n`;
    }
    
    if (session.notes) {
      message += `\n💭 "${session.notes}"\n`;
    }
    
    message += '\n#дыхательныепрактики #медитация #здоровье';
    
    return message;
  }

  private generateAchievementMessage(achievement: Achievement): string {
    let message = '🎉 Новое достижение разблокировано!\n\n';
    message += `${achievement.icon} ${achievement.title}\n`;
    message += `${achievement.description}\n\n`;
    
    if (achievement.category) {
      message += `Категория: ${this.getCategoryName(achievement.category)}\n`;
    }
    
    if (achievement.unlockedAt) {
      message += `Получено: ${this.formatDate(achievement.unlockedAt)}\n`;
    }
    
    message += '\n#дыхательныепрактики #достижения #прогресс';
    
    return message;
  }

  private generateStreakMessage(streakDays: number): string {
    let message = '🔥 Моя серия практик!\n\n';
    message += `${streakDays} ${this.getDaysWord(streakDays)} подряд\n`;
    message += 'занимаюсь дыхательными практиками 🧘‍♀️\n\n';
    
    if (streakDays >= 7) {
      message += '💪 Продолжаю развивать здоровые привычки!\n';
    }
    
    if (streakDays >= 30) {
      message += '🌟 Это уже целый месяц практики!\n';
    }
    
    if (streakDays >= 100) {
      message += '🏆 100 дней - это невероятное достижение!\n';
    }
    
    message += '\n#дыхательныепрактики #мотивация #привычки';
    
    return message;
  }

  private async createShareableFile(content: string): Promise<string> {
    const fileName = `breathwork_share_${Date.now()}.txt`;
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
    
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    return fileUri;
  }

  private async calculateStreak(sessions: Session[]): Promise<number> {
    if (sessions.length === 0) return 0;
    
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const session of sortedSessions) {
      const sessionDate = new Date(session.date);
      sessionDate.setHours(0, 0, 0, 0);
      
      const diffTime = currentDate.getTime() - sessionDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
      } else if (diffDays > streak) {
        break;
      }
    }
    
    return streak;
  }

  private formatMinutes(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} мин`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} ч`;
    }
    
    return `${hours} ч ${remainingMinutes} мин`;
  }

  private formatDate(date: Date): string {
    const now = new Date();
    const sessionDate = new Date(date);
    
    const diffTime = now.getTime() - sessionDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Сегодня';
    } else if (diffDays === 1) {
      return 'Вчера';
    } else if (diffDays < 7) {
      return `${diffDays} дней назад`;
    }
    
    return sessionDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  private getDaysWord(days: number): string {
    const lastDigit = days % 10;
    const lastTwoDigits = days % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return 'дней';
    }
    
    if (lastDigit === 1) {
      return 'день';
    }
    
    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'дня';
    }
    
    return 'дней';
  }

  private getCategoryName(category: string): string {
    const categories: Record<string, string> = {
      'streak': 'Серия',
      'sessions': 'Сессии',
      'time': 'Время',
      'consistency': 'Постоянство',
      'variety': 'Разнообразие',
      'special': 'Особые'
    };
    
    return categories[category] || category;
  }

  async canShare(): Promise<boolean> {
    return await Sharing.isAvailableAsync();
  }

  async shareWithOptions(
    content: string,
    options: {
      dialogTitle?: string;
      mimeType?: string;
      UTI?: string;
    } = {}
  ): Promise<void> {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Sharing is not available on this device');
      }
      
      const fileUri = await this.createShareableFile(content);
      
      await Sharing.shareAsync(fileUri, {
        mimeType: options.mimeType || 'text/plain',
        dialogTitle: options.dialogTitle || 'Поделиться',
        UTI: options.UTI || 'public.plain-text'
      });
      
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (error) {
      console.error('Error sharing with options:', error);
      throw error;
    }
  }

  async generateShareableImage(data: ShareProgress): Promise<string | null> {
    // Placeholder for future image generation functionality
    // Could use react-native-view-shot or similar library
    console.log('Image generation not yet implemented');
    return null;
  }

  async shareToSocialMedia(
    platform: 'facebook' | 'twitter' | 'instagram',
    content: string
  ): Promise<void> {
    // Placeholder for platform-specific sharing
    // Would require platform-specific SDKs
    console.log(`Sharing to ${platform} not yet implemented`);
    throw new Error('Platform-specific sharing not yet implemented');
  }
}

export const SharingService = new SharingServiceClass();