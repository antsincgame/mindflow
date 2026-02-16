# MindFlow - Приложение для ментального здоровья

Мобильное приложение для управления эмоциональным состоянием через практики осознанности, дыхательные упражнения и медитацию с интеграцией Apple HealthKit и Apple Watch.

## Особенности

- 🧘‍♀️ Персонализированные упражнения на основе текущего эмоционального состояния
- 💓 Интеграция с Apple HealthKit для отслеживания биометрических данных
- ⌚ Поддержка Apple Watch для упражнений на запястье
- 📊 Детальная статистика прогресса с тепловой картой активности
- 🏆 Система достижений и мотивации
- 🎧 Аудио-гиды для медитаций и дыхательных практик
- 🌙 Темная и светлая темы оформления
- 📱 Умные уведомления-напоминания
- 🔗 Возможность делиться прогрессом

## Технологический стек

- **React Native** 0.73.2
- **TypeScript** 5.x
- **Expo** (опционально)
- **React Navigation** 6.x
- **Zustand** для управления состоянием
- **React Native Reanimated** для анимаций
- **Victory Native** для графиков
- **Apple HealthKit** для биометрики
- **WatchConnectivity** для синхронизации с Apple Watch

## Требования

- Node.js >= 18.x
- npm >= 9.x или yarn >= 1.22.x
- Xcode >= 15.0 (для iOS разработки)
- CocoaPods >= 1.14.x
- macOS для разработки под iOS/watchOS
- Активный Apple Developer аккаунт (для HealthKit и WatchOS)

## Установка

### 1. Клонирование репозитория

```bash
git clone https://github.com/yourusername/mindflow.git
cd mindflow
```

### 2. Установка зависимостей

```bash
npm install
# или
yarn install
```

### 3. Установка iOS зависимостей

```bash
cd ios
pod install
cd ..
```

### 4. Настройка HealthKit

Откройте `ios/MindFlow.xcworkspace` в Xcode и:

1. Выберите проект MindFlow в навигаторе
2. Перейдите в раздел "Signing & Capabilities"
3. Добавьте capability "HealthKit"
4. В `Info.plist` добавьте:

```xml
<key>NSHealthShareUsageDescription</key>
<string>MindFlow использует данные о здоровье для персонализации упражнений</string>
<key>NSHealthUpdateUsageDescription</key>
<string>MindFlow сохраняет данные о сессиях в Health</string>
```

### 5. Настройка Apple Watch

1. В Xcode выберите схему "MindFlowWatch"
2. Убедитесь, что WatchKit App Bundle ID настроен
3. Добавьте Watch App в основной проект

## Запуск приложения

### iOS Simulator

```bash
npm run ios
# или
yarn ios
```

### Физическое устройство iOS

```bash
npm run ios -- --device "iPhone Name"
# или
yarn ios --device "iPhone Name"
```

### Metro Bundler (отдельно)

```bash
npm start
# или
yarn start
```

### Apple Watch Simulator

```bash
# Запустите iOS симулятор, затем
xcrun simctl launch booted com.yourcompany.mindflow.watchkitapp
```

## Структура проекта

```
mindflow/
├── App.tsx                          # Корневой компонент
├── app.json                         # Конфигурация Expo
├── package.json                     # Зависимости
├── tsconfig.json                    # TypeScript конфиг
├── babel.config.js                  # Babel конфиг
├── metro.config.js                  # Metro bundler конфиг
│
├── src/
│   ├── navigation/                  # Навигация
│   │   ├── RootNavigator.tsx
│   │   └── types.ts
│   │
│   ├── screens/                     # Экраны приложения
│   │   ├── HomeScreen.tsx
│   │   ├── EmotionSelectionScreen.tsx
│   │   ├── ExerciseSelectionScreen.tsx
│   │   ├── ExerciseSessionScreen.tsx
│   │   ├── SessionResultScreen.tsx
│   │   ├── StatisticsScreen.tsx
│   │   ├── AchievementsScreen.tsx
│   │   └── SettingsScreen.tsx
│   │
│   ├── components/                  # Переиспользуемые компоненты
│   │   ├── EmotionCard.tsx
│   │   ├── ExerciseCard.tsx
│   │   ├── HeatmapCalendar.tsx
│   │   ├── MiniChart.tsx
│   │   ├── AchievementBadge.tsx
│   │   ├── CircularProgress.tsx
│   │   ├── BiometricIndicator.tsx
│   │   └── NotificationToggle.tsx
│   │
│   ├── services/                    # Бизнес-логика и интеграции
│   │   ├── HealthKitService.ts
│   │   ├── NotificationService.ts
│   │   ├── AudioService.ts
│   │   ├── StorageService.ts
│   │   ├── AnalyticsService.ts
│   │   ├── WatchConnectivityService.ts
│   │   └── SharingService.ts
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useHealthData.ts
│   │   ├── useExerciseTimer.ts
│   │   ├── useStatistics.ts
│   │   ├── useAchievements.ts
│   │   ├── useNotifications.ts
│   │   └── useTheme.ts
│   │
│   ├── models/                      # TypeScript модели данных
│   │   ├── Emotion.ts
│   │   ├── Exercise.ts
│   │   ├── Session.ts
│   │   ├── BiometricData.ts
│   │   ├── Achievement.ts
│   │   ├── Statistics.ts
│   │   └── UserSettings.ts
│   │
│   ├── theme/                       # Стилизация
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── animations.ts
│   │
│   ├── utils/                       # Утилиты
│   │   ├── dateHelpers.ts
│   │   ├── stressCalculator.ts
│   │   ├── exerciseRecommender.ts
│   │   ├── achievementChecker.ts
│   │   └── heatmapGenerator.ts
│   │
│   └── constants/                   # Константы
│       ├── exercises.ts
│       ├── emotions.ts
│       └── achievements.ts
│
├── assets/                          # Медиа ресурсы
│   ├── audio/
│   │   ├── breathing-4-7-8.mp3
│   │   ├── box-breathing.mp3
│   │   ├── calm-meditation.mp3
│   │   └── body-scan.mp3
│   └── images/
│       ├── icon.png
│       └── splash.png
│
├── ios/                             # iOS нативный код
│   ├── Podfile
│   ├── MindFlow/
│   │   └── Info.plist
│   └── MindFlow.xcodeproj/
│
└── watchOS/                         # Apple Watch приложение
    └── MindFlowWatch/
        ├── ContentView.swift
        ├── ExerciseView.swift
        └── Info.plist
```

## Основные команды

```bash
# Запуск в режиме разработки
npm start

# iOS сборка
npm run ios

# Очистка кэша Metro
npm start -- --reset-cache

# Линтинг
npm run lint

# Проверка типов TypeScript
npm run type-check

# Запуск тестов
npm test

# Сборка production iOS
npm run build:ios

# Генерация иконок
npm run generate-icons
```

## Конфигурация

### Настройка уведомлений

В `src/services/NotificationService.ts` настройте время напоминаний:

```typescript
const DEFAULT_REMINDER_TIME = {
  hour: 20,
  minute: 0
};
```

### Настройка HealthKit метрик

В `src/services/HealthKitService.ts` выберите необходимые метрики:

```typescript
const HEALTH_METRICS = [
  'HeartRate',
  'SleepAnalysis',
  'StepCount',
  'MindfulSession'
];
```

### Настройка упражнений

Добавьте новые упражнения в `src/constants/exercises.ts`:

```typescript
export const EXERCISES = [
  {
    id: 'new-exercise',
    name: 'Новое упражнение',
    duration: 300,
    audioGuide: 'new-exercise.mp3',
    // ...
  }
];
```

## Разработка Apple Watch приложения

### Запуск Watch симулятора

```bash
# Откройте Xcode
open ios/MindFlow.xcworkspace

# Выберите схему MindFlowWatch
# Выберите Watch симулятор
# Нажмите Run (Cmd+R)
```

### Синхронизация данных

Watch приложение автоматически синхронизируется с iPhone через `WatchConnectivityService`. Убедитесь, что оба устройства в одной сети.

## Тестирование

### Unit тесты

```bash
npm test
```

### E2E тесты (Detox)

```bash
# Установка Detox
npm install -g detox-cli

# Сборка для тестирования
detox build --configuration ios.sim.debug

# Запуск тестов
detox test --configuration ios.sim.debug
```

## Сборка для Production

### iOS App Store

1. Обновите версию в `app.json` и `ios/MindFlow/Info.plist`
2. Создайте архив в Xcode:

```bash
# Откройте проект
open ios/MindFlow.xcworkspace

# Product -> Archive
# Validate App
# Distribute App
```

### TestFlight

```bash
# Загрузка в TestFlight через Xcode
# Product -> Archive -> Distribute App -> TestFlight
```

## Troubleshooting

### Проблемы с CocoaPods

```bash
cd ios
pod deintegrate
pod cache clean --all
pod install
cd ..
```

### Проблемы с Metro Bundler

```bash
npm start -- --reset-cache
# или
rm -rf $TMPDIR/metro-* && npm start
```

### Проблемы с HealthKit

- Убедитесь, что HealthKit capability добавлен в Xcode
- Проверьте разрешения в `Info.plist`
- Тестируйте только на физическом устройстве (симулятор не поддерживает HealthKit)

### Проблемы с Apple Watch

- Убедитесь, что iPhone и Watch сопряжены
- Проверьте, что WatchConnectivity активен
- Перезапустите оба устройства

## Поддержка и вклад

### Сообщить о баге

Создайте issue на GitHub с описанием:
- Версия приложения
- Версия iOS/watchOS
- Модель устройства
- Шаги для воспроизведения
- Ожидаемое/фактическое поведение

### Предложить улучшение

Создайте Pull Request с:
- Описанием изменений
- Скриншотами (если применимо)
- Тестами
- Обновленной документацией

## Лицензия

MIT License - см. файл LICENSE

## Контакты

- Email: support@mindflow.app
- Website: https://mindflow.app
- Twitter: @mindflowapp

## Благодарности

- React Native Community
- Apple Health Team
- Contributors и тестировщики

---

Создано с ❤️ командой MindFlow