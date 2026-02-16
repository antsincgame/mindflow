import React, { createContext, useContext, useState, useCallback } from 'react';
import { Session } from '../models/Session';

interface SessionContextType {
  currentSession: Session | null;
  isSessionActive: boolean;
  isPaused: boolean;
  startSession: (taskName: string, duration: number) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: () => void;
  completeSession: () => void;
  setCurrentSession: (session: Session | null) => void;
  getElapsedTime: () => number;
  getRemainingTime: () => number;
  pauseCount: number;
  incrementPauseCount: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseCount, setPauseCount] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [pausedTime, setPausedTime] = useState<number>(0);

  const startSession = useCallback((taskName: string, duration: number) => {
    const now = new Date().toISOString();
    const newSession: Session = {
      id: Date.now().toString(),
      taskName,
      duration,
      completed: false,
      pausedCount: 0,
      startedAt: now,
      completedAt: null,
      createdAt: now,
    };

    setCurrentSession(newSession);
    setIsSessionActive(true);
    setIsPaused(false);
    setSessionStartTime(Date.now());
    setPausedTime(0);
    setPauseCount(0);
  }, []);

  const pauseSession = useCallback(() => {
    if (isSessionActive && !isPaused) {
      setIsPaused(true);
      setPausedTime(Date.now());
    }
  }, [isSessionActive, isPaused]);

  const resumeSession = useCallback(() => {
    if (isSessionActive && isPaused) {
      setIsPaused(false);
      if (pausedTime && sessionStartTime) {
        const pauseDuration = Date.now() - pausedTime;
        setSessionStartTime(sessionStartTime + pauseDuration);
      }
    }
  }, [isSessionActive, isPaused, pausedTime, sessionStartTime]);

  const stopSession = useCallback(() => {
    setCurrentSession(null);
    setIsSessionActive(false);
    setIsPaused(false);
    setSessionStartTime(null);
    setPausedTime(0);
    setPauseCount(0);
  }, []);

  const completeSession = useCallback(() => {
    if (currentSession) {
      const completedSession: Session = {
        ...currentSession,
        completed: true,
        completedAt: new Date().toISOString(),
        pausedCount: pauseCount,
      };
      setCurrentSession(completedSession);
      setIsSessionActive(false);
      setIsPaused(false);
    }
  }, [currentSession, pauseCount]);

  const getElapsedTime = useCallback((): number => {
    if (!sessionStartTime) return 0;

    const now = Date.now();
    let elapsed = now - sessionStartTime;

    if (isPaused && pausedTime) {
      elapsed -= now - pausedTime;
    }

    return Math.floor(elapsed / 1000);
  }, [sessionStartTime, isPaused, pausedTime]);

  const getRemainingTime = useCallback((): number => {
    if (!currentSession) return 0;

    const elapsedSeconds = getElapsedTime();
    const remainingSeconds = currentSession.duration * 60 - elapsedSeconds;

    return Math.max(0, remainingSeconds);
  }, [currentSession, getElapsedTime]);

  const incrementPauseCount = useCallback(() => {
    setPauseCount((prev) => prev + 1);
  }, []);

  const value: SessionContextType = {
    currentSession,
    isSessionActive,
    isPaused,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    completeSession,
    setCurrentSession,
    getElapsedTime,
    getRemainingTime,
    pauseCount,
    incrementPauseCount,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSessionContext = (): SessionContextType => {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }

  return context;
};