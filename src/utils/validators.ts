export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validators = {
  taskTitle: (title: string): ValidationResult => {
    if (!title || title.trim().length === 0) {
      return {
        isValid: false,
        error: 'Название задачи не может быть пустым',
      };
    }

    if (title.trim().length < 2) {
      return {
        isValid: false,
        error: 'Название задачи должно содержать минимум 2 символа',
      };
    }

    if (title.length > 200) {
      return {
        isValid: false,
        error: 'Название задачи не может превышать 200 символов',
      };
    }

    return { isValid: true };
  },

  taskDuration: (duration: number): ValidationResult => {
    if (!Number.isInteger(duration)) {
      return {
        isValid: false,
        error: 'Длительность должна быть целым числом',
      };
    }

    if (duration < 5) {
      return {
        isValid: false,
        error: 'Минимальная длительность задачи — 5 минут',
      };
    }

    if (duration > 480) {
      return {
        isValid: false,
        error: 'Максимальная длительность задачи — 8 часов (480 минут)',
      };
    }

    return { isValid: true };
  },

  scheduledTime: (timestamp: number): ValidationResult => {
    if (!Number.isInteger(timestamp)) {
      return {
        isValid: false,
        error: 'Некорректное значение времени',
      };
    }

    const now = Date.now();
    const minTime = now - 365 * 24 * 60 * 60 * 1000; // 1 год назад
    const maxTime = now + 365 * 24 * 60 * 60 * 1000; // 1 год вперёд

    if (timestamp < minTime) {
      return {
        isValid: false,
        error: 'Дата не может быть более года назад',
      };
    }

    if (timestamp > maxTime) {
      return {
        isValid: false,
        error: 'Дата не может быть более года в будущем',
      };
    }

    return { isValid: true };
  },

  energyLevel: (energy: number): ValidationResult => {
    if (typeof energy !== 'number' || isNaN(energy)) {
      return {
        isValid: false,
        error: 'Уровень энергии должен быть числом',
      };
    }

    if (energy < 0) {
      return {
        isValid: false,
        error: 'Уровень энергии не может быть отрицательным',
      };
    }

    if (energy > 100) {
      return {
        isValid: false,
        error: 'Уровень энергии не может превышать 100',
      };
    }

    return { isValid: true };
  },

  moodEmoji: (emoji: string): ValidationResult => {
    const validEmojis = ['😫', '😕', '😐', '🙂', '😄'];

    if (!emoji || emoji.trim().length === 0) {
      return {
        isValid: false,
        error: 'Необходимо выбрать настроение',
      };
    }

    if (!validEmojis.includes(emoji)) {
      return {
        isValid: false,
        error: 'Выбрано некорректное настроение',
      };
    }

    return { isValid: true };
  },

  moodNote: (note: string): ValidationResult => {
    if (note && note.length > 500) {
      return {
        isValid: false,
        error: 'Заметка не может превышать 500 символов',
      };
    }

    return { isValid: true };
  },

  taskPriority: (priority: string): ValidationResult => {
    const validPriorities = ['low', 'medium', 'high'];

    if (!priority || priority.trim().length === 0) {
      return {
        isValid: false,
        error: 'Необходимо указать приоритет задачи',
      };
    }

    if (!validPriorities.includes(priority)) {
      return {
        isValid: false,
        error: 'Некорректный приоритет задачи',
      };
    }

    return { isValid: true };
  },

  taskColor: (color: string): ValidationResult => {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

    if (!color || color.trim().length === 0) {
      return { isValid: true }; // Цвет опционален
    }

    if (!hexColorRegex.test(color)) {
      return {
        isValid: false,
        error: 'Цвет должен быть в формате HEX (#RRGGBB)',
      };
    }

    return { isValid: true };
  },

  timestamp: (timestamp: number): ValidationResult => {
    if (!Number.isInteger(timestamp)) {
      return {
        isValid: false,
        error: 'Некорректное значение временной метки',
      };
    }

    if (timestamp < 0) {
      return {
        isValid: false,
        error: 'Временная метка не может быть отрицательной',
      };
    }

    const maxTimestamp = 253402300799000; // 31 Dec 9999 23:59:59 GMT
    if (timestamp > maxTimestamp) {
      return {
        isValid: false,
        error: 'Временная метка выходит за допустимые пределы',
      };
    }

    return { isValid: true };
  },

  id: (id: number): ValidationResult => {
    if (!Number.isInteger(id)) {
      return {
        isValid: false,
        error: 'ID должен быть целым числом',
      };
    }

    if (id <= 0) {
      return {
        isValid: false,
        error: 'ID должен быть положительным числом',
      };
    }

    return { isValid: true };
  },
};

export const validateTask = (task: {
  title: string;
  duration?: number;
  scheduledTime?: number;
  priority?: string;
  color?: string;
}): ValidationResult => {
  const titleValidation = validators.taskTitle(task.title);
  if (!titleValidation.isValid) {
    return titleValidation;
  }

  if (task.duration !== undefined) {
    const durationValidation = validators.taskDuration(task.duration);
    if (!durationValidation.isValid) {
      return durationValidation;
    }
  }

  if (task.scheduledTime !== undefined) {
    const timeValidation = validators.scheduledTime(task.scheduledTime);
    if (!timeValidation.isValid) {
      return timeValidation;
    }
  }

  if (task.priority) {
    const priorityValidation = validators.taskPriority(task.priority);
    if (!priorityValidation.isValid) {
      return priorityValidation;
    }
  }

  if (task.color) {
    const colorValidation = validators.taskColor(task.color);
    if (!colorValidation.isValid) {
      return colorValidation;
    }
  }

  return { isValid: true };
};

export const validateMood = (mood: {
  energy: number;
  emoji: string;
  note?: string;
  timestamp?: number;
}): ValidationResult => {
  const energyValidation = validators.energyLevel(mood.energy);
  if (!energyValidation.isValid) {
    return energyValidation;
  }

  const emojiValidation = validators.moodEmoji(mood.emoji);
  if (!emojiValidation.isValid) {
    return emojiValidation;
  }

  if (mood.note) {
    const noteValidation = validators.moodNote(mood.note);
    if (!noteValidation.isValid) {
      return noteValidation;
    }
  }

  if (mood.timestamp !== undefined) {
    const timestampValidation = validators.timestamp(mood.timestamp);
    if (!timestampValidation.isValid) {
      return timestampValidation;
    }
  }

  return { isValid: true };
};

export const sanitizeTaskTitle = (title: string): string => {
  return title.trim().replace(/\s+/g, ' ').slice(0, 200);
};

export const sanitizeMoodNote = (note: string): string => {
  return note.trim().replace(/\s+/g, ' ').slice(0, 500);
};

export const clampEnergyLevel = (energy: number): number => {
  return Math.max(0, Math.min(100, Math.round(energy)));
};

export const isValidTimeRange = (
  startTime: number,
  endTime: number
): ValidationResult => {
  const startValidation = validators.timestamp(startTime);
  if (!startValidation.isValid) {
    return startValidation;
  }

  const endValidation = validators.timestamp(endTime);
  if (!endValidation.isValid) {
    return endValidation;
  }

  if (startTime >= endTime) {
    return {
      isValid: false,
      error: 'Время начала должно быть раньше времени окончания',
    };
  }

  const duration = endTime - startTime;
  const maxDuration = 24 * 60 * 60 * 1000; // 24 часа

  if (duration > maxDuration) {
    return {
      isValid: false,
      error: 'Временной диапазон не может превышать 24 часа',
    };
  }

  return { isValid: true };
};

export const isTaskOverlapping = (
  task1Start: number,
  task1Duration: number,
  task2Start: number,
  task2Duration: number
): boolean => {
  const task1End = task1Start + task1Duration * 60 * 1000;
  const task2End = task2Start + task2Duration * 60 * 1000;

  return (
    (task1Start >= task2Start && task1Start < task2End) ||
    (task1End > task2Start && task1End <= task2End) ||
    (task1Start <= task2Start && task1End >= task2End)
  );
};