import { Exercise } from '../models/Exercise';

export const EXERCISES: Record<string, Exercise[]> = {
  stress: [
    {
      id: 'breathing-4-7-8',
      title: '4-7-8 Дыхание',
      description: 'Техника глубокого дыхания для быстрого снятия стресса',
      duration: 300,
      difficulty: 'beginner',
      category: 'breathing',
      instructions: ['Сядьте в удобное положение', 'Вдохните через нос на 4 счета'],
      benefits: ['Снижает уровень стресса', 'Успокаивает нервную систему'],
      emotionTags: ['stress', 'anxiety'],
      icon: '🫁',
      color: '#4A90E2',
    },
  ],
  anxiety: [],
  sadness: [],
  fatigue: [],
};