import { format, formatDistance, formatDuration, intervalToDuration } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Форматирование времени в формат мм:сс
 * @param totalSeconds - количество секунд
 * @returns строка в формате "мм:сс"
 */
export const formatTimeMMSS = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Форматирование времени в формат чч:мм:сс
 * @param totalSeconds - количество секунд
 * @returns строка в формате "чч:мм:сс"
 */
export const formatTimeHHMMSS = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Форматирование пульса
 * @param heartRate - значение пульса
 * @returns строка с единицей измерения
 */
export const formatHeartRate = (heartRate: number | null | undefined): string => {
  if (heartRate == null || isNaN(heartRate)) {
    return '-- уд/мин';
  }
  return `${Math.round(heartRate)} уд/мин`;
};

/**
 * Краткое форматирование пульса (для виджетов)
 * @param heartRate - значение пульса
 * @returns строка с сокращённой единицей
 */
export const formatHeartRateShort = (heartRate: number | null | undefined): string => {
  if (heartRate == null || isNaN(heartRate)) {
    return '--';
  }
  return `${Math.round(heartRate)}`;
};

/**
 * Форматирование уровня стресса в процентах
 * @param stressLevel - уровень стресса (0-100)
 * @returns строка с процентом
 */
export const formatStressLevel = (stressLevel: number | null | undefined): string => {
  if (stressLevel == null || isNaN(stressLevel)) {
    return '--%';
  }
  const clamped = Math.max(0, Math.min(100, Math.round(stressLevel)));
  return `${clamped}%`;
};

/**
 * Текстовое описание уровня стресса
 * @param stressLevel - уровень стресса (0-100)
 * @returns текстовое описание
 */
export const formatStressLevelLabel = (stressLevel: number | null | undefined): string => {
  if (stressLevel == null || isNaN(stressLevel)) {
    return 'Нет данных';
  }
  if (stressLevel <= 20) return 'Спокойно';
  if (stressLevel <= 40) return 'Немного напряжённо';
  if (stressLevel <= 60) return 'Умеренный стресс';
  if (stressLevel <= 80) return 'Высокий стресс';
  return 'Очень высокий стресс';
};

/**
 * Форматирование изменения уровня стресса (до/после)
 * @param before - уровень до
 * @param after - уровень после
 * @returns строка с изменением
 */
export const formatStressChange = (
  before: number | null | undefined,
  after: number | null | undefined,
): string => {
  if (before == null || after == null || isNaN(before) || isNaN(after)) {
    return 'Нет данных';
  }
  const diff = Math.round(after - before);
  if (diff === 0) return 'Без изменений';
  if (diff < 0) return `−${Math.abs(diff)}%`;
  return `+${diff}%`;
};

/**
 * Форматирование качества сна
 * @param sleepQuality - качество сна (0-100)
 * @returns текстовое описание
 */
export const formatSleepQuality = (sleepQuality: number | null | undefined): string => {
  if (sleepQuality == null || isNaN(sleepQuality)) {
    return 'Нет данных';
  }
  if (sleepQuality <= 20) return 'Плохой сон';
  if (sleepQuality <= 40) return 'Ниже среднего';
  if (sleepQuality <= 60) return 'Средний';
  if (sleepQuality <= 80) return 'Хороший';
  return 'Отличный';
};

/**
 * Форматирование качества сна с числовым значением
 * @param sleepQuality - качество сна (0-100)
 * @returns строка с числом и описанием
 */
export const formatSleepQualityDetailed = (sleepQuality: number | null | undefined): string => {
  if (sleepQuality == null || isNaN(sleepQuality)) {
    return 'Нет данных';
  }
  const clamped = Math.max(0, Math.min(100, Math.round(sleepQuality)));
  const label = formatSleepQuality(sleepQuality);
  return `${clamped}% — ${label}`;
};

/**
 * Форматирование длительности сна
 * @param durationMinutes - длительность в минутах
 * @returns строка "Xч Yмин"
 */
export const formatSleepDuration = (durationMinutes: number | null | undefined): string => {
  if (durationMinutes == null || isNaN(durationMinutes) || durationMinutes < 0) {
    return 'Нет данных';
  }
  const hours = Math.floor(durationMinutes / 60);
  const minutes = Math.round(durationMinutes % 60);

  if (hours === 0) return `${minutes} мин`;
  if (minutes === 0) return `${hours} ч`;
  return `${hours} ч ${minutes} мин`;
};

/**
 * Форматирование длительности упражнения
 * @param durationSeconds - длительность в секундах
 * @returns человекочитаемая строка
 */
export const formatExerciseDuration = (durationSeconds: number | null | undefined): string => {
  if (durationSeconds == null || isNaN(durationSeconds) || durationSeconds < 0) {
    return '0 мин';
  }
  const totalSeconds = Math.round(durationSeconds);

  if (totalSeconds < 60) {
    return `${totalSeconds} сек`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (seconds === 0) {
    return `${minutes} мин`;
  }

  return `${minutes} мин ${seconds} сек`;
};

/**
 * Краткое форматирование длительности упражнения для карточек
 * @param durationSeconds - длительность в секундах
 * @returns краткая строка "X мин"
 */
export const formatExerciseDurationShort = (durationSeconds: number | null | undefined): string => {
  if (durationSeconds == null || isNaN(durationSeconds) || durationSeconds < 0) {
    return '0 мин';
  }

  const minutes = Math.ceil(durationSeconds / 60);

  if (minutes < 1) return '<1 мин';
  return `${minutes} мин`;
};

/**
 * Форматирование длительности сессии
 * @param startDate - дата начала
 * @param endDate - дата окончания
 * @returns человекочитаемая строка длительности
 */
export const formatSessionDuration = (
  startDate: Date | string,
  endDate: Date | string,
): string => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return '0 сек';

  const totalSeconds = Math.floor(diffMs / 1000);
  return formatExerciseDuration(totalSeconds);
};

/**
 * Форматирование HRV (вариабельность сердечного ритма)
 * @param hrv - значение HRV в мс
 * @returns строка с единицей измерения
 */
export const formatHRV = (hrv: number | null | undefined): string => {
  if (hrv == null || isNaN(hrv)) {
    return '-- мс';
  }
  return `${Math.round(hrv)} мс`;
};

/**
 * Форматирование частоты дыхания
 * @param breathRate - частота дыхания (вдохов/мин)
 * @returns строка с единицей
 */
export const formatBreathRate = (breathRate: number | null | undefined): string => {
  if (breathRate == null || isNaN(breathRate)) {
    return '-- вд/мин';
  }
  return `${Math.round(breathRate)} вд/мин`;
};

/**
 * Форматирование числа с единицей измерения
 * @param value - числовое значение
 * @param unit - единица измерения
 * @param decimals - количество знаков после запятой
 * @returns отформатированная строка
 */
export const formatWithUnit = (
  value: number | null | undefined,
  unit: string,
  decimals: number = 0,
): string => {
  if (value == null || isNaN(value)) {
    return `-- ${unit}`;
  }
  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  return `${formatted} ${unit}`;
};

/**
 * Форматирование числа сессий
 * @param count - количество сессий
 * @returns строка с правильным склонением
 */
export const formatSessionCount = (count: number): string => {
  const absCount = Math.abs(Math.round(count));
  const lastTwo = absCount % 100;
  const lastOne = absCount % 10;

  let word: string;
  if (lastTwo >= 11 && lastTwo <= 19) {
    word = 'сессий';
  } else if (lastOne === 1) {
    word = 'сессия';
  } else if (lastOne >= 2 && lastOne <= 4) {
    word = 'сессии';
  } else {
    word = 'сессий';
  }

  return `${absCount} ${word}`;
};

/**
 * Форматирование количества дней
 * @param count - количество дней
 * @returns строка с правильным склонением
 */
export const formatDayCount = (count: number): string => {
  const absCount = Math.abs(Math.round(count));
  const lastTwo = absCount % 100;
  const lastOne = absCount % 10;

  let word: string;
  if (lastTwo >= 11 && lastTwo <= 19) {
    word = 'дней';
  } else if (lastOne === 1) {
    word = 'день';
  } else if (lastOne >= 2 && lastOne <= 4) {
    word = 'дня';
  } else {
    word = 'дней';
  }

  return `${absCount} ${word}`;
};

/**
 * Форматирование серии (streak)
 * @param streakDays - количество дней серии
 * @returns строка с описанием серии
 */
export const formatStreak = (streakDays: number): string => {
  if (streakDays <= 0) return 'Нет серии';
  return `🔥 ${formatDayCount(streakDays)} подряд`;
};

/**
 * Форматирование даты для отображения
 * @param date - дата
 * @returns отформатированная строка
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'd MMMM yyyy', { locale: ru });
};

/**
 * Краткое форматирование даты
 * @param date - дата
 * @returns краткая строка "dd.MM"
 */
export const formatDateShort = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd.MM', { locale: ru });
};

/**
 * Форматирование даты с временем
 * @param date - дата
 * @returns строка "d MMMM в HH:mm"
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, "d MMMM 'в' HH:mm", { locale: ru });
};

/**
 * Форматирование относительного времени ("5 минут назад")
 * @param date - дата
 * @returns относительная строка
 */
export const formatRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistance(d, new Date(), { addSuffix: true, locale: ru });
};

/**
 * Форматирование дня недели
 * @param date - дата
 * @returns сокращённое название дня недели
 */
export const formatDayOfWeek = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'EEEEEE', { locale: ru });
};

/**
 * Форматирование процента с знаком направления
 * @param value - значение процента
 * @returns строка с направлением
 */
export const formatPercentChange = (value: number | null | undefined): string => {
  if (value == null || isNaN(value)) return 'Нет данных';
  const rounded = Math.round(value);
  if (rounded === 0) return '0%';
  if (rounded > 0) return `+${rounded}%`;
  return `${rounded}%`;
};

/**
 * Форматирование числа с разделителями тысяч
 * @param value - числовое значение
 * @returns строка с разделителями
 */
export const formatNumber = (value: number | null | undefined): string => {
  if (value == null || isNaN(value)) return '--';
  return Math.round