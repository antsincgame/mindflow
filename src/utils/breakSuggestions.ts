export interface BreakSuggestion {
  id: string;
  title: string;
  description: string;
  duration: number;
  icon: string;
  category: 'physical' | 'mental' | 'hydration' | 'nutrition' | 'social';
  difficulty: 'easy' | 'medium' | 'hard';
}

export const breakSuggestions: BreakSuggestion[] = [
  {
    id: 'water-drink',
    title: 'Пить воду',
    description: 'Выпей стакан воды для гидратации организма',
    duration: 2,
    icon: '💧',
    category: 'hydration',
    difficulty: 'easy',
  },
  {
    id: 'stretch-neck',
    title: 'Растяжка шеи',
    description: 'Медленно поворачивай голову влево-вправо, наклоняй вперед-назад',
    duration: 3,
    icon: '🧘',
    category: 'physical',
    difficulty: 'easy',
  },
  {
    id: 'stretch-shoulders',
    title: 'Растяжка плеч',
    description: 'Круговые движения плечами и растяжка мышц спины',
    duration: 3,
    icon: '🤸',
    category: 'physical',
    difficulty: 'easy',
  },
  {
    id: 'walk',
    title: 'Прогулка',
    description: 'Прогулись по комнате или на улицу для свежего воздуха',
    duration: 5,
    icon: '🚶',
    category: 'physical',
    difficulty: 'medium',
  },
  {
    id: 'deep-breathing',
    title: 'Глубокое дыхание',
    description: 'Выполни 5-10 глубоких вдохов и выдохов для релаксации',
    duration: 2,
    icon: '🌬️',
    category: 'mental',
    difficulty: 'easy',
  },
  {
    id: 'meditation',
    title: 'Медитация',
    description: 'Закрой глаза и медитируй 3-5 минут для успокоения ума',
    duration: 5,
    icon: '🧘‍♀️',
    category: 'mental',
    difficulty: 'medium',
  },
  {
    id: 'eye-rest',
    title: 'Отдых для глаз',
    description: 'Посмотри в окно на дальние объекты или закрой глаза на минуту',
    duration: 2,
    icon: '👀',
    category: 'mental',
    difficulty: 'easy',
  },
  {
    id: 'snack',
    title: 'Перекус',
    description: 'Съешь здоровый перекус: фрукты, орехи или йогурт',
    duration: 5,
    icon: '🍎',
    category: 'nutrition',
    difficulty: 'easy',
  },
  {
    id: 'tea-coffee',
    title: 'Чай или кофе',
    description: 'Приготовь и выпей чашку любимого напитка',
    duration: 5,
    icon: '☕',
    category: 'nutrition',
    difficulty: 'easy',
  },
  {
    id: 'stretching-full',
    title: 'Полная растяжка',
    description: 'Выполни комплекс упражнений на растяжку всего тела',
    duration: 5,
    icon: '🤾',
    category: 'physical',
    difficulty: 'medium',
  },
  {
    id: 'push-ups',
    title: 'Отжимания',
    description: 'Сделай несколько отжиманий для активизации мышц',
    duration: 3,
    icon: '💪',
    category: 'physical',
    difficulty: 'hard',
  },
  {
    id: 'jumping-jacks',
    title: 'Прыжки',
    description: 'Выполни прыжки с разведением рук и ног',
    duration: 3,
    icon: '🏃',
    category: 'physical',
    difficulty: 'hard',
  },
  {
    id: 'music',
    title: 'Музыка',
    description: 'Послушай свою любимую музыку для поднятия настроения',
    duration: 5,
    icon: '🎵',
    category: 'mental',
    difficulty: 'easy',
  },
  {
    id: 'call-friend',
    title: 'Позвони другу',
    description: 'Кратко позвони или напиши сообщение другу',
    duration: 5,
    icon: '📞',
    category: 'social',
    difficulty: 'medium',
  },
  {
    id: 'window-view',
    title: 'Вид из окна',
    description: 'Посмотри в окно и насладись видом природы',
    duration: 3,
    icon: '🪟',
    category: 'mental',
    difficulty: 'easy',
  },
  {
    id: 'journal',
    title: 'Дневник',
    description: 'Запиши свои мысли и ощущения в дневник',
    duration: 5,
    icon: '📝',
    category: 'mental',
    difficulty: 'medium',
  },
  {
    id: 'face-wash',
    title: 'Умойся',
    description: 'Умойся холодной водой для бодрости',
    duration: 3,
    icon: '🚿',
    category: 'physical',
    difficulty: 'easy',
  },
  {
    id: 'yoga',
    title: 'Йога',
    description: 'Выполни несколько простых поз йоги для растяжки',
    duration: 5,
    icon: '🧘‍♂️',
    category: 'physical',
    difficulty: 'medium',
  },
];

export const getRandomBreakSuggestion = (): BreakSuggestion => {
  return breakSuggestions[Math.floor(Math.random() * breakSuggestions.length)];
};

export const getBreakSuggestionsByCategory = (
  category: BreakSuggestion['category'],
): BreakSuggestion[] => {
  return breakSuggestions.filter((suggestion) => suggestion.category === category);
};

export const getBreakSuggestionsByDifficulty = (
  difficulty: BreakSuggestion['difficulty'],
): BreakSuggestion[] => {
  return breakSuggestions.filter((suggestion) => suggestion.difficulty === difficulty);
};

export const getRandomBreakSuggestionsByCategory = (
  category: BreakSuggestion['category'],
): BreakSuggestion => {
  const filtered = getBreakSuggestionsByCategory(category);
  return filtered[Math.floor(Math.random() * filtered.length)];
};

export const getMultipleRandomBreakSuggestions = (count: number): BreakSuggestion[] => {
  const suggestions: BreakSuggestion[] = [];
  const availableSuggestions = [...breakSuggestions];

  for (let i = 0; i < Math.min(count, availableSuggestions.length); i++) {
    const randomIndex = Math.floor(Math.random() * availableSuggestions.length);
    suggestions.push(availableSuggestions[randomIndex]);
    availableSuggestions.splice(randomIndex, 1);
  }

  return suggestions;
};