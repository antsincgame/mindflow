import { format, formatDistanceToNow, isToday, isYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays, differenceInMinutes, addDays, subDays, isSameDay, parseISO, isValid } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Форматирует дату в читаемый формат
 */
export const formatDate = (date: Date | string, formatStr: string = 'dd.MM.yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  return format(dateObj, formatStr, { locale: ru });
};

/**
 * Форматирует время в формат HH:mm
 */
export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  return format(dateObj, 'HH:mm', { locale: ru });
};

/**
 * Форматирует дату и время
 */
export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  return format(dateObj, 'dd.MM.yyyy HH:mm', { locale: ru });
};

/**
 * Возвращает относительное время (например, "2 часа назад")
 */
export const getRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  
  if (isToday(dateObj)) {
    return `Сегодня в ${formatTime(dateObj)}`;
  }
  
  if (isYesterday(dateObj)) {
    return `Вчера в ${formatTime(dateObj)}`;
  }
  
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: ru });
};

/**
 * Проверяет, является ли дата сегодняшней
 */
export const isDateToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return false;
  return isToday(dateObj);
};

/**
 * Проверяет, является ли дата вчерашней
 */
export const isDateYesterday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return false;
  return isYesterday(dateObj);
};

/**
 * Возвращает начало текущей недели
 */
export const getStartOfWeek = (date: Date = new Date()): Date => {
  return startOfWeek(date, { weekStartsOn: 1 }); // Неделя начинается с понедельника
};

/**
 * Возвращает конец текущей недели
 */
export const getEndOfWeek = (date: Date = new Date()): Date => {
  return endOfWeek(date, { weekStartsOn: 1 });
};

/**
 * Возвращает начало текущего месяца
 */
export const getStartOfMonth = (date: Date = new Date()): Date => {
  return startOfMonth(date);
};

/**
 * Возвращает конец текущего месяца
 */
export const getEndOfMonth = (date: Date = new Date()): Date => {
  return endOfMonth(date);
};

/**
 * Возвращает массив дат в заданном интервале
 */
export const getDatesInRange = (startDate: Date, endDate: Date): Date[] => {
  return eachDayOfInterval({ start: startDate, end: endDate });
};

/**
 * Возвращает массив дат текущей недели
 */
export const getCurrentWeekDates = (): Date[] => {
  const start = getStartOfWeek();
  const end = getEndOfWeek();
  return getDatesInRange(start, end);
};

/**
 * Возвращает массив дат текущего месяца
 */
export const getCurrentMonthDates = (): Date[] => {
  const start = getStartOfMonth();
  const end = getEndOfMonth();
  return getDatesInRange(start, end);
};

/**
 * Возвращает разницу в днях между датами
 */
export const getDaysDifference = (date1: Date | string, date2: Date | string): number => {
  const dateObj1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const dateObj2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  
  if (!isValid(dateObj1) || !isValid(dateObj2)) return 0;
  
  return Math.abs(differenceInDays(dateObj1, dateObj2));
};

/**
 * Возвращает разницу в минутах между датами
 */
export const getMinutesDifference = (date1: Date | string, date2: Date | string): number => {
  const dateObj1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const dateObj2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  
  if (!isValid(dateObj1) || !isValid(dateObj2)) return 0;
  
  return Math.abs(differenceInMinutes(dateObj1, dateObj2));
};

/**
 * Добавляет дни к дате
 */
export const addDaysToDate = (date: Date | string, days: number): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return new Date();
  return addDays(dateObj, days);
};

/**
 * Вычитает дни из даты
 */
export const subtractDaysFromDate = (date: Date | string, days: number): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return new Date();
  return subDays(dateObj, days);
};

/**
 * Проверяет, совпадают ли две даты (без учета времени)
 */
export const isSameDate = (date1: Date | string, date2: Date | string): boolean => {
  const dateObj1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const dateObj2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  
  if (!isValid(dateObj1) || !isValid(dateObj2)) return false;
  
  return isSameDay(dateObj1, dateObj2);
};

/**
 * Форматирует длительность в минутах в читаемый формат
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} мин`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} ч`;
  }
  
  return `${hours} ч ${remainingMinutes} мин`;
};

/**
 * Форматирует секунды в формат mm:ss
 */
export const formatSeconds = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Возвращает название дня недели
 */
export const getDayName = (date: Date | string, short: boolean = false): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  
  const formatStr = short ? 'EEEEEE' : 'EEEE';
  return format(dateObj, formatStr, { locale: ru });
};

/**
 * Возвращает название месяца
 */
export const getMonthName = (date: Date | string, short: boolean = false): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  
  const formatStr = short ? 'MMM' : 'MMMM';
  return format(dateObj, formatStr, { locale: ru });
};

/**
 * Возвращает дату в формате ISO
 */
export const toISOString = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  return dateObj.toISOString();
};

/**
 * Парсит ISO строку в Date
 */
export const fromISOString = (isoString: string): Date | null => {
  const date = parseISO(isoString);
  return isValid(date) ? date : null;
};

/**
 * Возвращает массив последних N дней (включая сегодня)
 */
export const getLastNDays = (n: number): Date[] => {
  const today = new Date();
  const dates: Date[] = [];
  
  for (let i = n - 1; i >= 0; i--) {
    dates.push(subtractDaysFromDate(today, i));
  }
  
  return dates;
};

/**
 * Возвращает количество дней в месяце
 */
export const getDaysInMonth = (date: Date = new Date()): number => {
  const start = getStartOfMonth(date);
  const end = getEndOfMonth(date);
  return differenceInDays(end, start) + 1;
};

/**
 * Проверяет, является ли дата валидной
 */
export const isValidDate = (date: any): boolean => {
  if (date instanceof Date) {
    return isValid(date);
  }
  
  if (typeof date === 'string') {
    const parsed = parseISO(date);
    return isValid(parsed);
  }
  
  return false;
};

/**
 * Возвращает текущую дату без времени
 */
export const getTodayWithoutTime = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Форматирует дату для календаря (yyyy-MM-dd)
 */
export const formatCalendarDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  return format(dateObj, 'yyyy-MM-dd');
};

/**
 * Возвращает строку с датой для отображения в списке сессий
 */
export const getSessionDateLabel = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  
  if (isToday(dateObj)) {
    return 'Сегодня';
  }
  
  if (isYesterday(dateObj)) {
    return 'Вчера';
  }
  
  return format(dateObj, 'd MMMM', { locale: ru });
};

/**
 * Возвращает количество недель между датами
 */
export const getWeeksDifference = (date1: Date | string, date2: Date | string): number => {
  const days = getDaysDifference(date1, date2);
  return Math.floor(days / 7);
};

/**
 * Проверяет, находится ли дата в текущей неделе
 */
export const isInCurrentWeek = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return false;
  
  const start = getStartOfWeek();
  const end = getEndOfWeek();
  
  return dateObj >= start && dateObj <= end;
};

/**
 * Проверяет, находится ли дата в текущем месяце
 */
export const isInCurrentMonth = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return false;
  
  const start = getStartOfMonth();
  const end = getEndOfMonth();
  
  return dateObj >= start && dateObj <= end;
};

/**
 * Возвращает время суток (утро, день, вечер, ночь)
 */
export const getTimeOfDay = (date: Date = new Date()): 'morning' | 'afternoon' | 'evening' | 'night' => {
  const hour = date.getHours();
  
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
};

/**
 * Возвращает приветствие в зависимости от времени суток
 */
export const getGreeting = (): string => {
  const timeOfDay = getTimeOfDay();
  
  switch (timeOfDay) {
    case 'morning':
      return 'Доброе утро';
    case 'afternoon':
      return 'Добрый день';
    case 'evening':
      return 'Добрый вечер';
    case 'night':
      return 'Доброй ночи';
  }
};