import { format, startOfWeek, endOfWeek, startOfDay, endOfDay, addDays, subDays, differenceInMinutes, differenceInHours, differenceInDays, isToday, isTomorrow, isYesterday, startOfMonth, endOfMonth, eachDayOfInterval, getDay, getHour, setHours, setMinutes, parseISO, isWithinInterval, addMinutes, addHours, isSameDay, isSameWeek, isSameMonth, startOfYear, endOfYear } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Форматирует дату в строку по заданному формату
 */
export const formatDate = (date: Date | number, formatString: string = 'dd.MM.yyyy'): string => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  return format(dateObj, formatString, { locale: ru });
};

/**
 * Форматирует время в строку HH:mm
 */
export const formatTime = (date: Date | number): string => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  return format(dateObj, 'HH:mm', { locale: ru });
};

/**
 * Форматирует дату и время
 */
export const formatDateTime = (date: Date | number): string => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  return format(dateObj, 'dd.MM.yyyy HH:mm', { locale: ru });
};

/**
 * Форматирует дату в относительном формате (Сегодня, Вчера, Завтра)
 */
export const formatRelativeDate = (date: Date | number): string => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  
  if (isToday(dateObj)) {
    return 'Сегодня';
  }
  if (isTomorrow(dateObj)) {
    return 'Завтра';
  }
  if (isYesterday(dateObj)) {
    return 'Вчера';
  }
  
  return format(dateObj, 'd MMMM', { locale: ru });
};

/**
 * Форматирует дату с временем в относительном формате
 */
export const formatRelativeDateTime = (date: Date | number): string => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  const relativeDate = formatRelativeDate(dateObj);
  const time = formatTime(dateObj);
  
  return `${relativeDate}, ${time}`;
};

/**
 * Форматирует день недели
 */
export const formatDayOfWeek = (date: Date | number, short: boolean = false): string => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  return format(dateObj, short ? 'EEEEEE' : 'EEEE', { locale: ru });
};

/**
 * Получает начало недели
 */
export const getWeekStart = (date: Date | number = new Date()): Date => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  return startOfWeek(dateObj, { weekStartsOn: 1 }); // Неделя начинается с понедельника
};

/**
 * Получает конец недели
 */
export const getWeekEnd = (date: Date | number = new Date()): Date => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  return endOfWeek(dateObj, { weekStartsOn: 1 });
};

/**
 * Получает начало дня
 */
export const getDayStart = (date: Date | number = new Date()): Date => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  return startOfDay(dateObj);
};

/**
 * Получает конец дня
 */
export const getDayEnd = (date: Date | number = new Date()): Date => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  return endOfDay(dateObj);
};

/**
 * Получает начало месяца
 */
export const getMonthStart = (date: Date | number = new Date()): Date => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  return startOfMonth(dateObj);
};

/**
 * Получает конец месяца
 */
export const getMonthEnd = (date: Date | number = new Date()): Date => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  return endOfMonth(dateObj);
};

/**
 * Получает начало года
 */
export const getYearStart = (date: Date | number = new Date()): Date => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  return startOfYear(dateObj);
};

/**
 * Получает конец года
 */
export const getYearEnd = (date: Date | number = new Date()): Date => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  return endOfYear(dateObj);
};

/**
 * Получает массив дат для недели
 */
export const getWeekDays = (date: Date | number = new Date()): Date[] => {
  const start = getWeekStart(date);
  const end = getWeekEnd(date);
  return eachDayOfInterval({ start, end });
};

/**
 * Получает массив дат для месяца
 */
export const getMonthDays = (date: Date | number = new Date()): Date[] => {
  const start = getMonthStart(date);
  const end = getMonthEnd(date);
  return eachDayOfInterval({ start, end });
};

/**
 * Добавляет дни к дате
 */
export const addDaysToDate = (date: Date | number, days: number): Date => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  return addDays(dateObj, days);
};

/**
 * Вычитает дни из даты
 */
export const subtractDaysFromDate = (date: Date | number, days: number): Date => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  return subDays(dateObj, days);
};

/**
 * Добавляет минуты к дате
 */
export const addMinutesToDate = (date: Date | number, minutes: number): Date => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  return addMinutes(dateObj, minutes);
};

/**
 * Добавляет часы к дате
 */
export const addHoursToDate = (date: Date | number, hours: number): Date => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  return addHours(dateObj, hours);
};

/**
 * Вычисляет разницу в минутах между двумя датами
 */
export const getMinutesDifference = (dateLeft: Date | number, dateRight: Date | number): number => {
  const left = typeof dateLeft === 'number' ? new Date(dateLeft * 1000) : dateLeft;
  const right = typeof dateRight === 'number' ? new Date(dateRight * 1000) : dateRight;
  return differenceInMinutes(left, right);
};

/**
 * Вычисляет разницу в часах между двумя датами
 */
export const getHoursDifference = (dateLeft: Date | number, dateRight: Date | number): number => {
  const left = typeof dateLeft === 'number' ? new Date(dateLeft * 1000) : dateLeft;
  const right = typeof dateRight === 'number' ? new Date(dateRight * 1000) : dateRight;
  return differenceInHours(left, right);
};

/**
 * Вычисляет разницу в днях между двумя датами
 */
export const getDaysDifference = (dateLeft: Date | number, dateRight: Date | number): number => {
  const left = typeof dateLeft === 'number' ? new Date(dateLeft * 1000) : dateLeft;
  const right = typeof dateRight === 'number' ? new Date(dateRight * 1000) : dateRight;
  return differenceInDays(left, right);
};

/**
 * Проверяет, является ли дата сегодняшней
 */
export const isDateToday = (date: Date | number): boolean => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  return isToday(dateObj);
};

/**
 * Проверяет, является ли дата завтрашней
 */
export const isDateTomorrow = (date: Date | number): boolean => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  return isTomorrow(dateObj);
};

/**
 * Проверяет, является ли дата вчерашней
 */
export const isDateYesterday = (date: Date | number): boolean => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  return isYesterday(dateObj);
};

/**
 * Проверяет, совпадают ли два дня
 */
export const areSameDay = (dateLeft: Date | number, dateRight: Date | number): boolean => {
  const left = typeof dateLeft === 'number' ? new Date(dateLeft * 1000) : dateLeft;
  const right = typeof dateRight === 'number' ? new Date(dateRight * 1000) : dateRight;
  return isSameDay(left, right);
};

/**
 * Проверяет, находятся ли даты в одной неделе
 */
export const areSameWeek = (dateLeft: Date | number, dateRight: Date | number): boolean => {
  const left = typeof dateLeft === 'number' ? new Date(dateLeft * 1000) : dateLeft;
  const right = typeof dateRight === 'number' ? new Date(dateRight * 1000) : dateRight;
  return isSameWeek(left, right, { weekStartsOn: 1 });
};

/**
 * Проверяет, находятся ли даты в одном месяце
 */
export const areSameMonth = (dateLeft: Date | number, dateRight: Date | number): boolean => {
  const left = typeof dateLeft === 'number' ? new Date(dateLeft * 1000) : dateLeft;
  const right = typeof dateRight === 'number' ? new Date(dateRight * 1000) : dateRight;
  return isSameMonth(left, right);
};

/**
 * Получает день недели (0 - воскресенье, 6 - суббота)
 */
export const getDayOfWeek = (date: Date | number): number => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  return getDay(dateObj);
};

/**
 * Получает час дня (0-23)
 */
export const getHourOfDay = (date: Date | number): number => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  return getHour(dateObj);
};

/**
 * Устанавливает час и минуты для даты
 */
export const setTimeToDate = (date: Date | number, hours: number, minutes: number = 0): Date => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  let result = setHours(dateObj, hours);
  result = setMinutes(result, minutes);
  return result;
};

/**
 * Парсит ISO строку в дату
 */
export const parseISOString = (isoString: string): Date => {
  return parseISO(isoString);
};

/**
 * Проверяет, находится ли дата в интервале
 */
export const isDateWithinInterval = (date: Date | number, start: Date | number, end: Date | number): boolean => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  const startObj = typeof start === 'number' ? new Date(start * 1000) : start;
  const endObj = typeof end === 'number' ? new Date(end * 1000) : end;
  
  return isWithinInterval(dateObj, { start: startObj, end: endObj });
};

/**
 * Конвертирует дату в Unix timestamp (секунды)
 */
export const toUnixTimestamp = (date: Date | number): number => {
  const dateObj = typeof date === 'number' ? date : Math.floor(date.getTime() / 1000);
  return dateObj;
};

/**
 * Конвертирует Unix timestamp в дату
 */
export const fromUnixTimestamp = (timestamp: number): Date => {
  return new Date(timestamp * 1000);
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
 * Получает временные слоты для дня (каждые N минут)
 */
export const getDayTimeSlots = (date: Date | number, intervalMinutes: number = 30): Date[] => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  const start = getDayStart(dateObj);
  const end = getDayEnd(dateObj);
  
  const slots: Date[] = [];
  let current = start;
  
  while (current <= end) {
    slots.push(current);
    current = addMinutes(current, intervalMinutes);
  }
  
  return slots;
};

/**
 * Получает рабочие часы (9:00 - 18:00)
 */
export const getWorkingHours = (date: Date | number): { start: Date; end: Date } => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  const start = setTimeToDate(dateObj, 9, 0);
  const end = setTimeToDate(dateObj, 18, 0);
  
  return { start, end };
};

/**
 * Проверяет, является ли время рабочим
 */
export const isWorkingHour = (date: Date | number): boolean => {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;
  const hour = getHourOfDay(dateObj);
  return hour >= 9