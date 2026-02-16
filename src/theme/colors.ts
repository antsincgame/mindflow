const colors = {
  primary: {
    main: '#6366F1',
    light: '#818CF8',
    dark: '#4F46E5',
    lighter: '#E0E7FF',
  },
  secondary: {
    main: '#8B5CF6',
    light: '#A78BFA',
    dark: '#7C3AED',
    lighter: '#F3E8FF',
  },
  accent: {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    dark: '#111827',
  },
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    light: '#D1D5DB',
    inverse: '#FFFFFF',
  },
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
  },
  status: {
    active: '#10B981',
    paused: '#F59E0B',
    stopped: '#EF4444',
    idle: '#6B7280',
  },
  gradient: {
    primary: ['#6366F1', '#8B5CF6'],
    success: ['#10B981', '#059669'],
    warning: ['#F59E0B', '#D97706'],
    danger: ['#EF4444', '#DC2626'],
  },
  overlay: {
    light: 'rgba(0, 0, 0, 0.3)',
    medium: 'rgba(0, 0, 0, 0.5)',
    dark: 'rgba(0, 0, 0, 0.7)',
  },
  timer: {
    background: '#1F2937',
    text: '#FFFFFF',
    accent: '#6366F1',
  },
  achievement: {
    gold: '#FCD34D',
    silver: '#D1D5DB',
    bronze: '#D97706',
    platinum: '#E0E7FF',
  },
  chart: {
    line1: '#6366F1',
    line2: '#8B5CF6',
    line3: '#EC4899',
    bar1: '#10B981',
    bar2: '#3B82F6',
  },
} as const;

export default colors;