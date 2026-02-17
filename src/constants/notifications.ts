export const NOTIFICATION_TYPES = {
  MOOD_CHECK: 'mood_check',
  TASK_REMINDER: 'task_reminder',
  BREAK_REMINDER: 'break_reminder',
  ENERGY_LOW: 'energy_low',
  INSIGHT: 'insight',
  WEEKLY_SUMMARY: 'weekly_summary',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

export const NOTIFICATION_INTERVALS = {
  MOOD_CHECK: 3 * 60 * 60, // 3 hours in seconds
  BREAK_REMINDER: 2 * 60 * 60, // 2 hours in seconds
  TASK_REMINDER_BEFORE: 15 * 60, // 15 minutes before task
  ENERGY_CHECK: 4 * 60 * 60, // 4 hours in seconds
  WEEKLY_SUMMARY: 7 * 24 * 60 * 60, // 7 days in seconds
} as const;

export const NOTIFICATION_MESSAGES = {
  MOOD_CHECK: {
    title: '🌟 Как настроение?',
    body: 'Потратьте 2 секунды, чтобы отметить свой уровень энергии',
  },
  BREAK_REMINDER: {
    title: '☕️ Время микропаузы',
    body: 'Вы работаете уже 2 часа. Сделайте перерыв 5-10 минут',
  },
  ENERGY_LOW: {
    title: '⚡️ Энергия на минимуме',
    body: 'Возможно, стоит отложить сложные задачи на более продуктивное время',
  },
  TASK_UPCOMING: {
    title: '📋 Скоро задача',
    body: 'Через 15 минут начинается: ',
  },
  TASK_OVERDUE: {
    title: '⏰ Пропущенная задача',
    body: 'Задача не выполнена: ',
  },
  INSIGHT_AVAILABLE: {
    title: '💡 Новая подсказка',
    body: 'У нас есть интересная информация о вашей продуктивности',
  },
  WEEKLY_SUMMARY: {
    title: '📊 Недельный отчёт',
    body: 'Посмотрите, как прошла ваша неделя',
  },
  PEAK_HOURS: {
    title: '🚀 Пиковые часы',
    body: 'Сейчас ваше самое продуктивное время. Используйте его с умом!',
  },
  LOW_ENERGY_PATTERN: {
    title: '😴 Паттерн низкой энергии',
    body: 'В это время ваша энергия обычно падает. Запланируйте лёгкие задачи',
  },
} as const;

export const NOTIFICATION_CHANNELS = {
  MOOD_TRACKING: {
    id: 'mood_tracking',
    name: 'Отслеживание настроения',
    description: 'Напоминания об отметке настроения и энергии',
    importance: 3, // DEFAULT
  },
  TASKS: {
    id: 'tasks',
    name: 'Задачи',
    description: 'Уведомления о предстоящих и пропущенных задачах',
    importance: 4, // HIGH
  },
  BREAKS: {
    id: 'breaks',
    name: 'Перерывы',
    description: 'Напоминания о необходимости отдыха',
    importance: 3, // DEFAULT
  },
  INSIGHTS: {
    id: 'insights',
    name: 'Умные подсказки',
    description: 'Персонализированные рекомендации и паттерны',
    importance: 2, // LOW
  },
  SUMMARIES: {
    id: 'summaries',
    name: 'Отчёты',
    description: 'Еженедельные и ежемесячные сводки',
    importance: 2, // LOW
  },
} as const;

export const NOTIFICATION_PRIORITIES = {
  MIN: -2,
  LOW: -1,
  DEFAULT: 0,
  HIGH: 1,
  MAX: 2,
} as const;

export const NOTIFICATION_SOUNDS = {
  DEFAULT: 'default',
  GENTLE: 'gentle',
  ENERGETIC: 'energetic',
  CALM: 'calm',
  NONE: null,
} as const;

export const NOTIFICATION_TRIGGERS = {
  MOOD_CHECK: {
    type: 'timeInterval' as const,
    repeats: true,
    seconds: NOTIFICATION_INTERVALS.MOOD_CHECK,
  },
  BREAK_REMINDER: {
    type: 'timeInterval' as const,
    repeats: true,
    seconds: NOTIFICATION_INTERVALS.BREAK_REMINDER,
  },
  WEEKLY_SUMMARY: {
    type: 'calendar' as const,
    repeats: true,
    weekday: 1, // Monday
    hour: 9,
    minute: 0,
  },
} as const;

export const NOTIFICATION_ACTIONS = {
  MARK_MOOD: {
    identifier: 'mark_mood',
    title: 'Отметить настроение',
    options: {
      foreground: true,
    },
  },
  TAKE_BREAK: {
    identifier: 'take_break',
    title: 'Начать перерыв',
    options: {
      foreground: true,
    },
  },
  SNOOZE: {
    identifier: 'snooze',
    title: 'Напомнить позже',
    options: {
      foreground: false,
    },
  },
  COMPLETE_TASK: {
    identifier: 'complete_task',
    title: 'Выполнено',
    options: {
      foreground: false,
    },
  },
  VIEW_INSIGHT: {
    identifier: 'view_insight',
    title: 'Посмотреть',
    options: {
      foreground: true,
    },
  },
  DISMISS: {
    identifier: 'dismiss',
    title: 'Закрыть',
    options: {
      foreground: false,
    },
  },
} as const;

export const NOTIFICATION_BADGES = {
  MOOD_CHECK: '🌟',
  TASK: '📋',
  BREAK: '☕️',
  ENERGY: '⚡️',
  INSIGHT: '💡',
  SUMMARY: '📊',
} as const;

export const DEFAULT_NOTIFICATION_SETTINGS = {
  moodCheckEnabled: true,
  moodCheckInterval: NOTIFICATION_INTERVALS.MOOD_CHECK,
  breakReminderEnabled: true,
  breakReminderInterval: NOTIFICATION_INTERVALS.BREAK_REMINDER,
  taskRemindersEnabled: true,
  taskReminderBefore: NOTIFICATION_INTERVALS.TASK_REMINDER_BEFORE,
  insightsEnabled: true,
  weeklySummaryEnabled: true,
  weeklySummaryDay: 1, // Monday
  weeklySummaryTime: { hour: 9, minute: 0 },
  quietHoursEnabled: false,
  quietHoursStart: { hour: 22, minute: 0 },
  quietHoursEnd: { hour: 8, minute: 0 },
  sound: NOTIFICATION_SOUNDS.DEFAULT,
  vibrate: true,
  badge: true,
} as const;

export const SNOOZE_DURATIONS = {
  SHORT: 15 * 60, // 15 minutes
  MEDIUM: 30 * 60, // 30 minutes
  LONG: 60 * 60, // 1 hour
  CUSTOM: null,
} as const;

export const NOTIFICATION_LIMITS = {
  MAX_DAILY_MOOD_CHECKS: 8,
  MAX_DAILY_BREAK_REMINDERS: 6,
  MAX_DAILY_INSIGHTS: 3,
  MIN_INTERVAL_BETWEEN_NOTIFICATIONS: 5 * 60, // 5 minutes
} as const;

export const NOTIFICATION_EMOJIS = {
  MOOD_VERY_LOW: '😔',
  MOOD_LOW: '😐',
  MOOD_MEDIUM: '🙂',
  MOOD_HIGH: '😊',
  MOOD_VERY_HIGH: '🤩',
  ENERGY_LOW: '🔋',
  ENERGY_MEDIUM: '⚡️',
  ENERGY_HIGH: '🚀',
  BREAK: '☕️',
  TASK: '📋',
  INSIGHT: '💡',
  SUCCESS: '✅',
  WARNING: '⚠️',
} as const;

export const NOTIFICATION_TEMPLATES = {
  MOOD_CHECK_MORNING: {
    title: '🌅 Доброе утро!',
    body: 'Как вы себя чувствуете сегодня?',
  },
  MOOD_CHECK_AFTERNOON: {
    title: '☀️ Как день?',
    body: 'Отметьте свой уровень энергии',
  },
  MOOD_CHECK_EVENING: {
    title: '🌙 Добрый вечер',
    body: 'Как прошёл день? Отметьте настроение',
  },
  BREAK_FIRST: {
    title: '☕️ Первый перерыв',
    body: 'Время немного отдохнуть. Потянитесь или выпейте воды',
  },
  BREAK_REGULAR: {
    title: '🧘 Микропауза',
    body: 'Отвлекитесь на 5-10 минут для восстановления энергии',
  },
  BREAK_URGENT: {
    title: '⚠️ Срочно нужен перерыв',
    body: 'Вы работаете без перерыва уже 3 часа. Это может снизить продуктивность',
  },
  TASK_SOON: {
    title: '⏰ Скоро задача',
    body: 'Через 15 минут: ',
  },
  TASK_NOW: {
    title: '▶️ Время начать',
    body: 'Сейчас запланировано: ',
  },
  TASK_MISSED: {
    title: '⏰ Пропущено',
    body: 'Задача не выполнена: ',
  },
  INSIGHT_PEAK_DISCOVERED: {
    title: '🎯 Найден паттерн',
    body: 'Мы обнаружили ваши пиковые часы продуктивности',
  },
  INSIGHT_LOW_ENERGY_WARNING: {
    title: '📉 Падение энергии',
    body: 'В это время ваша энергия обычно снижается',
  },
  INSIGHT_PRODUCTIVITY_TIP: {
    title: '💡 Совет дня',
    body: 'Основываясь на ваших данных...',
  },
  WEEKLY_SUMMARY_POSITIVE: {
    title: '🎉 Отличная неделя!',
    body: 'Вы выполнили {taskCount} задач и поддерживали высокую энергию',
  },
  WEEKLY_SUMMARY_NEUTRAL: {
    title: '📊 Недельный отчёт',
    body: 'Выполнено {taskCount} задач. Средний уровень энергии: {avgEnergy}',
  },
  WEEKLY_SUMMARY_IMPROVEMENT: {
    title: '📈 Есть куда расти',
    body: 'На этой неделе вы выполнили {taskCount} задач. Попробуйте планировать больше в пиковые часы',
  },
} as const;

export type NotificationTemplate = keyof typeof NOTIFICATION_TEMPLATES;

export const getNotificationMessage = (
  type: NotificationType,
  template?: NotificationTemplate,
  params?: Record<string, string | number>
): { title: string; body: string } => {
  if (template && NOTIFICATION_TEMPLATES[template]) {
    let { title, body } = NOTIFICATION_TEMPLATES[template];
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        body = body.replace(`{${key}}`, String(value));
      });
    }
    
    return { title, body };
  }
  
  return NOTIFICATION_MESSAGES[type] || NOTIFICATION_MESSAGES.MOOD_CHECK;
};

export const shouldShowNotification = (
  type: NotificationType,
  settings: typeof DEFAULT_NOTIFICATION_SETTINGS,
  currentTime: Date = new Date()
): boolean => {
  if (settings.quietHoursEnabled) {
    const hour = currentTime.getHours();
    const { quietHoursStart, quietHoursEnd } = settings;
    
    if (quietHoursStart.hour <= quietHoursEnd.hour) {
      if (hour >= quietHoursStart.hour && hour < quietHoursEnd.hour) {
        return false;
      }
    } else {
      if (hour >= quietHoursStart.hour || hour < quietHoursEnd.hour) {
        return false;
      }
    }
  }
  
  switch (type) {
    case NOTIFICATION_TYPES.MOOD_CHECK:
      return settings.moodCheckEnabled;
    case NOTIFICATION_TYPES.BREAK_REMINDER:
      return settings.breakReminderEnabled;
    case NOTIFICATION_TYPES.TASK_REMINDER:
      return settings.taskRemindersEnabled;
    case NOTIFICATION_TYPES.INSIGHT:
      return settings.insightsEnabled;
    case NOTIFICATION_TYPES.WEEKLY_SUMMARY:
      return settings.weeklySummaryEnabled;
    default:
      return true;
  }
};