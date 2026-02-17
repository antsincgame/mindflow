import { Task } from '../models/Task';
import { EnergyPattern } from '../models/EnergyPattern';
import { energyService } from './energyService';
import { taskService } from './taskService';
import { format, addMinutes, startOfDay, addDays, isBefore, isAfter, setHours, setMinutes } from 'date-fns';

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  energyScore: number;
  confidence: number;
  reason: string;
}

export interface SchedulingSuggestion {
  task: Task;
  recommendedSlots: TimeSlot[];
  bestSlot: TimeSlot;
  alternativeSlots: TimeSlot[];
}

class SchedulingService {
  private readonly MIN_ENERGY_THRESHOLD = 40;
  private readonly OPTIMAL_ENERGY_THRESHOLD = 70;
  private readonly SLOT_DURATION_MINUTES = 60;
  private readonly BREAK_DURATION_MINUTES = 15;
  private readonly WORKING_HOURS_START = 7;
  private readonly WORKING_HOURS_END = 22;
  private readonly LOOK_AHEAD_DAYS = 7;

  async suggestTimeSlots(task: Task, date?: Date): Promise<SchedulingSuggestion> {
    const targetDate = date || new Date();
    const patterns = await energyService.getEnergyPatterns();
    const existingTasks = await taskService.getAllTasks();
    
    const taskDuration = task.duration || this.SLOT_DURATION_MINUTES;
    const priority = task.priority || 'medium';

    const allSlots = await this.generatePotentialSlots(targetDate, taskDuration, existingTasks);
    const scoredSlots = await this.scoreSlots(allSlots, patterns, priority, taskDuration);
    const filteredSlots = this.filterSlotsByEnergy(scoredSlots, priority);

    const sortedSlots = filteredSlots.sort((a, b) => b.energyScore - a.energyScore);

    const bestSlot = sortedSlots[0];
    const alternativeSlots = sortedSlots.slice(1, 3);
    const recommendedSlots = sortedSlots.slice(0, 3);

    return {
      task,
      recommendedSlots,
      bestSlot,
      alternativeSlots
    };
  }

  async suggestMultipleTasks(tasks: Task[]): Promise<SchedulingSuggestion[]> {
    const suggestions: SchedulingSuggestion[] = [];
    const scheduledSlots: TimeSlot[] = [];

    const sortedTasks = this.prioritizeTasks(tasks);

    for (const task of sortedTasks) {
      const suggestion = await this.suggestTimeSlotsWithExclusions(task, scheduledSlots);
      suggestions.push(suggestion);
      
      if (suggestion.bestSlot) {
        scheduledSlots.push(suggestion.bestSlot);
      }
    }

    return suggestions;
  }

  async optimizeSchedule(tasks: Task[], date: Date): Promise<Task[]> {
    const patterns = await energyService.getEnergyPatterns();
    const optimizedTasks: Task[] = [];

    const unscheduledTasks = tasks.filter(t => !t.scheduledTime || !t.completed);
    const suggestions = await this.suggestMultipleTasks(unscheduledTasks);

    for (const suggestion of suggestions) {
      const optimizedTask: Task = {
        ...suggestion.task,
        scheduledTime: suggestion.bestSlot.startTime.getTime(),
        duration: suggestion.task.duration || this.SLOT_DURATION_MINUTES
      };
      optimizedTasks.push(optimizedTask);
    }

    return optimizedTasks;
  }

  async findNextAvailableSlot(duration: number, minEnergy: number = this.MIN_ENERGY_THRESHOLD): Promise<TimeSlot | null> {
    const now = new Date();
    const patterns = await energyService.getEnergyPatterns();
    const existingTasks = await taskService.getAllTasks();

    for (let dayOffset = 0; dayOffset < this.LOOK_AHEAD_DAYS; dayOffset++) {
      const targetDate = addDays(now, dayOffset);
      const slots = await this.generatePotentialSlots(targetDate, duration, existingTasks);
      const scoredSlots = await this.scoreSlots(slots, patterns, 'medium', duration);

      const availableSlot = scoredSlots.find(slot => 
        slot.energyScore >= minEnergy && 
        isAfter(slot.startTime, now)
      );

      if (availableSlot) {
        return availableSlot;
      }
    }

    return null;
  }

  async rescheduleTask(taskId: string, newStartTime: Date): Promise<boolean> {
    const task = await taskService.getTaskById(taskId);
    if (!task) return false;

    const duration = task.duration || this.SLOT_DURATION_MINUTES;
    const endTime = addMinutes(newStartTime, duration);

    const conflicts = await this.checkConflicts(newStartTime, endTime, taskId);
    if (conflicts.length > 0) {
      return false;
    }

    const updatedTask: Task = {
      ...task,
      scheduledTime: newStartTime.getTime()
    };

    await taskService.updateTask(taskId, updatedTask);
    return true;
  }

  private async generatePotentialSlots(date: Date, duration: number, existingTasks: Task[]): Promise<TimeSlot[]> {
    const slots: TimeSlot[] = [];
    const startOfWorkDay = setMinutes(setHours(startOfDay(date), this.WORKING_HOURS_START), 0);
    const endOfWorkDay = setMinutes(setHours(startOfDay(date), this.WORKING_HOURS_END), 0);

    let currentTime = startOfWorkDay;

    while (isBefore(currentTime, endOfWorkDay)) {
      const slotEnd = addMinutes(currentTime, duration);

      if (isAfter(slotEnd, endOfWorkDay)) {
        break;
      }

      const hasConflict = existingTasks.some(task => {
        if (!task.scheduledTime || task.completed) return false;
        
        const taskStart = new Date(task.scheduledTime);
        const taskEnd = addMinutes(taskStart, task.duration || this.SLOT_DURATION_MINUTES);

        return (
          (isBefore(currentTime, taskEnd) && isAfter(slotEnd, taskStart)) ||
          (isBefore(taskStart, slotEnd) && isAfter(taskEnd, currentTime))
        );
      });

      if (!hasConflict) {
        slots.push({
          startTime: new Date(currentTime),
          endTime: slotEnd,
          energyScore: 0,
          confidence: 0,
          reason: ''
        });
      }

      currentTime = addMinutes(currentTime, 30);
    }

    return slots;
  }

  private async scoreSlots(
    slots: TimeSlot[], 
    patterns: EnergyPattern[], 
    priority: 'low' | 'medium' | 'high',
    duration: number
  ): Promise<TimeSlot[]> {
    const scoredSlots: TimeSlot[] = [];

    for (const slot of slots) {
      const dayOfWeek = slot.startTime.getDay();
      const hourOfDay = slot.startTime.getHours();

      const pattern = patterns.find(
        p => p.dayOfWeek === dayOfWeek && p.hourOfDay === hourOfDay
      );

      let baseEnergy = pattern?.averageEnergy || 50;
      const sampleCount = pattern?.sampleCount || 0;

      let energyScore = baseEnergy;
      let confidence = Math.min(sampleCount / 10, 1);

      if (priority === 'high') {
        energyScore = energyScore * 1.2;
      } else if (priority === 'low') {
        energyScore = energyScore * 0.8;
      }

      const now = new Date();
      if (isAfter(slot.startTime, now) && isBefore(slot.startTime, addMinutes(now, 120))) {
        energyScore = energyScore * 1.1;
      }

      if (duration > 90) {
        energyScore = energyScore * 0.9;
      }

      const morningBoost = hourOfDay >= 8 && hourOfDay <= 11;
      if (morningBoost && priority === 'high') {
        energyScore = energyScore * 1.15;
      }

      const afternoonDip = hourOfDay >= 14 && hourOfDay <= 16;
      if (afternoonDip) {
        energyScore = energyScore * 0.85;
      }

      let reason = '';
      if (energyScore >= this.OPTIMAL_ENERGY_THRESHOLD) {
        reason = 'Optimal energy level for this time';
      } else if (energyScore >= this.MIN_ENERGY_THRESHOLD) {
        reason = 'Moderate energy level';
      } else {
        reason = 'Low energy level';
      }

      if (morningBoost) {
        reason += ' (Morning productivity boost)';
      }

      scoredSlots.push({
        ...slot,
        energyScore: Math.min(energyScore, 100),
        confidence,
        reason
      });
    }

    return scoredSlots;
  }

  private filterSlotsByEnergy(slots: TimeSlot[], priority: 'low' | 'medium' | 'high'): TimeSlot[] {
    let threshold = this.MIN_ENERGY_THRESHOLD;

    if (priority === 'high') {
      threshold = this.OPTIMAL_ENERGY_THRESHOLD;
    } else if (priority === 'medium') {
      threshold = (this.MIN_ENERGY_THRESHOLD + this.OPTIMAL_ENERGY_THRESHOLD) / 2;
    }

    const filtered = slots.filter(slot => slot.energyScore >= threshold);

    if (filtered.length === 0) {
      return slots.slice(0, 3);
    }

    return filtered;
  }

  private prioritizeTasks(tasks: Task[]): Task[] {
    const priorityWeight = {
      high: 3,
      medium: 2,
      low: 1
    };

    return tasks.sort((a, b) => {
      const aPriority = priorityWeight[a.priority || 'medium'];
      const bPriority = priorityWeight[b.priority || 'medium'];

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      const aDuration = a.duration || this.SLOT_DURATION_MINUTES;
      const bDuration = b.duration || this.SLOT_DURATION_MINUTES;

      return bDuration - aDuration;
    });
  }

  private async suggestTimeSlotsWithExclusions(task: Task, excludedSlots: TimeSlot[]): Promise<SchedulingSuggestion> {
    const targetDate = new Date();
    const patterns = await energyService.getEnergyPatterns();
    const existingTasks = await taskService.getAllTasks();
    
    const taskDuration = task.duration || this.SLOT_DURATION_MINUTES;
    const priority = task.priority || 'medium';

    const allSlots = await this.generatePotentialSlots(targetDate, taskDuration, existingTasks);
    
    const availableSlots = allSlots.filter(slot => {
      return !excludedSlots.some(excluded => 
        (isBefore(slot.startTime, excluded.endTime) && isAfter(slot.endTime, excluded.startTime))
      );
    });

    const scoredSlots = await this.scoreSlots(availableSlots, patterns, priority, taskDuration);
    const filteredSlots = this.filterSlotsByEnergy(scoredSlots, priority);

    const sortedSlots = filteredSlots.sort((a, b) => b.energyScore - a.energyScore);

    const bestSlot = sortedSlots[0];
    const alternativeSlots = sortedSlots.slice(1, 3);
    const recommendedSlots = sortedSlots.slice(0, 3);

    return {
      task,
      recommendedSlots,
      bestSlot,
      alternativeSlots
    };
  }

  private async checkConflicts(startTime: Date, endTime: Date, excludeTaskId?: string): Promise<Task[]> {
    const allTasks = await taskService.getAllTasks();
    
    return allTasks.filter(task => {
      if (task.id === excludeTaskId) return false;
      if (!task.scheduledTime || task.completed) return false;

      const taskStart = new Date(task.scheduledTime);
      const taskEnd = addMinutes(taskStart, task.duration || this.SLOT_DURATION_MINUTES);

      return (
        (isBefore(startTime, taskEnd) && isAfter(endTime, taskStart)) ||
        (isBefore(taskStart, endTime) && isAfter(taskEnd, startTime))
      );
    });
  }

  async getEnergyForecast(date: Date): Promise<{ hour: number; energy: number }[]> {
    const patterns = await energyService.getEnergyPatterns();
    const dayOfWeek = date.getDay();
    const forecast: { hour: number; energy: number }[] = [];

    for (let hour = this.WORKING_HOURS_START; hour < this.WORKING_HOURS_END; hour++) {
      const pattern = patterns.find(
        p => p.dayOfWeek === dayOfWeek && p.hourOfDay === hour
      );

      forecast.push({
        hour,
        energy: pattern?.averageEnergy || 50
      });
    }

    return forecast;
  }

  async getOptimalBreakTimes(date: Date): Promise<Date[]> {
    const forecast = await this.getEnergyForecast(date);
    const breakTimes: Date[] = [];

    for (let i = 1; i < forecast.length; i++) {
      const current = forecast[i];
      const previous = forecast[i - 1];

      if (current.energy < previous.energy && previous.energy > 60) {
        const breakTime = setMinutes(setHours(date, current.hour), 0);
        breakTimes.push(breakTime);
      }
    }

    return breakTimes;
  }
}

export const schedulingService = new SchedulingService();