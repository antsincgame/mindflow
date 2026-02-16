export interface EmotionData {
  id: string;
  name: string;
  description: string;
  color: string;
  gradient: [string, string];
  icon: string;
  intensity: 'low' | 'medium' | 'high';
  category: 'positive' | 'negative' | 'neutral';
  relatedEmotions: string[];
  triggers: string[];
  physicalSymptoms: string[];
  mentalSymptoms: string[];
  recommendedExercises: string[];
}

export const EMOTIONS: EmotionData[] = [
  {
    id: 'anxiety',
    name: 'Тревога',
    description: 'Чувство беспокойства, волнения или страха',
    color: '#FF6B6B',
    gradient: ['#FF6B6B', '#FF8E8E'],
    icon: '😰',
    intensity: 'high',
    category: 'negative',
    relatedEmotions: ['stress', 'fear', 'worry'],
    triggers: [
      'Неопределенность',
      'Важные события',
      'Конфликты',
      'Перегрузка информацией',
      'Дедлайны'
    ],
    physicalSymptoms: [
      'Учащенное сердцебиение',
      'Потливость',
      'Напряжение мышц',
      'Поверхностное дыхание',
      'Дрожь'
    ],
    mentalSymptoms: [
      'Беспокойные мысли',
      'Трудности с концентрацией',
      'Предчувствие опасности',
      'Раздражительность'
    ],
    recommendedExercises: ['breathing-4-7-8', 'body-scan', 'grounding-5-4-3-2-1', 'progressive-relaxation']
  },
  {
    id: 'stress',
    name: 'Стресс',
    description: 'Состояние эмоционального или физического напряжения',
    color: '#FF8C42',
    gradient: ['#FF8C42', '#FFB366'],
    icon: '😣',
    intensity: 'high',
    category: 'negative',
    relatedEmotions: ['anxiety', 'overwhelm', 'tension'],
    triggers: [
      'Рабочая нагрузка',
      'Конфликты в отношениях',
      'Финансовые проблемы',
      'Нехватка времени',
      'Многозадачность'
    ],
    physicalSymptoms: [
      'Головная боль',
      'Напряжение в плечах',
      'Усталость',
      'Проблемы со сном',
      'Изменение аппетита'
    ],
    mentalSymptoms: [
      'Перегруженность',
      'Трудности с решениями',
      'Забывчивость',
      'Негативные мысли'
    ],
    recommendedExercises: ['box-breathing', 'body-scan', 'mindful-walking', 'quick-reset']
  },
  {
    id: 'sadness',
    name: 'Грусть',
    description: 'Чувство печали, уныния или подавленности',
    color: '#4A90E2',
    gradient: ['#4A90E2', '#6BA3E8'],
    icon: '😢',
    intensity: 'medium',
    category: 'negative',
    relatedEmotions: ['loneliness', 'disappointment', 'grief'],
    triggers: [
      'Потеря',
      'Разочарование',
      'Одиночество',
      'Неудачи',
      'Воспоминания'
    ],
    physicalSymptoms: [
      'Низкая энергия',
      'Тяжесть в груди',
      'Слезы',
      'Замедленные движения',
      'Потеря аппетита'
    ],
    mentalSymptoms: [
      'Мрачные мысли',
      'Потеря интереса',
      'Чувство безнадежности',
      'Самокритика'
    ],
    recommendedExercises: ['self-compassion', 'gratitude-meditation', 'gentle-movement', 'loving-kindness']
  },
  {
    id: 'anger',
    name: 'Гнев',
    description: 'Чувство раздражения, злости или ярости',
    color: '#E74C3C',
    gradient: ['#E74C3C', '#EC7063'],
    icon: '😡',
    intensity: 'high',
    category: 'negative',
    relatedEmotions: ['frustration', 'irritation', 'rage'],
    triggers: [
      'Несправедливость',
      'Нарушение границ',
      'Препятствия',
      'Критика',
      'Предательство'
    ],
    physicalSymptoms: [
      'Учащенный пульс',
      'Покраснение лица',
      'Сжатые кулаки',
      'Напряжение челюсти',
      'Повышенная температура'
    ],
    mentalSymptoms: [
      'Агрессивные мысли',
      'Желание конфронтации',
      'Туннельное мышление',
      'Импульсивность'
    ],
    recommendedExercises: ['cooling-breath', 'anger-release', 'grounding-5-4-3-2-1', 'progressive-relaxation']
  },
  {
    id: 'fear',
    name: 'Страх',
    description: 'Чувство опасности или угрозы',
    color: '#9B59B6',
    gradient: ['#9B59B6', '#B07CC6'],
    icon: '😨',
    intensity: 'high',
    category: 'negative',
    relatedEmotions: ['anxiety', 'panic', 'dread'],
    triggers: [
      'Опасные ситуации',
      'Неизвестность',
      'Угроза безопасности',
      'Фобии',
      'Травматические воспоминания'
    ],
    physicalSymptoms: [
      'Учащенное дыхание',
      'Дрожь',
      'Холодный пот',
      'Расширенные зрачки',
      'Желание убежать'
    ],
    mentalSymptoms: [
      'Катастрофизация',
      'Гиперчувствительность',
      'Паника',
      'Замирание'
    ],
    recommendedExercises: ['grounding-5-4-3-2-1', 'safe-place-visualization', 'breathing-4-7-8', 'body-scan']
  },
  {
    id: 'overwhelm',
    name: 'Перегрузка',
    description: 'Чувство, что всё слишком много',
    color: '#34495E',
    gradient: ['#34495E', '#5D6D7E'],
    icon: '😵',
    intensity: 'high',
    category: 'negative',
    relatedEmotions: ['stress', 'anxiety', 'exhaustion'],
    triggers: [
      'Множество задач',
      'Информационная перегрузка',
      'Высокие ожидания',
      'Недостаток ресурсов',
      'Постоянные требования'
    ],
    physicalSymptoms: [
      'Умственная усталость',
      'Головокружение',
      'Напряжение',
      'Истощение',
      'Проблемы с фокусом'
    ],
    mentalSymptoms: [
      'Ментальный туман',
      'Невозможность принять решение',
      'Чувство беспомощности',
      'Желание сбежать'
    ],
    recommendedExercises: ['quick-reset', 'box-breathing', 'mindful-pause', 'body-scan']
  },
  {
    id: 'loneliness',
    name: 'Одиночество',
    description: 'Чувство изоляции и отсутствия связи',
    color: '#7F8C8D',
    gradient: ['#7F8C8D', '#95A5A6'],
    icon: '😔',
    intensity: 'medium',
    category: 'negative',
    relatedEmotions: ['sadness', 'isolation', 'emptiness'],
    triggers: [
      'Отсутствие близких',
      'Социальная изоляция',
      'Непонимание',
      'Разрыв отношений',
      'Переезд'
    ],
    physicalSymptoms: [
      'Тяжесть в груди',
      'Низкая энергия',
      'Нарушение сна',
      'Потеря аппетита',
      'Физическая боль'
    ],
    mentalSymptoms: [
      'Чувство отверженности',
      'Низкая самооценка',
      'Тоска',
      'Желание связи'
    ],
    recommendedExercises: ['loving-kindness', 'self-compassion', 'connection-meditation', 'gratitude-meditation']
  },
  {
    id: 'frustration',
    name: 'Фрустрация',
    description: 'Чувство разочарования от препятствий',
    color: '#E67E22',
    gradient: ['#E67E22', '#F39C12'],
    icon: '😤',
    intensity: 'medium',
    category: 'negative',
    relatedEmotions: ['anger', 'irritation', 'disappointment'],
    triggers: [
      'Препятствия к цели',
      'Повторяющиеся проблемы',
      'Непонимание',
      'Технические сбои',
      'Медленный прогресс'
    ],
    physicalSymptoms: [
      'Напряжение',
      'Сжатые зубы',
      'Беспокойство',
      'Учащенное дыхание',
      'Импульсивные движения'
    ],
    mentalSymptoms: [
      'Нетерпение',
      'Раздражение',
      'Чувство застревания',
      'Критические мысли'
    ],
    recommendedExercises: ['cooling-breath', 'mindful-pause', 'acceptance-meditation', 'progressive-relaxation']
  },
  {
    id: 'calm',
    name: 'Спокойствие',
    description: 'Состояние умиротворения и баланса',
    color: '#1ABC9C',
    gradient: ['#1ABC9C', '#48C9B0'],
    icon: '😌',
    intensity: 'low',
    category: 'positive',
    relatedEmotions: ['peace', 'serenity', 'balance'],
    triggers: [
      'Медитация',
      'Природа',
      'Тишина',
      'Завершение задач',
      'Безопасность'
    ],
    physicalSymptoms: [
      'Расслабленные мышцы',
      'Ровное дыхание',
      'Спокойный пульс',
      'Комфорт',
      'Легкость'
    ],
    mentalSymptoms: [
      'Ясность ума',
      'Присутствие',
      'Принятие',
      'Внутренний покой'
    ],
    recommendedExercises: ['mindfulness-meditation', 'breath-awareness', 'body-scan', 'gratitude-meditation']
  },
  {
    id: 'joy',
    name: 'Радость',
    description: 'Чувство счастья и удовольствия',
    color: '#F1C40F',
    gradient: ['#F1C40F', '#F4D03F'],
    icon: '😊',
    intensity: 'medium',
    category: 'positive',
    relatedEmotions: ['happiness', 'delight', 'contentment'],
    triggers: [
      'Приятные события',
      'Достижения',
      'Время с близкими',
      'Хорошие новости',
      'Творчество'
    ],
    physicalSymptoms: [
      'Улыбка',
      'Легкость',
      'Энергия',
      'Открытая поза',
      'Теплота'
    ],
    mentalSymptoms: [
      'Оптимизм',
      'Благодарность',
      'Энтузиазм',
      'Позитивные мысли'
    ],
    recommendedExercises: ['gratitude-meditation', 'joy-cultivation', 'loving-kindness', 'celebration-practice']
  },
  {
    id: 'confidence',
    name: 'Уверенность',
    description: 'Чувство силы и способности',
    color: '#3498DB',
    gradient: ['#3498DB', '#5DADE2'],
    icon: '😎',
    intensity: 'medium',
    category: 'positive',
    relatedEmotions: ['empowerment', 'strength', 'self-assurance'],
    triggers: [
      'Успехи',
      'Признание',
      'Преодоление вызовов',
      'Поддержка',
      'Подготовка'
    ],
    physicalSymptoms: [
      'Прямая осанка',
      'Уверенные движения',
      'Ровное дыхание',
      'Расслабленность',
      'Сила'
    ],
    mentalSymptoms: [
      'Вера в себя',
      'Решительность',
      'Ясность целей',
      'Позитивное самовосприятие'
    ],
    recommendedExercises: ['power-pose', 'affirmations', 'visualization', 'strength-meditation']
  },
  {
    id: 'gratitude',
    name: 'Благодарность',
    description: 'Чувство признательности и ценности',
    color: '#27AE60',
    gradient: ['#27AE60', '#52BE80'],
    icon: '🙏',
    intensity: 'low',
    category: 'positive',
    relatedEmotions: ['appreciation', 'thankfulness', 'contentment'],
    triggers: [
      'Помощь других',
      'Простые радости',
      'Осознанность',
      'Достижения',
      'Любовь'
    ],
    physicalSymptoms: [
      'Теплота в груди',
      'Расслабление',
      'Улыбка',
      'Открытость',
      'Легкость'
    ],
    mentalSymptoms: [
      'Позитивный фокус',
      'Ценность момента',