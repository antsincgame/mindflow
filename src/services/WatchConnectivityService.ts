import {
  sendMessage,
  watchEvents,
  getReachability,
  getIsWatchAppInstalled,
  sendMessageData,
  transferUserInfo,
  transferCurrentComplicationUserInfo,
  getApplicationContext,
  updateApplicationContext,
} from 'react-native-watch-connectivity';
import { Session } from '../models/Session';
import { Achievement } from '../models/Achievement';
import { HealthData } from '../models/HealthData';

export interface WatchMessage {
  type: WatchMessageType;
  payload: Record<string, unknown>;
  timestamp: number;
}

export enum WatchMessageType {
  START_EXERCISE = 'START_EXERCISE',
  PAUSE_EXERCISE = 'PAUSE_EXERCISE',
  RESUME_EXERCISE = 'RESUME_EXERCISE',
  STOP_EXERCISE = 'STOP_EXERCISE',
  SESSION_COMPLETE = 'SESSION_COMPLETE',
  SYNC_SESSIONS = 'SYNC_SESSIONS',
  SYNC_ACHIEVEMENTS = 'SYNC_ACHIEVEMENTS',
  SYNC_PROGRESS = 'SYNC_PROGRESS',
  HEALTH_DATA_UPDATE = 'HEALTH_DATA_UPDATE',
  STRESS_LEVEL_UPDATE = 'STRESS_LEVEL_UPDATE',
  NOTIFICATION = 'NOTIFICATION',
  BREATHING_PHASE_CHANGE = 'BREATHING_PHASE_CHANGE',
  REQUEST_SYNC = 'REQUEST_SYNC',
  SETTINGS_UPDATE = 'SETTINGS_UPDATE',
  HEARTBEAT = 'HEARTBEAT',
}

export interface WatchExercisePayload {
  exerciseId: string;
  exerciseName: string;
  exerciseType: string;
  duration: number;
  breathingPattern?: {
    inhale: number;
    hold: number;
    exhale: number;
    holdAfterExhale: number;
  };
}

export interface WatchProgressPayload {
  totalSessions: number;
  currentStreak: number;
  averageStressLevel: number;
  lastSessionDate: string | null;
  level: number;
  achievementsUnlocked: number;
  totalAchievements: number;
}

export interface WatchSessionPayload {
  sessions: Session[];
  lastSyncTimestamp: number;
}

export interface WatchAchievementPayload {
  achievements: Achievement[];
}

export interface WatchStressPayload {
  stressLevel: number;
  heartRate: number | null;
  hrv: number | null;
  timestamp: number;
}

export type WatchMessageHandler = (message: WatchMessage) => void;

class WatchConnectivityService {
  private static instance: WatchConnectivityService;
  private isReachable: boolean = false;
  private isInstalled: boolean = false;
  private messageHandlers: Map<WatchMessageType, Set<WatchMessageHandler>> = new Map();
  private unsubscribers: Array<() => void> = [];
  private pendingMessages: WatchMessage[] = [];
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): WatchConnectivityService {
    if (!WatchConnectivityService.instance) {
      WatchConnectivityService.instance = new WatchConnectivityService();
    }
    return WatchConnectivityService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.isInstalled = await getIsWatchAppInstalled();
      this.isReachable = await getReachability();

      this.setupEventListeners();
      this.isInitialized = true;

      if (this.isReachable) {
        await this.flushPendingMessages();
      }
    } catch (error) {
      console.warn('[WatchConnectivity] Initialization failed:', error);
    }
  }

  private setupEventListeners(): void {
    const reachabilityUnsub = watchEvents.on('reachability', (reachable: boolean) => {
      this.isReachable = reachable;
      if (reachable) {
        this.flushPendingMessages();
      }
    });

    const messageUnsub = watchEvents.on('message', (message: Record<string, unknown>) => {
      this.handleIncomingMessage(message);
    });

    const userInfoUnsub = watchEvents.on('user-info', (userInfo: Record<string, unknown>) => {
      this.handleIncomingUserInfo(userInfo);
    });

    const applicationContextUnsub = watchEvents.on(
      'application-context',
      (context: Record<string, unknown>) => {
        this.handleApplicationContextUpdate(context);
      }
    );

    const installedUnsub = watchEvents.on('installed', (installed: boolean) => {
      this.isInstalled = installed;
    });

    this.unsubscribers.push(
      reachabilityUnsub as unknown as () => void,
      messageUnsub as unknown as () => void,
      userInfoUnsub as unknown as () => void,
      applicationContextUnsub as unknown as () => void,
      installedUnsub as unknown as () => void
    );
  }

  private handleIncomingMessage(rawMessage: Record<string, unknown>): void {
    try {
      const message = this.parseWatchMessage(rawMessage);
      if (!message) return;

      const handlers = this.messageHandlers.get(message.type);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(message);
          } catch (error) {
            console.error('[WatchConnectivity] Handler error:', error);
          }
        });
      }
    } catch (error) {
      console.error('[WatchConnectivity] Error handling incoming message:', error);
    }
  }

  private handleIncomingUserInfo(userInfo: Record<string, unknown>): void {
    try {
      const message = this.parseWatchMessage(userInfo);
      if (message) {
        this.handleIncomingMessage(userInfo);
      }
    } catch (error) {
      console.error('[WatchConnectivity] Error handling user info:', error);
    }
  }

  private handleApplicationContextUpdate(context: Record<string, unknown>): void {
    try {
      const message = this.parseWatchMessage(context);
      if (message) {
        this.handleIncomingMessage(context);
      }
    } catch (error) {
      console.error('[WatchConnectivity] Error handling application context:', error);
    }
  }

  private parseWatchMessage(raw: Record<string, unknown>): WatchMessage | null {
    if (!raw || typeof raw.type !== 'string') {
      return null;
    }

    const type = raw.type as WatchMessageType;
    if (!Object.values(WatchMessageType).includes(type)) {
      console.warn('[WatchConnectivity] Unknown message type:', raw.type);
      return null;
    }

    return {
      type,
      payload: (raw.payload as Record<string, unknown>) || {},
      timestamp: (raw.timestamp as number) || Date.now(),
    };
  }

  onMessage(type: WatchMessageType, handler: WatchMessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }

    const handlers = this.messageHandlers.get(type)!;
    handlers.add(handler);

    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.messageHandlers.delete(type);
      }
    };
  }

  private async sendWatchMessage(message: WatchMessage): Promise<boolean> {
    if (!this.isInstalled) {
      return false;
    }

    if (!this.isReachable) {
      this.pendingMessages.push(message);
      return false;
    }

    try {
      await sendMessage(
        {
          type: message.type,
          payload: message.payload,
          timestamp: message.timestamp,
        } as Record<string, unknown>,
        (reply: Record<string, unknown>) => {
          // Handle reply if needed
        },
        (error: Error) => {
          console.warn('[WatchConnectivity] Send message error:', error);
          this.pendingMessages.push(message);
        }
      );
      return true;
    } catch (error) {
      console.warn('[WatchConnectivity] Failed to send message:', error);
      this.pendingMessages.push(message);
      return false;
    }
  }

  private async transferInfo(data: Record<string, unknown>): Promise<boolean> {
    if (!this.isInstalled) {
      return false;
    }

    try {
      await transferUserInfo(data);
      return true;
    } catch (error) {
      console.error('[WatchConnectivity] Failed to transfer user info:', error);
      return false;
    }
  }

  private async updateContext(context: Record<string, unknown>): Promise<boolean> {
    if (!this.isInstalled) {
      return false;
    }

    try {
      await updateApplicationContext(context);
      return true;
    } catch (error) {
      console.error('[WatchConnectivity] Failed to update application context:', error);
      return false;
    }
  }

  private async flushPendingMessages(): Promise<void> {
    const messages = [...this.pendingMessages];
    this.pendingMessages = [];

    for (const message of messages) {
      const sent = await this.sendWatchMessage(message);
      if (!sent && !this.pendingMessages.includes(message)) {
        // Message was re-added by sendWatchMessage on failure
      }
    }
  }

  // ---- Public API: Exercise Control ----

  async sendStartExercise(exercise: WatchExercisePayload): Promise<boolean> {
    return this.sendWatchMessage({
      type: WatchMessageType.START_EXERCISE,
      payload: exercise as unknown as Record<string, unknown>,
      timestamp: Date.now(),
    });
  }

  async sendPauseExercise(exerciseId: string): Promise<boolean> {
    return this.sendWatchMessage({
      type: WatchMessageType.PAUSE_EXERCISE,
      payload: { exerciseId },
      timestamp: Date.now(),
    });
  }

  async sendResumeExercise(exerciseId: string): Promise<boolean> {
    return this.sendWatchMessage({
      type: WatchMessageType.RESUME_EXERCISE,
      payload: { exerciseId },
      timestamp: Date.now(),
    });
  }

  async sendStopExercise(exerciseId: string): Promise<boolean> {
    return this.sendWatchMessage({
      type: WatchMessageType.STOP_EXERCISE,
      payload: { exerciseId },
      timestamp: Date.now(),
    });
  }

  async sendBreathingPhaseChange(
    phase: 'inhale' | 'hold' | 'exhale' | 'holdAfterExhale',
    duration: number
  ): Promise<boolean> {
    return this.sendWatchMessage({
      type: WatchMessageType.BREATHING_PHASE_CHANGE,
      payload: { phase, duration },
      timestamp: Date.now(),
    });
  }

  // ---- Public API: Session Sync ----

  async syncSessions(sessions: Session[]): Promise<boolean> {
    const payload: WatchSessionPayload = {
      sessions,
      lastSyncTimestamp: Date.now(),
    };

    return this.transferInfo({
      type: WatchMessageType.SYNC_SESSIONS,
      payload: payload as unknown as Record<string, unknown>,
      timestamp: Date.now(),
    });
  }

  async sendSessionComplete(session: Session): Promise<boolean> {
    return this.sendWatchMessage({
      type: WatchMessageType.SESSION_COMPLETE,
      payload: session as unknown as Record<string, unknown>,
      timestamp: Date.now(),
    });
  }

  // ---- Public API: Progress & Achievements ----

  async syncProgress(progress: WatchProgressPayload): Promise<boolean> {
    return this.updateContext({
      type: WatchMessageType.SYNC_PROGRESS,
      payload: progress as unknown as Record<string, unknown>,
      timestamp: Date.now(),
    });
  }

  async syncAchievements(achievements: Achievement[]): Promise<boolean> {
    const payload: WatchAchievementPayload = { achievements };

    return this.transferInfo({
      type: WatchMessageType.SYNC_ACHIEVEMENTS,
      payload: payload as unknown as Record<string, unknown>,
      timestamp: Date.now(),
    });
  }

  // ---- Public API: Health & Stress Data ----

  async sendHealthDataUpdate(healthData: Partial<HealthData>): Promise<boolean> {
    return this.sendWatchMessage({
      type: WatchMessageType.HEALTH_DATA_UPDATE,
      payload: healthData as unknown as Record<string, unknown>,
      timestamp: Date.now(),
    });
  }

  async sendStressLevelUpdate(stressData: WatchStressPayload): Promise<boolean> {
    return this.sendWatchMessage({
      type: WatchMessageType.STRESS_LEVEL_UPDATE,
      payload: stressData as unknown as Record<string, unknown>,
      timestamp: Date.now(),
    });
  }

  // ---- Public API: Notifications ----

  async sendNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<boolean> {
    return this.sendWatchMessage({
      type: WatchMessageType.NOTIFICATION,
      payload: {
        title,
        body,
        data: data || {},
      },
      timestamp: Date.now(),
    });
  }

  // ---- Public API: Settings ----

  async sendSettingsUpdate(settings: Record<string, unknown>): Promise<boolean> {
    return this.updateContext({
      type: WatchMessageType.SETTINGS_UPDATE,
      payload: settings,
      timestamp: Date.now(),
    });
  }

  // ---- Public API: Complication ----

  async updateComplication(data: Record<string, unknown>): Promise<boolean> {
    if (!this.isInstalled) {
      return false;
    }

    try {
      await transferCurrentComplicationUserInfo(data);
      return true;
    } catch (error) {
      console.error('[WatchConnectivity] Failed to update complication:', error);
      return false;
    }
  }

  async updateComplicationWithProgress(progress: WatchProgressPayload): Promise<boolean> {
    return this.updateComplication({
      currentStreak: progress.currentStreak,
      totalSessions: progress.totalSessions,
      averageStressLevel: progress.averageStressLevel,
      level: progress.level,
      lastUpdate: Date.now(),
    });
  }

  // ---- Public API: Status ----

  getIsReachable(): boolean {
    return this.isReachable;
  }

  getIsInstalled(): boolean {
    return this.isInstalled;
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  getPendingMessageCount(): number {
    return this.pendingMessages.length;
  }

  async refreshStatus(): Promise<{ isReachable: boolean; isInstalled: boolean }> {
    try {
      this.isReachable = await getReachability();
      this.isInstalled = await getIsWatchAppInstalled();
    } catch (error) {
      console.warn('[WatchConnectivity] Failed to refresh status:', error);
    }

    return {
      isReachable: this.isReachable,
      isInstalled: this.isInstalled,
    };
  }

  async getWatchApplicationContext(): Promise<Record<string, unknown> | null> {
    try {
      const context = await getApplicationContext();
      return context as Record<string, unknown>;
    } catch (error) {