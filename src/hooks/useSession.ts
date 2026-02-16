import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useTimer } from './useTimer';
import { useDatabase } from './useDatabase';
import { NotificationService } from '../services/NotificationService';
import { SoundService } from '../services/SoundService';
import { AchievementService } from '../services/AchievementService';
import { StatisticsService } from '../services/StatisticsService';
import { Session } from '../models/Session';

export type SessionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'break';

interface UseSessionReturn {
  session: Session | null;
  status: SessionStatus;
  elapsedTime: number;
  pauseCount: number;
  startSession: (taskName?: string, duration?: number) => Promise<void>;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: () => Promise<void>;
  completeSession: () => Promise<void>;
  startBreak: (duration: number) => Promise<void>;
  completeBreak: () => Promise<void>;
  skipBreak: () => Promise<void>;
  isBreakActive: boolean;
  breakTimeRemaining: number;
}

export const useSession = (): UseSessionReturn => {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [pauseCount, setPauseCount] = useState(0);
  const [isBreakActive, setIsBreakActive] = useState(false);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(0);

  const { duration: timerDuration, start: startTimer, pause: pauseTimer, resume: resumeTimer, stop: stopTimer, isRunning } = useTimer();
  const { db } = useDatabase();
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const sessionStartTimeRef = useRef<number>(0);
  const breakStartTimeRef = useRef<number>(0);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [status, session, isBreakActive]);

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to foreground
      if (status === 'running' && sessionStartTimeRef.current) {
        const backgroundTime = Date.now() - sessionStartTimeRef.current;
        setElapsedTime(prev => Math.min(prev + backgroundTime, session?.duration || 0));
      }
      if (isBreakActive && breakStartTimeRef.current) {
        const backgroundTime = Date.now() - breakStartTimeRef.current;
        setBreakTimeRemaining(prev => Math.max(prev - backgroundTime, 0));
      }
    }
    appState.current = nextAppState;
  }, [status, session, isBreakActive]);

  const startSession = useCallback(
    async (taskName: string = 'Focus Session', duration: number = 25) => {
      try {
        if (!db) return;

        const newSession: Session = {
          id: undefined,
          taskName,
          duration: duration * 60, // Convert to seconds
          completed: false,
          pausedCount: 0,
          startedAt: new Date(),
          completedAt: null,
          createdAt: new Date(),
        };

        setSession(newSession);
        setStatus('running');
        setElapsedTime(0);
        setPauseCount(0);
        sessionStartTimeRef.current = Date.now();

        startTimer(duration * 60);

        // Insert session into database
        await db.execAsync(
          `INSERT INTO sessions (task_name, duration, started_at) 
           VALUES (?, ?, ?)`,
          [taskName, duration * 60, new Date().toISOString()]
        );

        await NotificationService.sendNotification(
          'Session Started',
          `Focus on "${taskName}" for ${duration} minutes`
        );
      } catch (error) {
        console.error('Error starting session:', error);
        setStatus('idle');
      }
    },
    [db, startTimer]
  );

  const pauseSession = useCallback(() => {
    if (status === 'running') {
      setStatus('paused');
      pauseTimer();
      setPauseCount(prev => prev + 1);
    }
  }, [status, pauseTimer]);

  const resumeSession = useCallback(() => {
    if (status === 'paused') {
      setStatus('running');
      resumeTimer();
      sessionStartTimeRef.current = Date.now() - elapsedTime * 1000;
    }
  }, [status, resumeTimer, elapsedTime]);

  const stopSession = useCallback(async () => {
    try {
      stopTimer();
      setStatus('idle');
      setSession(null);
      setElapsedTime(0);
      setPauseCount(0);

      await NotificationService.sendNotification(
        'Session Stopped',
        'Your focus session has been stopped'
      );
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  }, [stopTimer]);

  const completeSession = useCallback(
    async () => {
      try {
        if (!db || !session) return;

        stopTimer();
        setStatus('completed');

        const focusTime = session.duration;

        // Update session in database
        await db.execAsync(
          `UPDATE sessions SET completed = 1, completed_at = ?, paused_count = ? 
           WHERE id = (SELECT MAX(id) FROM sessions)`,
          [new Date().toISOString(), pauseCount]
        );

        // Update user statistics
        const stats = await StatisticsService.updateSessionStats(db, focusTime);

        // Check and unlock achievements
        const achievements = await AchievementService.checkAchievements(db, stats);

        // Play completion sound
        await SoundService.playSessionCompleteSound();

        // Send notification
        await NotificationService.sendNotification(
          'Session Complete! 🎉',
          `Great work! You focused for ${Math.floor(focusTime / 60)} minutes`
        );

        // Trigger break
        setTimeout(() => {
          startBreak(5);
        }, 2000);
      } catch (error) {
        console.error('Error completing session:', error);
      }
    },
    [db, session, pauseCount, stopTimer, startBreak]
  );

  const startBreak = useCallback(
    async (duration: number = 5) => {
      try {
        setIsBreakActive(true);
        setBreakTimeRemaining(duration * 60);
        setStatus('break');
        breakStartTimeRef.current = Date.now();

        startTimer(duration * 60);

        // Insert break into database
        if (db) {
          await db.execAsync(
            `INSERT INTO breaks (session_id, duration, started_at) 
             VALUES ((SELECT MAX(id) FROM sessions), ?, ?)`,
            [duration * 60, new Date().toISOString()]
          );
        }

        await NotificationService.sendNotification(
          'Break Time! ☕',
          `Take a ${duration} minute break. Stretch, hydrate, relax!`
        );
      } catch (error) {
        console.error('Error starting break:', error);
      }
    },
    [db, startTimer]
  );

  const completeBreak = useCallback(async () => {
    try {
      stopTimer();
      setIsBreakActive(false);
      setBreakTimeRemaining(0);
      setStatus('idle');

      if (db) {
        await db.execAsync(
          `UPDATE breaks SET completed_at = ? 
           WHERE id = (SELECT MAX(id) FROM breaks)`,
          [new Date().toISOString()]
        );
      }

      await SoundService.playBreakCompleteSound();
      await NotificationService.sendNotification(
        'Break Complete!',
        'Ready to start another session?'
      );
    } catch (error) {
      console.error('Error completing break:', error);
    }
  }, [db, stopTimer]);

  const skipBreak = useCallback(async () => {
    try {
      stopTimer();
      setIsBreakActive(false);
      setBreakTimeRemaining(0);
      setStatus('idle');

      if (db) {
        await db.execAsync(
          `UPDATE breaks SET skipped = 1, completed_at = ? 
           WHERE id = (SELECT MAX(id) FROM breaks)`,
          [new Date().toISOString()]
        );
      }

      await NotificationService.sendNotification(
        'Break Skipped',
        'You can start another session whenever you are ready'
      );
    } catch (error) {
      console.error('Error skipping break:', error);
    }
  }, [db, stopTimer]);

  // Update elapsed time when timer changes
  useEffect(() => {
    if (status === 'running' && session) {
      const remaining = Math.max(0, session.duration - (Date.now() - sessionStartTimeRef.current) / 1000);
      setElapsedTime(session.duration - remaining);

      if (remaining <= 0) {
        completeSession();
      }
    }
  }, [isRunning, status, session, completeSession]);

  // Update break time remaining
  useEffect(() => {
    if (isBreakActive) {
      const remaining = Math.max(0, timerDuration - (Date.now() - breakStartTimeRef.current) / 1000);
      setBreakTimeRemaining(remaining);

      if (remaining <= 0) {
        completeBreak();
      }
    }
  }, [isRunning, isBreakActive, timerDuration, completeBreak]);

  return {
    session,
    status,
    elapsedTime,
    pauseCount,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    completeSession,
    startBreak,
    completeBreak,
    skipBreak,
    isBreakActive,
    breakTimeRemaining,
  };
};