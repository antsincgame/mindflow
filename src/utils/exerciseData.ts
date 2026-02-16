import { Exercise } from '../models/Exercise';

export const EXERCISES: Exercise[] = [
  // Упражнения для тревоги
  {
    id: 'anxiety-1',
    title: 'Дыхание 4-7-8',
    description: 'Техника глубокого дыхания для быстрого успокоения. Вдох на 4 счета, задержка на 7, выдох на 8.',
    duration: 300,
    emotionId: 'anxiety',
    difficulty: 'easy',
    category: 'breathing',
    instructions: [
      'Сядьте удобно, выпрямите спину',
      'Положите кончик языка за верхние передние зубы',
      'Полностью выдохните через рот со свистящим звуком',
      'Закройте рот и вдохните через нос на 4 счета',
      'Задержите дыхание на 7 счетов',
      'Выдохните через рот на 8 счетов со свистящим звуком',
      'Повторите цикл 3-4 раза'
    ],
    benefits: [
      'Снижает уровень кортизола',
      'Активирует парасимпатическую нервную систему',
      'Улучшает концентрацию',
      'Снижает частоту сердечных сокращений'
    ],
    targetHeartRate: { min: 60, max: 80 },
    caloriesBurned: 5,
    audioUrl: 'breathing-4-7-8.mp3',
    videoUrl: null,
    imageUrl: 'https://example.com/exercises/breathing-478.jpg',
    popularity: 95,
    completionCount: 0,
    averageRating: 4.8,
    tags: ['дыхание', 'быстрое', 'тревога', 'стресс']
  },
  {
    id: 'anxiety-2',
    title: 'Прогрессивная мышечная релаксация',
    description: 'Последовательное напряжение и расслабление групп мышц для снятия физического напряжения.',
    duration: 900,
    emotionId: 'anxiety',
    difficulty: 'medium',
    category: 'relaxation',
    instructions: [
      'Лягте на спину в удобном месте',
      'Начните с мышц стоп - напрягите на 5 секунд',
      'Резко расслабьте и почувствуйте разницу',
      'Переходите к икрам, бедрам, ягодицам',
      'Продолжайте с животом, грудью, руками',
      'Завершите мышцами лица и шеи',
      'Полежите 2 минуты в расслабленном состоянии'
    ],
    benefits: [
      'Снимает мышечное напряжение',
      'Улучшает осознание тела',
      'Помогает при бессоннице',
      'Снижает хроническую боль'
    ],
    targetHeartRate: { min: 55, max: 70 },
    caloriesBurned: 15,
    audioUrl: 'pmr-guide.mp3',
    videoUrl: 'https://example.com/videos/pmr-tutorial.mp4',
    imageUrl: 'https://example.com/exercises/pmr.jpg',
    popularity: 88,
    completionCount: 0,
    averageRating: 4.7,
    tags: ['релаксация', 'мышцы', 'напряжение', 'сон']
  },
  {
    id: 'anxiety-3',
    title: 'Заземление 5-4-3-2-1',
    description: 'Техника осознанности через органы чувств для возвращения в настоящий момент.',
    duration: 420,
    emotionId: 'anxiety',
    difficulty: 'easy',
    category: 'mindfulness',
    instructions: [
      'Остановитесь и сделайте глубокий вдох',
      'Назовите 5 вещей, которые вы видите',
      'Назовите 4 вещи, которые вы можете потрогать',
      'Назовите 3 звука, которые вы слышите',
      'Назовите 2 запаха, которые вы чувствуете',
      'Назовите 1 вкус во рту',
      'Сделайте еще один глубокий вдох'
    ],
    benefits: [
      'Быстро останавливает панику',
      'Возвращает в настоящий момент',
      'Отвлекает от тревожных мыслей',
      'Можно делать где угодно'
    ],
    targetHeartRate: { min: 65, max: 85 },
    caloriesBurned: 3,
    audioUrl: 'grounding-5-4-3-2-1.mp3',
    videoUrl: null,
    imageUrl: 'https://example.com/exercises/grounding.jpg',
    popularity: 92,
    completionCount: 0,
    averageRating: 4.9,
    tags: ['осознанность', 'паника', 'быстрое', 'заземление']
  },

  // Упражнения для гнева
  {
    id: 'anger-1',
    title: 'Дыхание огня',
    description: 'Энергичная дыхательная техника для быстрого выброса гнева через контролируемое дыхание.',
    duration: 180,
    emotionId: 'anger',
    difficulty: 'medium',
    category: 'breathing',
    instructions: [
      'Сядьте с прямой спиной',
      'Сделайте глубокий вдох',
      'Начните быстрые выдохи через нос',
      'Вдохи происходят автоматически',
      'Делайте 30 секунд, затем пауза',
      'Повторите 3 раза',
      'Закончите медленным глубоким дыханием'
    ],
    benefits: [
      'Быстро снижает агрессию',
      'Повышает энергию',
      'Очищает разум',
      'Укрепляет диафрагму'
    ],
    targetHeartRate: { min: 80, max: 110 },
    caloriesBurned: 10,
    audioUrl: 'breath-of-fire.mp3',
    videoUrl: 'https://example.com/videos/breath-of-fire.mp4',
    imageUrl: 'https://example.com/exercises/breath-fire.jpg',
    popularity: 78,
    completionCount: 0,
    averageRating: 4.5,
    tags: ['дыхание', 'энергия', 'гнев', 'быстрое']
  },
  {
    id: 'anger-2',
    title: 'Физическая разрядка',
    description: 'Интенсивные физические упражнения для безопасного выброса гнева.',
    duration: 600,
    emotionId: 'anger',
    difficulty: 'hard',
    category: 'physical',
    instructions: [
      'Найдите безопасное пространство',
      'Начните с прыжков на месте (1 минута)',
      'Переходите к берпи (2 минуты)',
      'Делайте удары по воздуху (2 минуты)',
      'Приседания с прыжком (2 минуты)',
      'Планка (1 минута)',
      'Растяжка и глубокое дыхание (2 минуты)'
    ],
    benefits: [
      'Выброс адреналина',
      'Физическая разрядка',
      'Улучшение настроения',
      'Снижение агрессии'
    ],
    targetHeartRate: { min: 120, max: 160 },
    caloriesBurned: 80,
    audioUrl: 'intense-workout.mp3',
    videoUrl: 'https://example.com/videos/anger-workout.mp4',
    imageUrl: 'https://example.com/exercises/physical-release.jpg',
    popularity: 85,
    completionCount: 0,
    averageRating: 4.6,
    tags: ['физические', 'интенсив', 'разрядка', 'энергия']
  },
  {
    id: 'anger-3',
    title: 'Визуализация облака гнева',
    description: 'Ментальная техника представления гнева как облака, которое растворяется.',
    duration: 480,
    emotionId: 'anger',
    difficulty: 'medium',
    category: 'visualization',
    instructions: [
      'Сядьте удобно и закройте глаза',
      'Представьте свой гнев как темное облако',
      'Визуализируйте его цвет, форму, размер',
      'Представьте, как ветер начинает его рассеивать',
      'Облако становится светлее и меньше',
      'Наблюдайте, как оно полностью растворяется',
      'Почувствуйте легкость и спокойствие'
    ],
    benefits: [
      'Дистанцирование от эмоции',
      'Развитие воображения',
      'Когнитивная переработка',
      'Эмоциональная регуляция'
    ],
    targetHeartRate: { min: 60, max: 75 },
    caloriesBurned: 5,
    audioUrl: 'anger-cloud-visualization.mp3',
    videoUrl: null,
    imageUrl: 'https://example.com/exercises/cloud-visualization.jpg',
    popularity: 73,
    completionCount: 0,
    averageRating: 4.4,
    tags: ['визуализация', 'медитация', 'когнитивное', 'спокойствие']
  },

  // Упражнения для грусти
  {
    id: 'sadness-1',
    title: 'Любящая доброта медитация',
    description: 'Медитация на развитие сострадания к себе и другим для поднятия настроения.',
    duration: 720,
    emotionId: 'sadness',
    difficulty: 'easy',
    category: 'meditation',
    instructions: [
      'Сядьте удобно, закройте глаза',
      'Положите руку на сердце',
      'Повторяйте: "Пусть я буду счастлив"',
      'Повторяйте: "Пусть я буду здоров"',
      'Повторяйте: "Пусть я буду в безопасности"',
      'Распространите пожелания на близких',
      'Затем на всех живых существ'
    ],
    benefits: [
      'Повышает самосострадание',
      'Улучшает настроение',
      'Снижает самокритику',
      'Развивает эмпатию'
    ],
    targetHeartRate: { min: 55, max: 70 },
    caloriesBurned: 8,
    audioUrl: 'loving-kindness.mp3',
    videoUrl: null,
    imageUrl: 'https://example.com/exercises/loving-kindness.jpg',
    popularity: 82,
    completionCount: 0,
    averageRating: 4.7,
    tags: ['медитация', 'сострадание', 'любовь', 'грусть']
  },
  {
    id: 'sadness-2',
    title: 'Дневник благодарности',
    description: 'Практика записи трех вещей, за которые вы благодарны сегодня.',
    duration: 300,
    emotionId: 'sadness',
    difficulty: 'easy',
    category: 'cognitive',
    instructions: [
      'Возьмите блокнот или телефон',
      'Подумайте о прошедшем дне',
      'Запишите 3 вещи, за которые благодарны',
      'Это могут быть мелочи',
      'Опишите, почему это важно',
      'Перечитайте написанное',
      'Почувствуйте благодарность'
    ],
    benefits: [
      'Переключает фокус на позитив',
      'Улучшает настроение',
      'Развивает оптимизм',
      'Помогает при депрессии'
    ],
    targetHeartRate: { min: 60, max: 75 },
    caloriesBurned: 2,
    audioUrl: null,
    videoUrl: null,
    imageUrl: 'https://example.com/exercises/gratitude-journal.jpg',
    popularity: 90,
    completionCount: 0,
    averageRating: 4.8,
    tags: ['благодарность', 'письмо', 'позитив', 'дневник']
  },
  {
    id: 'sadness-3',
    title: 'Танцевальная терапия',
    description: 'Свободное движение под музыку для выражения и трансформации грусти.',
    duration: 600,
    emotionId: 'sadness',
    difficulty: 'medium',
    category: 'physical',
    instructions: [
      'Выберите музыку, которая резонирует',
      'Начните с медленных движений',
      'Позвольте телу двигаться свободно',
      'Выражайте эмоции через движение',
      'Постепенно увеличивайте интенсивность',
      'Танцуйте, пока не почувствуете легкость',
      'Закончите растяжкой'
    ],
    benefits: [
      'Выброс эндорфинов',
      'Эмоциональное выражение',
      'Улучшение настроения',
      'Физическая активность'
    ],
    targetHeartRate: { min: 90, max: 130 },
    caloriesBurned: 60,
    audioUrl: 'uplifting-music.mp3',
    videoUrl: 'https://example.com/videos/dance-therapy.mp4',
    imageUrl: 'https://example.com/exercises/dance-therapy.jpg',
    popularity: 76,
    completionCount: 0,
    averageRating: 4.5,
    tags: ['танец', 'движение', 'музыка', 'эндорфины']
  },

  // Упражнения для стресса
  {
    id: 'stress-1',
    title: 'Сканирование