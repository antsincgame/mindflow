export interface Emotion {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const EMOTIONS: Record<string, Emotion> = {
  sadness: {
    id: 'sadness',
    name: 'Грусть',
    icon: '😔',
    color: '#6B7FD7',
    description: 'Чувство печали, тоски или уныния',
  },
  stress: {
    id: 'stress',
    name: 'Стресс',
    icon: '😰',
    color: '#E74C3C',
    description: 'Напряжение, перегрузка, давление',
  },
  anxiety: {
    id: 'anxiety',
    name: 'Беспокойство',
    icon: '😟',
    color: '#F39C12',
    description: 'Тревога, волнение',
  },
  calm: {
    id: 'calm',
    name: 'Спокойствие',
    icon: '😌',
    color: '#3498DB',
    description: 'Умиротворение и покой',
  },
};