import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  allDay?: boolean;
}

interface CalendarConfig {
  enabled: boolean;
  defaultCalendarId?: string;
  syncInterval: number;
  lastSyncTimestamp?: number;
}

const CONFIG_KEY = '@calendar_config';
const SYNC_INTERVAL = 15 * 60 * 1000; // 15 минут

class CalendarService {
  private config: CalendarConfig = {
    enabled: false,
    syncInterval: SYNC_INTERVAL,
  };

  async initialize(): Promise<void> {
    const savedConfig = await AsyncStorage.getItem(CONFIG_KEY);
    if (savedConfig) {
      this.config = JSON.parse(savedConfig);
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Calendar.getCalendarPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Нет доступа к календарю',
          'Для синхронизации задач с календарём необходимо предоставить доступ в настройках приложения.'
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting calendar permissions:', error);
      return false;
    }
  }

  async getCalendars(): Promise<Calendar.Calendar[]> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return [];
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      return calendars;
    } catch (error) {
      console.error('Error fetching calendars:', error);
      return [];
    }
  }

  async getDefaultCalendar(): Promise<Calendar.Calendar | null> {
    try {
      const calendars = await this.getCalendars();
      
      if (this.config.defaultCalendarId) {
        const defaultCalendar = calendars.find(
          cal => cal.id === this.config.defaultCalendarId
        );
        if (defaultCalendar) {
          return defaultCalendar;
        }
      }

      // Ищем календарь Google
      const googleCalendar = calendars.find(
        cal => cal.source.type === 'com.google' || cal.source.name.toLowerCase().includes('google')
      );
      if (googleCalendar) {
        return googleCalendar;
      }

      // Ищем основной календарь
      const primaryCalendar = calendars.find(cal => cal.isPrimary);
      if (primaryCalendar) {
        return primaryCalendar;
      }

      // Ищем локальный календарь
      const localCalendar = calendars.find(cal => cal.allowsModifications);
      if (localCalendar) {
        return localCalendar;
      }

      return calendars.length > 0 ? calendars[0] : null;
    } catch (error) {
      console.error('Error getting default calendar:', error);
      return null;
    }
  }

  async setDefaultCalendar(calendarId: string): Promise<void> {
    this.config.defaultCalendarId = calendarId;
    await this.saveConfig();
  }

  async enableSync(enabled: boolean): Promise<void> {
    this.config.enabled = enabled;
    await this.saveConfig();
  }

  async isSyncEnabled(): Promise<boolean> {
    return this.config.enabled;
  }

  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission || !this.config.enabled) {
        return [];
      }

      const calendars = await this.getCalendars();
      if (calendars.length === 0) {
        return [];
      }

      const calendarIds = calendars.map(cal => cal.id);
      const events = await Calendar.getEventsAsync(
        calendarIds,
        startDate,
        endDate
      );

      return events.map(event => ({
        id: event.id,
        title: event.title,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        location: event.location,
        notes: event.notes,
        allDay: event.allDay,
      }));
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }

  async getTodayEvents(): Promise<CalendarEvent[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getEvents(today, tomorrow);
  }

  async getUpcomingEvents(days: number = 7): Promise<CalendarEvent[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.getEvents(startDate, endDate);
  }

  async createEvent(
    title: string,
    startDate: Date,
    endDate: Date,
    options?: {
      location?: string;
      notes?: string;
      alarms?: Calendar.Alarm[];
    }
  ): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const calendar = await this.getDefaultCalendar();
      if (!calendar || !calendar.allowsModifications) {
        Alert.alert(
          'Ошибка',
          'Выбранный календарь не поддерживает создание событий'
        );
        return null;
      }

      const eventDetails: Calendar.Event = {
        title,
        startDate,
        endDate,
        timeZone: 'GMT',
        location: options?.location,
        notes: options?.notes,
        alarms: options?.alarms || [
          {
            relativeOffset: -15,
            method: Calendar.AlarmMethod.ALERT,
          },
        ],
      };

      const eventId = await Calendar.createEventAsync(calendar.id, eventDetails);
      return eventId;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      Alert.alert('Ошибка', 'Не удалось создать событие в календаре');
      return null;
    }
  }

  async updateEvent(
    eventId: string,
    updates: {
      title?: string;
      startDate?: Date;
      endDate?: Date;
      location?: string;
      notes?: string;
    }
  ): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return false;
      }

      await Calendar.updateEventAsync(eventId, updates);
      return true;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return false;
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return false;
      }

      await Calendar.deleteEventAsync(eventId);
      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return false;
    }
  }

  async syncTaskToCalendar(
    taskId: number,
    title: string,
    scheduledTime: Date,
    duration: number
  ): Promise<string | null> {
    if (!this.config.enabled) {
      return null;
    }

    const endDate = new Date(scheduledTime.getTime() + duration * 60000);
    
    const eventId = await this.createEvent(
      title,
      scheduledTime,
      endDate,
      {
        notes: `MindFlow Task ID: ${taskId}`,
        alarms: [
          {
            relativeOffset: -15,
            method: Calendar.AlarmMethod.ALERT,
          },
        ],
      }
    );

    if (eventId) {
      await this.saveTaskEventMapping(taskId, eventId);
    }

    return eventId;
  }

  async updateTaskInCalendar(
    taskId: number,
    title: string,
    scheduledTime: Date,
    duration: number
  ): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    const eventId = await this.getEventIdForTask(taskId);
    if (!eventId) {
      return false;
    }

    const endDate = new Date(scheduledTime.getTime() + duration * 60000);

    return this.updateEvent(eventId, {
      title,
      startDate: scheduledTime,
      endDate,
    });
  }

  async deleteTaskFromCalendar(taskId: number): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    const eventId = await this.getEventIdForTask(taskId);
    if (!eventId) {
      return false;
    }

    const deleted = await this.deleteEvent(eventId);
    if (deleted) {
      await this.removeTaskEventMapping(taskId);
    }

    return deleted;
  }

  async findFreeSlots(
    date: Date,
    duration: number,
    workingHours: { start: number; end: number } = { start: 9, end: 18 }
  ): Promise<{ start: Date; end: Date }[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(workingHours.start, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(workingHours.end, 0, 0, 0);

    const events = await this.getEvents(startOfDay, endOfDay);
    
    const freeSlots: { start: Date; end: Date }[] = [];
    let currentTime = new Date(startOfDay);

    // Сортируем события по времени начала
    const sortedEvents = events.sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime()
    );

    for (const event of sortedEvents) {
      const eventStart = event.startDate;
      const slotDuration = (eventStart.getTime() - currentTime.getTime()) / 60000;

      if (slotDuration >= duration) {
        freeSlots.push({
          start: new Date(currentTime),
          end: new Date(currentTime.getTime() + duration * 60000),
        });
      }

      currentTime = new Date(Math.max(currentTime.getTime(), event.endDate.getTime()));
    }

    // Проверяем последний слот до конца рабочего дня
    const remainingDuration = (endOfDay.getTime() - currentTime.getTime()) / 60000;
    if (remainingDuration >= duration) {
      freeSlots.push({
        start: new Date(currentTime),
        end: new Date(currentTime.getTime() + duration * 60000),
      });
    }

    return freeSlots;
  }

  async checkForConflicts(
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    const events = await this.getEvents(startDate, endDate);
    
    return events.filter(event => {
      const eventStart = event.startDate.getTime();
      const eventEnd = event.endDate.getTime();
      const checkStart = startDate.getTime();
      const checkEnd = endDate.getTime();

      return (
        (eventStart >= checkStart && eventStart < checkEnd) ||
        (eventEnd > checkStart && eventEnd <= checkEnd) ||
        (eventStart <= checkStart && eventEnd >= checkEnd)
      );
    });
  }

  async shouldSync(): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    const now = Date.now();
    const lastSync = this.config.lastSyncTimestamp || 0;
    const timeSinceSync = now - lastSync;

    return timeSinceSync >= this.config.syncInterval;
  }

  async markSynced(): Promise<void> {
    this.config.lastSyncTimestamp = Date.now();
    await this.saveConfig();
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Error saving calendar config:', error);
    }
  }

  private async saveTaskEventMapping(taskId: number, eventId: string): Promise<void> {
    try {
      const mappings = await this.getTaskEventMappings();
      mappings[taskId] = eventId;
      await AsyncStorage.setItem('@task_event_mappings', JSON.stringify(mappings));
    } catch (error) {
      console.error('Error saving task-event mapping:', error);
    }
  }

  private async removeTaskEventMapping(taskId: number): Promise<void> {
    try {
      const mappings = await this.getTaskEventMappings();
      delete mappings[taskId];
      await AsyncStorage.setItem('@task_event_mappings', JSON.stringify(mappings));
    } catch (error) {
      console.error('Error removing task-event mapping:', error);
    }
  }

  private async getEventIdForTask(taskId: number): Promise<string | null> {
    try {
      const mappings = await this.getTaskEventMappings();
      return mappings[taskId] || null;
    } catch (error) {
      console.error('Error getting event ID for task:', error);
      return null;
    }
  }

  private async getTaskEventMappings(): Promise<Record<number, string>> {
    try {
      const data = await AsyncStorage.getItem('@task_event_mappings');
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting task-event mappings:', error);
      return {};
    }
  }
}

export default new CalendarService();