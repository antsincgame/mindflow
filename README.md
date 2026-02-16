# MindFlow - AI-Powered Stress Management App

MindFlow is an iOS application that uses AI to detect stress through biometric data, calendar analysis, and behavioral patterns, providing personalized meditation sessions at the right moment.

## Features

- **AI Stress Detection**: Hybrid approach combining HealthKit biometrics, calendar analysis, and behavioral patterns
- **Smart Notifications**: Push notifications and lock screen widget when stress is detected
- **Adaptive Sessions**: Session speed adjusts based on stress level (instant start for critical stress, 15-sec preparation for moderate)
- **Voice Library**: Multiple instructor voices (male, female, different accents) with preview
- **Progress Tracking**: Achievements, streaks, badges, and detailed history ("you meditated before 12 meetings and were 40% calmer")
- **Flexible Input**: Manual stress input via swipe/button for users without Apple Watch
- **Customizable**: Session interval (1-8 hours), notification preferences
- **Adaptive Logic**: Notification frequency reduces for 24h after 3 consecutive dismissals

## Architecture

### Tech Stack

- **Frontend**: SwiftUI
- **Pattern**: MVVM + Clean Architecture
- **State Management**: Combine + @Published
- **Navigation**: NavigationStack
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Health Integration**: HealthKit (heart rate, activity)
- **Calendar Integration**: EventKit (calendar events)
- **Audio**: AVFoundation (instructor voice, background sounds)
- **Notifications**: APNs + Notification Service Extension
- **Widgets**: WidgetKit (lock screen widget)
- **Storage**: UserDefaults + Keychain (tokens, settings)

### Project Structure

```
MindFlow/
├── App.swift                           # Entry point, Supabase init, AppDelegate
├── MindFlowApp.swift                   # Main SwiftUI app structure
├── Info.plist                          # App configuration, permissions
├── project.yml                         # XcodeGen configuration
├── Package.swift                       # Swift Package Manager dependencies
├── src/
│   ├── screens/
│   │   ├── OnboardingScreen.swift      # Onboarding with permissions
│   │   ├── HomeScreen.swift            # Main screen with stress level
│   │   ├── MeditationSessionScreen.swift # Active meditation session
│   │   ├── SessionResultScreen.swift   # Session result with before/after stress
│   │   ├── ProgressScreen.swift        # Progress history and achievements
│   │   ├── SettingsScreen.swift        # App settings
│   │   ├── VoiceLibraryScreen.swift    # Voice selection
│   │   └── ExerciseSelectionScreen.swift # Exercise selection with AI recommendation
│   ├── components/
│   │   ├── StressIndicator.swift       # Stress level indicator
│   │   ├── BreathingAnimation.swift    # Breathing animation
│   │   ├── ProgressCard.swift          # Progress card
│   │   ├── AchievementBadge.swift      # Achievement badge
│   │   ├── VoicePreviewCard.swift      # Voice preview card
│   │   ├── ExerciseCard.swift          # Exercise card
│   │   ├── SessionTimer.swift          # Session timer
│   │   ├── StressSwipeControl.swift    # Manual stress input
│   │   └── LockScreenWidget.swift      # Lock screen widget
│   ├── services/
│   │   ├── SupabaseService.swift       # Supabase integration
│   │   ├── HealthKitService.swift      # HealthKit integration
│   │   ├── CalendarService.swift       # EventKit integration
│   │   ├── NotificationService.swift   # Push notifications
│   │   ├── StressAnalysisService.swift # AI stress analysis
│   │   ├── MeditationService.swift     # Meditation management
│   │   ├── AudioService.swift          # Audio playback
│   │   ├── AchievementService.swift    # Achievements management
│   │   └── RecommendationService.swift # AI exercise recommendations
│   ├── hooks/
│   │   ├── useStressMonitoring.swift   # Real-time stress monitoring
│   │   ├── useHealthKit.swift          # HealthKit data hook
│   │   ├── useCalendarEvents.swift     # Calendar events hook
│   │   ├── useMeditationSession.swift  # Meditation session state
│   │   ├── useProgress.swift           # Progress data hook
│   │   └── useNotifications.swift      # Notifications management
│   ├── models/
│   │   ├── User.swift                  # User model
│   │   ├── MeditationSession.swift     # Meditation session model
│   │   ├── StressLevel.swift           # Stress level model
│   │   ├── Exercise.swift              # Exercise model
│   │   ├── Achievement.swift           # Achievement model
│   │   ├── Voice.swift                 # Voice model
│   │   ├── CalendarEvent.swift         # Calendar event model
│   │   ├── Progress.swift              # Progress model
│   │   └── Notification.swift          # Notification model
│   ├── theme/
│   │   ├── Colors.swift                # Color palette
│   │   ├── Typography.swift            # Typography system
│   │   ├── Spacing.swift               # Spacing system
│   │   └── Animations.swift            # Standard animations
│   ├── navigation/
│   │   ├── AppNavigator.swift          # Main navigator
│   │   └── Routes.swift                # App routes
│   └── utils/
│       ├── DateFormatter.swift         # Date formatting utilities
│       ├── Logger.swift                # Logging utility
│       ├── Validator.swift             # Validation utilities
│       ├── Constants.swift             # App constants
│       ├── KeychainManager.swift       # Secure storage
│       └── NetworkMonitor.swift        # Network state monitoring
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql      # Initial database schema
│   │   ├── 002_rls_policies.sql        # Row Level Security policies
│   │   ├── 003_functions.sql           # Database functions
│   │   └── 004_triggers.sql            # Database triggers
│   └── seed.sql                        # Initial data seed
├── Assets.xcassets/                    # App assets
├── MindFlowWidget/                     # Lock screen widget extension
├── MindFlowNotificationService/        # Notification service extension
└── Tests/                              # Unit and UI tests
```

## Installation

### Prerequisites

- Xcode 15.0+
- iOS 17.0+
- Swift 5.9+
- Supabase account
- Apple Developer account (for push notifications)

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/mindflow.git
cd mindflow
```

### 2. Install Dependencies

```bash
# Install XcodeGen
brew install xcodegen

# Generate Xcode project
xcodegen generate

# Open project
open MindFlow.xcodeproj
```

### 3. Configure Supabase

#### Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your project URL and anon key

#### Run Migrations

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Login to Supabase
supabase login

# Link project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Seed initial data
psql -h db.your-project-ref.supabase.co -U postgres -d postgres -f supabase/seed.sql
```

#### Configure Storage

1. Go to Supabase Dashboard → Storage
2. Create bucket `voices` (public)
3. Create bucket `exercises` (public)
4. Upload voice audio files to `voices/`
5. Upload exercise audio files to `exercises/`

#### Enable Realtime

1. Go to Supabase Dashboard → Database → Replication
2. Enable replication for tables: `stress_logs`, `meditation_sessions`, `notification_history`

### 4. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your Supabase credentials
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 5. Configure Push Notifications

#### Generate APNs Certificate

1. Go to [Apple Developer](https://developer.apple.com)
2. Certificates, Identifiers & Profiles → Keys
3. Create new key with Apple Push Notifications service (APNs)
4. Download .p8 file
5. Note Key ID and Team ID

#### Configure Supabase Edge Function

```bash
# Create edge function for push notifications
supabase functions new push-notification

# Deploy function
supabase functions deploy push-notification --no-verify-jwt
```

#### Add APNs Key to Supabase

1. Go to Supabase Dashboard → Project Settings → API
2. Add APNs Key ID, Team ID, and .p8 file content

### 6. Configure Xcode Project

#### Signing & Capabilities

1. Open `MindFlow.xcodeproj`
2. Select MindFlow target
3. Signing & Capabilities tab
4. Add capabilities:
   - HealthKit
   - Push Notifications
   - Background Modes (Audio, Background Fetch)
   - App Groups (`group.com.yourcompany.mindflow`)
   - WidgetKit Extension

#### Info.plist Permissions

Add usage descriptions:
- `NSHealthShareUsageDescription`: "MindFlow needs access to your health data to detect stress levels through heart rate monitoring."
- `NSHealthUpdateUsageDescription`: "MindFlow needs to record your meditation sessions in Health app."
- `NSCalendarsUsageDescription`: "MindFlow needs access to your calendar to detect stressful events and suggest meditation sessions."
- `NSMicrophoneUsageDescription`: "MindFlow can use your microphone to personalize the instructor's voice (optional)."
- `NSUserNotificationsUsageDescription`: "MindFlow needs to send you notifications when stress is detected."

### 7. Build and Run

```bash
# Select MindFlow scheme
# Select iOS Simulator or physical device
# Press Cmd+R to build and run
```

## Database Schema

### Tables

#### users
```sql
- id (uuid, PK)
- email (text)
- selected_voice_id (uuid, FK → voices.id)
- session_interval_hours (int, default 4)
- notification_enabled (bool, default true)
- created_at (timestamp)
- updated_at (timestamp)
```

#### meditation_sessions
```sql
- id (uuid, PK)
- user_id (uuid, FK → users.id)
- exercise_id (uuid, FK → exercises.id)
- stress_before (int, 1-10)
- stress_after (int, 1-10)
- duration_seconds (int)
- rating (int, 1-5, nullable)
- started_at (timestamp)
- completed_at (timestamp)
```

#### exercises
```sql
- id (uuid, PK)
- name (text)
- description (text)
- type (text: breathing, mindfulness, body_scan)
- duration_seconds (int)
- audio_url (text)
- created_at (timestamp)
```

#### voices
```sql
- id (uuid, PK)
- name (text)
- gender (text: male, female)
- accent (text)
- preview_audio_url (text)
- created_at (timestamp)
```

#### achievements
```sql
- id (uuid, PK)
- name (text)
- description (text)
- icon_url (text)
- unlock_condition (jsonb)
- created_at (timestamp)
```

#### user_achievements
```sql
- id (uuid, PK)
- user_id (uuid, FK → users.id)
- achievement_id (uuid, FK → achievements.id)
- unlocked_at (timestamp)
```

#### progress
```sql
- id (uuid, PK)
- user_id (uuid, FK → users.id)
- total_sessions (int, default 0)
- total_minutes (int, default 0)
- current_streak (int, default 0)
- longest_streak (int, default 0)
- sessions_before_meetings (int, default 0)
- stress_reduction_avg (float, default 0)
- updated_at (timestamp)
```

#### stress_logs
```sql
- id (uuid, PK)
- user_id (uuid, FK → users.id)
- stress_level (int, 1-10)
- source (text: biometric, manual, ai_analysis)
- context (jsonb: calendar_event, heart_rate, etc.)
- created_at (timestamp)
```

#### notification_history
```sql
- id (uuid, PK)
- user_id (uuid, FK → users.id)
- type (text: stress_detected, session_reminder)
- accepted (bool)
- context (jsonb)
- sent_at (timestamp)
```

## API Integration

### Supabase Client

```swift
import Supabase

let supabase = SupabaseClient(
    supabaseURL: URL(string: "https://your-project-ref.supabase.co")!,
    supabaseKey: "your-anon-key"
)
```

### Authentication

```swift
// Sign up
try await supabase.auth.signUp(email: email, password: password)

// Sign in
try await supabase.auth.signIn(email: email, password: password)

// Get current user
let user = try await supabase.auth.session.user
```

### Database Operations

```swift
// Insert meditation session
try await supabase
    .from("meditation_sessions")
    .insert([
        "user_id": userId,
        "exercise_id": exerciseId,
        "stress_before": stressBefore,
        "stress_after": stressAfter,
        "duration_seconds": duration,
        "started_at": startedAt,
        "completed_at": completedAt
    ])
    .execute()

// Get user progress
let progress: Progress = try await supabase
    .from("progress")
    .select()
    .eq("user_id", userId)
    .single()
    .execute()
    .value
```

### Realtime Subscriptions

```swift
// Subscribe to stress logs
let channel = supabase.channel("stress_logs")
    .on(
        .postgresChanges(
            event: .insert,
            schema: "public",
            table: "stress_logs",
            filter: "user_id=eq.\(userId)"
        ),
        callback: { payload in
            // Handle new stress log
        }
    )
    .subscribe()
```

## Testing

### Unit Tests

```bash
# Run unit tests
xcodebuild test -scheme MindFlow -destination 'platform=iOS Simulator,name=iPhone 15 Pro'
```

### UI Tests

```bash
# Run UI tests
xcodebuild test -scheme MindFlowUITests -destination 'platform=iOS Simulator,name=iPhone 15 Pro'
```

## Deployment

### TestFlight

1. Archive app in Xcode
2. Upload to App Store Connect
3. Add internal/external testers
4. Distribute build

### App Store

1. Complete App Store Connect metadata
2. Submit for review
3. Wait for approval
4. Release to App Store

## Development Timeline

- **MVP**: 14-21 days
- **Full Implementation**: 28-42 days
- **Testing**: 7-10 days
- **Total**: 49-73 days (7-10 weeks)

## Critical Paths

1. HealthKit integration for heart rate and activity
2. EventKit integration for calendar analysis
3. AI stress analysis service with hybrid approach
4. APNs push notifications + Notification Service Extension
5. Lock screen widget (WidgetKit)
6. Audio player with instructor voices (AVFoundation + Supabase Storage)
7. Achievement and progress system with Supabase triggers
8. Adaptive notification logic (