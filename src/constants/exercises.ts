import { Exercise } from '../models/Exercise';

export const EXERCISES: Record<string, Exercise[]> = {
  stress: [
    {
      id: 'breathing-4-7-8',
      title: '4-7-8 Дыхание',
      description: 'Техника глубокого дыхания для быстрого снятия стресса',
      duration: 300, // 5 минут
      difficulty: 'beginner',
      category: 'breathing',
      instructions: [
        'Сядьте в удобное положение',
        'Полностью выдохните через рот',
        'Вдохните через нос на 4 счета',
        'Задержите дыхание на 7 счетов',
        'Выдохните через рот на 8 счетов',
        'Повторите цикл 4 раза'
      ],
      benefits: [
        'Снижает уровень стресса',
        'Успокаивает нервную систему',
        'Улучшает качество сна',
        'Снижает артериальное давление'
      ],
      audioGuide: 'breathing-4-7-8.mp3',
      targetHeartRate: { min: 60, max: 80 },
      emotionTags: ['stress', 'anxiety', 'fatigue'],
      caloriesBurn: 15,
      icon: '🫁',
      color: '#4A90E2'
    },
    {
      id: 'box-breathing',
      title: 'Коробочное дыхание',
      description: 'Техника дыхания Navy SEALs для контроля стресса',
      duration: 420, // 7 минут
      difficulty: 'beginner',
      category: 'breathing',
      instructions: [
        'Примите удобную позу',
        'Вдохните через нос на 4 счета',
        'Задержите дыхание на 4 счета',
        'Выдохните через рот на 4 счета',
        'Задержите дыхание на 4 счета',
        'Повторяйте цикл'
      ],
      benefits: [
        'Повышает концентрацию',
        'Снижает уровень кортизола',
        'Улучшает эмоциональный контроль',
        'Стабилизирует давление'
      ],
      audioGuide: 'box-breathing.mp3',
      targetHeartRate: { min: 55, max: 75 },
      emotionTags: ['stress', 'anxiety'],
      caloriesBurn: 20,
      icon: '📦',
      color: '#5856D6'
    },
    {
      id: 'progressive-relaxation',
      title: 'Прогрессивная релаксация',
      description: 'Последовательное напряжение и расслабление мышц',
      duration: 900, // 15 минут
      difficulty: 'intermediate',
      category: 'relaxation',
      instructions: [
        'Лягте на спину',
        'Начните с пальцев ног',
        'Напрягите мышцы на 5 секунд',
        'Расслабьте и почувствуйте разницу',
        'Двигайтесь вверх по телу',
        'Завершите на мышцах лица'
      ],
      benefits: [
        'Глубокое расслабление',
        'Снижает мышечное напряжение',
        'Улучшает осознание тела',
        'Помогает при бессоннице'
      ],
      audioGuide: 'progressive-relaxation.mp3',
      targetHeartRate: { min: 50, max: 70 },
      emotionTags: ['stress', 'fatigue'],
      caloriesBurn: 25,
      icon: '🧘',
      color: '#34C759'
    }
  ],
  
  sadness: [
    {
      id: 'gratitude-meditation',
      title: 'Медитация благодарности',
      description: 'Практика осознанной благодарности для поднятия настроения',
      duration: 600, // 10 минут
      difficulty: 'beginner',
      category: 'meditation',
      instructions: [
        'Сядьте в тихом месте',
        'Закройте глаза',
        'Подумайте о 3 вещах, за которые благодарны',
        'Почувствуйте благодарность в теле',
        'Визуализируйте каждую деталь',
        'Завершите глубоким вдохом'
      ],
      benefits: [
        'Улучшает настроение',
        'Повышает позитивное мышление',
        'Снижает депрессивные симптомы',
        'Укрепляет отношения'
      ],
      audioGuide: 'gratitude-meditation.mp3',
      targetHeartRate: { min: 60, max: 85 },
      emotionTags: ['sadness', 'stress'],
      caloriesBurn: 18,
      icon: '🙏',
      color: '#FF9500'
    },
    {
      id: 'loving-kindness',
      title: 'Медитация любящей доброты',
      description: 'Практика сострадания к себе и другим',
      duration: 720, // 12 минут
      difficulty: 'intermediate',
      category: 'meditation',
      instructions: [
        'Примите удобную позу',
        'Начните с пожеланий себе',
        'Повторяйте: "Пусть я буду счастлив"',
        'Распространите на близких',
        'Затем на всех людей',
        'Почувствуйте тепло в сердце'
      ],
      benefits: [
        'Развивает самосострадание',
        'Улучшает эмпатию',
        'Снижает негативные эмоции',
        'Повышает социальную связь'
      ],
      audioGuide: 'loving-kindness.mp3',
      targetHeartRate: { min: 65, max: 85 },
      emotionTags: ['sadness', 'anxiety'],
      caloriesBurn: 22,
      icon: '💝',
      color: '#FF2D55'
    },
    {
      id: 'mindful-walking',
      title: 'Осознанная прогулка',
      description: 'Медитация в движении для поднятия настроения',
      duration: 1200, // 20 минут
      difficulty: 'beginner',
      category: 'mindfulness',
      instructions: [
        'Выйдите на улицу или найдите тихое место',
        'Идите медленно',
        'Осознавайте каждый шаг',
        'Замечайте окружающие звуки',
        'Чувствуйте прикосновение воздуха',
        'Возвращайте внимание к ходьбе'
      ],
      benefits: [
        'Улучшает настроение',
        'Увеличивает физическую активность',
        'Снижает руминацию',
        'Повышает осознанность'
      ],
      audioGuide: 'mindful-walking.mp3',
      targetHeartRate: { min: 70, max: 100 },
      emotionTags: ['sadness', 'fatigue'],
      caloriesBurn: 80,
      icon: '🚶',
      color: '#32ADE6'
    }
  ],
  
  anxiety: [
    {
      id: 'grounding-5-4-3-2-1',
      title: 'Заземление 5-4-3-2-1',
      description: 'Техника возвращения в настоящий момент через органы чувств',
      duration: 360, // 6 минут
      difficulty: 'beginner',
      category: 'mindfulness',
      instructions: [
        'Назовите 5 вещей, которые видите',
        'Назовите 4 вещи, которые слышите',
        'Назовите 3 вещи, которые чувствуете',
        'Назовите 2 запаха',
        'Назовите 1 вкус',
        'Сделайте глубокий вдох'
      ],
      benefits: [
        'Быстро снижает тревогу',
        'Останавливает панические атаки',
        'Возвращает в настоящее',
        'Улучшает осознанность'
      ],
      audioGuide: 'grounding-5-4-3-2-1.mp3',
      targetHeartRate: { min: 65, max: 90 },
      emotionTags: ['anxiety', 'stress'],
      caloriesBurn: 12,
      icon: '🌍',
      color: '#8E8E93'
    },
    {
      id: 'alternate-nostril',
      title: 'Попеременное дыхание',
      description: 'Йогическая техника балансировки нервной системы',
      duration: 480, // 8 минут
      difficulty: 'intermediate',
      category: 'breathing',
      instructions: [
        'Сядьте с прямой спиной',
        'Закройте правую ноздрю большим пальцем',
        'Вдохните через левую ноздрю',
        'Закройте левую ноздрю безымянным пальцем',
        'Выдохните через правую ноздрю',
        'Повторите с другой стороны'
      ],
      benefits: [
        'Балансирует нервную систему',
        'Снижает тревожность',
        'Улучшает концентрацию',
        'Успокаивает ум'
      ],
      audioGuide: 'alternate-nostril.mp3',
      targetHeartRate: { min: 58, max: 78 },
      emotionTags: ['anxiety', 'stress'],
      caloriesBurn: 16,
      icon: '🌬️',
      color: '#30B0C7'
    },
    {
      id: 'body-scan',
      title: 'Сканирование тела',
      description: 'Систематическое осознание ощущений в теле',
      duration: 900, // 15 минут
      difficulty: 'beginner',
      category: 'mindfulness',
      instructions: [
        'Лягте на спину',
        'Закройте глаза',
        'Начните с пальцев ног',
        'Медленно двигайтесь вверх',
        'Замечайте любые ощущения',
        'Не пытайтесь изменить их'
      ],
      benefits: [
        'Снижает соматическую тревогу',
        'Улучшает связь тело-разум',
        'Помогает обнаружить напряжение',
        'Способствует расслаблению'
      ],
      audioGuide: 'body-scan.mp3',
      targetHeartRate: { min: 55, max: 75 },
      emotionTags: ['anxiety', 'stress', 'fatigue'],
      caloriesBurn: 20,
      icon: '🔍',
      color: '#AF52DE'
    }
  ],
  
  fatigue: [
    {
      id: 'energizing-breath',
      title: 'Энергизирующее дыхание',
      description: 'Быстрая техника дыхания для повышения энергии',
      duration: 300, // 5 минут
      difficulty: 'intermediate',
      category: 'breathing',
      instructions: [
        'Сядьте с прямой спиной',
        'Сделайте быстрые вдохи через нос',
        'Активно работайте диафрагмой',
        'Делайте 30 быстрых дыханий',
        'Затем глубокий вдох и задержка',
        'Повторите 3 раунда'
      ],
      benefits: [
        'Быстро повышает энергию',
        'Улучшает оксигенацию',
        'Стимулирует симпатическую систему',
        'Повышает бдительность'
      ],
      audioGuide: 'energizing-breath.mp3',
      targetHeartRate: { min: 75, max: 110 },
      emotionTags: ['fatigue', 'sadness'],
      caloriesBurn: 25,
      icon: '⚡',
      color: '#FF9500'
    },
    {
      id: 'power-nap-meditation',
      title: 'Медитация силового сна',
      description: 'Короткая медитация для быстрого восстановления',
      duration: 1200, // 20 минут
      difficulty: 'beginner',
      category: 'meditation',
      instructions: [
        'Лягте в удобное положение',
        'Закройте глаза',
        'Расслабьте все мышцы',
        'Следуйте голосу гида',
        'Позвольте себе почти заснуть',
        'Медленно вернитесь к бодрствованию'
      ],
      benefits: [
        'Восстанавливает энергию',
        'Улучшает когнитивные функции',
        'Снижает усталость',
        'Повышает продуктивность'
      ],
      audioGuide: 'power-nap-meditation.mp3',
      targetHeartRate: { min: 50, max: 65 },
      emotionTags: ['fatigue', 'stress'],
      caloriesBurn: 15,
      icon: '😴',
      color: '#5856D6'
    },
    {
      id: 'mindful-stretching',
      title: 'Осознанная растяжка',
      description: 'Мягкие движения для пробуждения тела',
      duration: 600, // 10 минут
      difficulty: 'beginner',
      category: 'movement',
      instructions: [
        'Встаньте или сядьте удобно',
        'Начните с шеи',
        'Медленно растягивайте каждую часть',
        'Дышите глубоко',
        'Двигайтесь осознанно',
        'Завершите потягиванием'
      ],
      benefits: [
        'Улучшает кровообращение',
        'Снимает мышечное напряжение',
        'Повышает гибкость',
        'Увеличивает энергию'
      ],
      audioGuide: 'mindful-stretching.mp3',
      targetHeartRate: { min: 65, max: 85 },
      emotionT