# Mindful Breathing App

Мобильное приложение для медитации и дыхательных практик с интеграцией биометрических данных Apple HealthKit.

## 🌟 Основные возможности

- **Выбор эмоции**: Интерактивный выбор текущего эмоционального состояния
- **Персонализированные упражнения**: Рекомендации на основе эмоции и биометрических данных
- **Интеграция с HealthKit**: Мониторинг пульса, вариабельности сердечного ритма и уровня стресса
- **Статистика и прогресс**: Тепловая карта активности и детальная аналитика
- **Система достижений**: Мотивационные награды за регулярную практику
- **Напоминания**: Умные уведомления для поддержания привычки
- **Темная/светлая тема**: Адаптивный дизайн под предпочтения пользователя

## 🛠 Технологический стек

- **React Native** 0.73.4
- **Expo** ~50.0.0
- **TypeScript** 5.3.3
- **React Navigation** 6.x
- **Apple HealthKit** (через react-native-health)
- **AsyncStorage** для локального хранения
- **Expo Notifications** для push-уведомлений
- **React Native Chart Kit** для визуализации данных

## 📋 Требования

- Node.js >= 18.x
- npm >= 9.x или yarn >= 1.22.x
- Xcode >= 15.0 (для iOS разработки)
- CocoaPods >= 1.12.0
- Expo CLI
- iOS устройство или симулятор с iOS 14.0+

## 🚀 Установка

### 1. Клонирование репозитория

```bash
git clone https://github.com/yourusername/mindful-breathing-app.git
cd mindful-breathing-app
```

### 2. Установка зависимостей

```bash
npm install
```

или

```bash
yarn install
```

### 3. Установка iOS зависимостей

```bash
cd ios
pod install
cd ..
```

### 4. Конфигурация HealthKit

Убедитесь, что в `ios/Info.plist` присутствуют необходимые permissions:

```xml
<key>NSHealthShareUsageDescription</key>
<string>Приложению нужен доступ к данным о здоровье для анализа уровня стресса</string>
<key>NSHealthUpdateUsageDescription</key>
<string>Приложение сохраняет данные о сессиях медитации</string>
```

## 🏃‍♂️ Запуск приложения

### Development режим

```bash
npm start
```

или

```bash
expo start
```

### iOS

```bash
npm run ios
```

или

```bash
expo run:ios
```

### Запуск на конкретном симуляторе

```bash
npm run ios -- --simulator="iPhone 15 Pro"
```

## 📱 Структура проекта

```
mindful-breathing-app/
├── src/
│   ├── components/          # Переиспользуемые компоненты
│   │   ├── EmotionCard.tsx
│   │   ├── ExerciseCard.tsx
│   │   ├── HeatmapCalendar.tsx
│   │   ├── ProgressChart.tsx
│   │   ├── AchievementBadge.tsx
│   │   ├── CircularTimer.tsx
│   │   ├── BiometricIndicator.tsx
│   │   └── NotificationToggle.tsx
│   ├── screens/             # Экраны приложения
│   │   ├── HomeScreen.tsx
│   │   ├── EmotionSelectionScreen.tsx
│   │   ├── ExerciseListScreen.tsx
│   │   ├── ExerciseSessionScreen.tsx
│   │   ├── SessionResultScreen.tsx
│   │   ├── StatisticsScreen.tsx
│   │   ├── AchievementsScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── navigation/          # Навигация
│   │   ├── RootNavigator.tsx
│   │   └── types.ts
│   ├── services/            # Бизнес-логика и API
│   │   ├── HealthKitService.ts
│   │   ├── NotificationService.ts
│   │   ├── StorageService.ts
│   │   ├── AudioService.ts
│   │   ├── StressAnalysisService.ts
│   │   ├── ExerciseRecommendationService.ts
│   │   ├── AchievementService.ts
│   │   └── SharingService.ts
│   ├── hooks/               # Custom React hooks
│   │   ├── useHealthData.ts
│   │   ├── useExerciseTimer.ts
│   │   ├── useStatistics.ts
│   │   ├── useAchievements.ts
│   │   └── useTheme.ts
│   ├── models/              # TypeScript типы и интерфейсы
│   │   ├── Emotion.ts
│   │   ├── Exercise.ts
│   │   ├── Session.ts
│   │   ├── Achievement.ts
│   │   ├── BiometricData.ts
│   │   └── UserSettings.ts
│   ├── theme/               # Стилизация
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── theme.ts
│   └── utils/               # Утилиты
│       ├── dateHelpers.ts
│       ├── biometricCalculations.ts
│       ├── exerciseData.ts
│       ├── emotionData.ts
│       ├── achievementDefinitions.ts
│       └── validators.ts
├── ios/                     # iOS нативный код
├── App.tsx                  # Точка входа
├── app.json                 # Expo конфигурация
├── package.json
├── tsconfig.json
└── README.md
```

## 🎨 Архитектурные решения

### Навигация

Используется комбинация Stack и Tab навигаторов:
- **Tab Navigator**: Основная навигация (Главная, Статистика, Достижения, Настройки)
- **Stack Navigator**: Навигация внутри потоков (выбор эмоции → упражнения → сессия → результат)

### Управление состоянием

- **React Hooks**: useState, useEffect для локального состояния
- **Custom Hooks**: Инкапсуляция бизнес-логики (useHealthData, useExerciseTimer)
- **AsyncStorage**: Персистентное хранение данных пользователя

### Сервисы

Модульная архитектура с разделением ответственности:
- **HealthKitService**: Взаимодействие с биометрическими данными
- **NotificationService**: Управление уведомлениями
- **StorageService**: Абстракция над AsyncStorage
- **StressAnalysisService**: Анализ уровня стресса по биометрике
- **ExerciseRecommendationService**: Алгоритм рекомендаций

## 📊 Работа с данными

### Биометрические метрики

Приложение отслеживает:
- **Heart Rate** (пульс): Удары в минуту
- **HRV** (вариабельность сердечного ритма): Миллисекунды
- **Stress Level** (уровень стресса): Рассчитывается на основе пульса и HRV

### Формула расчета стресса

```typescript
const normalizedHR = (heartRate - 60) / (100 - 60);
const normalizedHRV = 1 - ((hrv - 20) / (100 - 20));
const stressLevel = (normalizedHR * 0.6 + normalizedHRV * 0.4) * 100;
```

### Хранение данных

Структура данных в AsyncStorage:

```typescript
{
  sessions: Session[],
  achievements: Achievement[],
  settings: UserSettings,
  statistics: {
    totalSessions: number,
    totalMinutes: number,
    currentStreak: number,
    longestStreak: number
  }
}
```

## 🏆 Система достижений

### Категории достижений

1. **Streak Achievements**: За последовательные дни практики
2. **Session Count**: За количество завершенных сессий
3. **Time-based**: За общее время практики
4. **Variety**: За разнообразие упражнений
5. **Special**: Уникальные достижения

### Примеры достижений

- 🔥 **First Steps**: Первая завершенная сессия
- 🌟 **Week Warrior**: 7 дней подряд
- 🏅 **Century**: 100 завершенных сессий
- 🎯 **Explorer**: Попробовать все типы упражнений

## 🔔 Система уведомлений

### Типы уведомлений

1. **Daily Reminder**: Ежедневное напоминание о практике
2. **Streak Alert**: Напоминание о сохранении серии
3. **Achievement Unlocked**: Уведомление о новом достижении

### Настройка уведомлений

```typescript
await NotificationService.scheduleDailyReminder({
  hour: 9,
  minute: 0,
  title: "Время для практики 🧘‍♀️",
  body: "Уделите несколько минут своему благополучию"
});
```

## 🎯 Алгоритм рекомендаций

Упражнения рекомендуются на основе:

1. **Выбранная эмоция**: Фильтрация подходящих упражнений
2. **Уровень стресса**: Приоритет более длинным/коротким упражнениям
3. **История**: Разнообразие и избегание повторений
4. **Время суток**: Адаптация к утру/вечеру

```typescript
const score = 
  emotionMatch * 0.4 +
  stressLevelMatch * 0.3 +
  varietyBonus * 0.2 +
  timeOfDayMatch * 0.1;
```

## 🧪 Тестирование

```bash
# Запуск тестов
npm test

# Запуск тестов с покрытием
npm run test:coverage

# Запуск линтера
npm run lint

# Проверка типов TypeScript
npm run type-check
```

## 📦 Сборка

### iOS Production Build

```bash
# EAS Build (рекомендуется)
eas build --platform ios --profile production

# Локальная сборка
expo build:ios
```

### Конфигурация App Store

1. Обновите `app.json`:
   - `bundleIdentifier`
   - `version`
   - `buildNumber`

2. Настройте signing в Xcode

3. Загрузите в App Store Connect

## 🔐 Безопасность

- Все биометрические данные хранятся локально
- Использование Keychain для чувствительных данных (будущая функция)
- Соблюдение Apple App Store Guidelines
- GDPR compliance для обработки данных

## 🚧 Roadmap

### v1.1
- [ ] Кастомные упражнения
- [ ] Экспорт данных в PDF
- [ ] Интеграция с Apple Watch

### v1.2
- [ ] Социальные функции (друзья, челленджи)
- [ ] Аудио-гайды для упражнений
- [ ] Интеграция с Siri Shortcuts

### v2.0
- [ ] AI-персонализация
- [ ] Интеграция с Google Fit (Android)
- [ ] Web-версия для синхронизации

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

### Стандарты кода

- ESLint конфигурация: Airbnb
- Prettier для форматирования
- Conventional Commits для сообщений коммитов
- TypeScript strict mode

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE)

## 👥 Авторы

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

## 🙏 Благодарности

- [Expo](https://expo.dev/) за отличный фреймворк
- [React Navigation](https://reactnavigation.org/) за навигацию
- [react-native-health](https://github.com/agencyenterprise/react-native-health) за HealthKit интеграцию
- Все контрибьюторы и тестировщики

## 📞 Поддержка

- Email: support@mindfulbreathing.app
- Issues: [GitHub Issues](https://github.com/yourusername/mindful-breathing-app/issues)
- Документация: [Wiki](https://github.com/yourusername/mindful-breathing-app/wiki)

## 📈 Статус проекта

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-iOS-lightgrey)

---

**Mindful Breathing** - Ваш путь к эмоциональному благополучию 🧘‍♀️✨