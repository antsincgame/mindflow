import { Task } from '../models/Task';
import { EnergyPattern } from '../models/EnergyPattern';

interface TimeSlot {
  startTime: Date;
  endTime: Date;
  energy: number;
  score: number;
}

interface SchedulingOptions {
  preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  minEnergy?: number;
  maxEnergy?: number;
  allowWeekends?: boolean;
  bufferMinutes?: number;
}

const DEFAULT_OPTIONS: SchedulingOptions = {
  minEnergy: 40,
  maxEnergy: 100,
  allowWeekends: true,
  bufferMinutes: 15,
};

const TIME_OF_DAY_RANGES = {
  morning: { start: 6, end: 12 },
  afternoon: { start: 12, end: 17 },
  evening: { start: 17, end: 22 },
  night: { start: 22, end: 6 },
};

export class TaskScheduler {
  /**
   * Находит оптимальные временные слоты для задачи
   */
  static findOptimalTimeSlots(
    task: Task,
    existingTasks: Task[],
    energyPatterns: EnergyPattern[],
    options: SchedulingOptions = {}
  ): TimeSlot[] {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const duration = task.duration || 60;
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 14); // Ищем слоты на 2 недели вперёд

    const allSlots = this.generateTimeSlots(
      startDate,
      endDate,
      duration,
      opts.bufferMinutes!
    );

    const availableSlots = this.filterAvailableSlots(
      allSlots,
      existingTasks,
      opts.bufferMinutes!
    );

    const scoredSlots = this.scoreTimeSlots(
      availableSlots,
      energyPatterns,
      task,
      opts
    );

    return scoredSlots
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  /**
   * Генерирует все возможные временные слоты
   */
  private static generateTimeSlots(
    startDate: Date,
    endDate: Date,
    durationMinutes: number,
    bufferMinutes: number
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const currentDate = new Date(startDate);
    const slotInterval = 30; // Генерируем слоты каждые 30 минут

    while (currentDate < endDate) {
      const dayOfWeek = currentDate.getDay();
      
      // Пропускаем ночные часы (0-6)
      if (currentDate.getHours() >= 6 && currentDate.getHours() < 23) {
        const slotStart = new Date(currentDate);
        const slotEnd = new Date(currentDate);
        slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

        // Проверяем, что слот не выходит за пределы рабочего дня
        if (slotEnd.getHours() < 23) {
          slots.push({
            startTime: slotStart,
            endTime: slotEnd,
            energy: 0,
            score: 0,
          });
        }
      }

      currentDate.setMinutes(currentDate.getMinutes() + slotInterval);
      
      // Переход на следующий день
      if (currentDate.getHours() >= 23) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(6, 0, 0, 0);
      }
    }

    return slots;
  }

  /**
   * Фильтрует слоты, которые не пересекаются с существующими задачами
   */
  private static filterAvailableSlots(
    slots: TimeSlot[],
    existingTasks: Task[],
    bufferMinutes: number
  ): TimeSlot[] {
    return slots.filter(slot => {
      return !existingTasks.some(task => {
        if (!task.scheduledTime || task.completed) return false;

        const taskStart = new Date(task.scheduledTime);
        const taskEnd = new Date(taskStart);
        taskEnd.setMinutes(taskEnd.getMinutes() + (task.duration || 60));

        // Добавляем буфер
        const slotStartWithBuffer = new Date(slot.startTime);
        slotStartWithBuffer.setMinutes(
          slotStartWithBuffer.getMinutes() - bufferMinutes
        );
        const slotEndWithBuffer = new Date(slot.endTime);
        slotEndWithBuffer.setMinutes(
          slotEndWithBuffer.getMinutes() + bufferMinutes
        );

        // Проверка пересечения
        return (
          (slotStartWithBuffer >= taskStart && slotStartWithBuffer < taskEnd) ||
          (slotEndWithBuffer > taskStart && slotEndWithBuffer <= taskEnd) ||
          (slotStartWithBuffer <= taskStart && slotEndWithBuffer >= taskEnd)
        );
      });
    });
  }

  /**
   * Оценивает временные слоты на основе энергии и предпочтений
   */
  private static scoreTimeSlots(
    slots: TimeSlot[],
    energyPatterns: EnergyPattern[],
    task: Task,
    options: SchedulingOptions
  ): TimeSlot[] {
    return slots.map(slot => {
      const dayOfWeek = slot.startTime.getDay();
      const hourOfDay = slot.startTime.getHours();

      // Получаем среднюю энергию для этого времени
      const pattern = energyPatterns.find(
        p => p.dayOfWeek === dayOfWeek && p.hourOfDay === hourOfDay
      );
      const energy = pattern?.averageEnergy || 50;

      let score = 0;

      // 1. Оценка на основе энергии (40% веса)
      const energyScore = this.calculateEnergyScore(
        energy,
        task.priority,
        options.minEnergy!,
        options.maxEnergy!
      );
      score += energyScore * 0.4;

      // 2. Оценка на основе времени суток (30% веса)
      const timeOfDayScore = this.calculateTimeOfDayScore(
        hourOfDay,
        options.preferredTimeOfDay
      );
      score += timeOfDayScore * 0.3;

      // 3. Оценка близости к текущему времени (20% веса)
      const proximityScore = this.calculateProximityScore(
        slot.startTime,
        new Date()
      );
      score += proximityScore * 0.2;

      // 4. Оценка дня недели (10% веса)
      const dayScore = this.calculateDayScore(dayOfWeek, options.allowWeekends!);
      score += dayScore * 0.1;

      return {
        ...slot,
        energy,
        score: Math.round(score * 100) / 100,
      };
    });
  }

  /**
   * Оценка на основе уровня энергии
   */
  private static calculateEnergyScore(
    energy: number,
    priority?: string,
    minEnergy?: number,
    maxEnergy?: number
  ): number {
    // Высокоприоритетные задачи требуют высокой энергии
    const requiredEnergy = priority === 'high' ? 70 : priority === 'medium' ? 50 : 30;

    if (energy < (minEnergy || 0)) return 0;
    if (energy > (maxEnergy || 100)) return 0;

    // Чем ближе энергия к требуемой, тем выше оценка
    const diff = Math.abs(energy - requiredEnergy);
    return Math.max(0, 100 - diff) / 100;
  }

  /**
   * Оценка на основе времени суток
   */
  private static calculateTimeOfDayScore(
    hour: number,
    preferredTimeOfDay?: string
  ): number {
    if (!preferredTimeOfDay) return 0.5;

    const range = TIME_OF_DAY_RANGES[preferredTimeOfDay as keyof typeof TIME_OF_DAY_RANGES];
    if (!range) return 0.5;

    const { start, end } = range;

    if (start < end) {
      return hour >= start && hour < end ? 1 : 0;
    } else {
      // Для ночного времени (22-6)
      return hour >= start || hour < end ? 1 : 0;
    }
  }

  /**
   * Оценка близости к текущему времени
   */
  private static calculateProximityScore(slotTime: Date, now: Date): number {
    const hoursDiff = (slotTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Предпочитаем слоты в ближайшие 24-48 часов
    if (hoursDiff < 0) return 0; // Прошедшие слоты
    if (hoursDiff < 24) return 1;
    if (hoursDiff < 48) return 0.8;
    if (hoursDiff < 72) return 0.6;
    if (hoursDiff < 168) return 0.4; // Неделя
    return 0.2;
  }

  /**
   * Оценка дня недели
   */
  private static calculateDayScore(dayOfWeek: number, allowWeekends: boolean): number {
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend && !allowWeekends) return 0;
    if (isWeekend) return 0.7; // Выходные менее предпочтительны

    // Середина недели (вторник-четверг) более предпочтительна
    if (dayOfWeek >= 2 && dayOfWeek <= 4) return 1;
    return 0.9;
  }

  /**
   * Автоматически назначает время для задачи
   */
  static autoScheduleTask(
    task: Task,
    existingTasks: Task[],
    energyPatterns: EnergyPattern[],
    options: SchedulingOptions = {}
  ): Task | null {
    const slots = this.findOptimalTimeSlots(task, existingTasks, energyPatterns, options);

    if (slots.length === 0) return null;

    const bestSlot = slots[0];
    return {
      ...task,
      scheduledTime: bestSlot.startTime.getTime(),
    };
  }

  /**
   * Перепланирует задачу при изменении условий
   */
  static rescheduleTask(
    task: Task,
    existingTasks: Task[],
    energyPatterns: EnergyPattern[],
    reason: 'energy_drop' | 'conflict' | 'user_request'
  ): Task | null {
    const options: SchedulingOptions = {
      ...DEFAULT_OPTIONS,
      minEnergy: reason === 'energy_drop' ? 60 : 40,
    };

    return this.autoScheduleTask(task, existingTasks, energyPatterns, options);
  }

  /**
   * Проверяет, нужно ли перепланировать задачу
   */
  static shouldReschedule(
    task: Task,
    currentEnergy: number,
    existingTasks: Task[]
  ): boolean {
    if (!task.scheduledTime || task.completed) return false;

    const taskTime = new Date(task.scheduledTime);
    const now = new Date();

    // Задача в прошлом
    if (taskTime < now) return true;

    // Низкая энергия для высокоприоритетной задачи
    if (task.priority === 'high' && currentEnergy < 50) return true;

    // Конфликт с другими задачами
    const hasConflict = existingTasks.some(existingTask => {
      if (existingTask.id === task.id || !existingTask.scheduledTime) return false;

      const existingStart = new Date(existingTask.scheduledTime);
      const existingEnd = new Date(existingStart);
      existingEnd.setMinutes(existingEnd.getMinutes() + (existingTask.duration || 60));

      const taskEnd = new Date(taskTime);
      taskEnd.setMinutes(taskEnd.getMinutes() + (task.duration || 60));

      return (
        (taskTime >= existingStart && taskTime < existingEnd) ||
        (taskEnd > existingStart && taskEnd <= existingEnd) ||
        (taskTime <= existingStart && taskEnd >= existingEnd)
      );
    });

    return hasConflict;
  }

  /**
   * Находит следующий доступный слот после указанного времени
   */
  static findNextAvailableSlot(
    afterTime: Date,
    durationMinutes: number,
    existingTasks: Task[],
    energyPatterns: EnergyPattern[]
  ): TimeSlot | null {
    const startDate = new Date(afterTime);
    startDate.setMinutes(Math.ceil(startDate.getMinutes() / 30) * 30); // Округляем до 30 минут

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const slots = this.generateTimeSlots(startDate, endDate, durationMinutes, 15);
    const availableSlots = this.filterAvailableSlots(slots, existingTasks, 15);

    if (availableSlots.length === 0) return null;

    const scoredSlots = this.scoreTimeSlots(
      availableSlots,
      energyPatterns,
      { duration: durationMinutes } as Task,
      DEFAULT_OPTIONS
    );

    return scoredSlots.sort((a, b) => b.score - a.score)[0] || null;
  }

  /**
   * Оптимизирует расписание на день
   */
  static optimizeDailySchedule(
    tasks: Task[],
    energyPatterns: EnergyPattern[],
    targetDate: Date
  ): Task[] {
    const dayStart = new Date(targetDate);
    dayStart.setHours(6, 0, 0, 0);

    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 0, 0, 0);

    const unscheduledTasks = tasks
      .filter(t => !t.completed && !t.scheduledTime)
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority || 'medium'];
        const bPriority = priorityOrder[b.priority || 'medium'];
        return bPriority - aPriority;
      });

    const scheduledTasks: Task[] = [];
    let currentTime = new Date(dayStart);

    for (const task of