-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for secure random generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE exercise_type AS ENUM ('breathing', 'mindfulness', 'body_scan');
CREATE TYPE voice_gender AS ENUM ('male', 'female');
CREATE TYPE stress_source AS ENUM ('biometric', 'manual', 'ai_analysis');
CREATE TYPE notification_type AS ENUM ('stress_detected', 'session_reminder');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    selected_voice_id UUID,
    session_interval_hours INTEGER DEFAULT 4 CHECK (session_interval_hours BETWEEN 1 AND 8),
    notification_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voices table
CREATE TABLE voices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    gender voice_gender NOT NULL,
    accent TEXT NOT NULL,
    preview_audio_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises table
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    type exercise_type NOT NULL,
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
    audio_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_url TEXT NOT NULL,
    unlock_condition JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meditation sessions table
CREATE TABLE meditation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
    stress_before INTEGER NOT NULL CHECK (stress_before BETWEEN 0 AND 100),
    stress_after INTEGER CHECK (stress_after BETWEEN 0 AND 100),
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- User achievements table (many-to-many)
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Progress table
CREATE TABLE progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_sessions INTEGER DEFAULT 0 CHECK (total_sessions >= 0),
    total_minutes INTEGER DEFAULT 0 CHECK (total_minutes >= 0),
    current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
    longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
    sessions_before_meetings INTEGER DEFAULT 0 CHECK (sessions_before_meetings >= 0),
    stress_reduction_avg FLOAT DEFAULT 0 CHECK (stress_reduction_avg >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stress logs table
CREATE TABLE stress_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stress_level INTEGER NOT NULL CHECK (stress_level BETWEEN 0 AND 100),
    source stress_source NOT NULL,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification history table
CREATE TABLE notification_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    accepted BOOLEAN DEFAULT FALSE,
    context JSONB DEFAULT '{}',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for selected_voice_id after voices table is created
ALTER TABLE users 
ADD CONSTRAINT fk_users_selected_voice 
FOREIGN KEY (selected_voice_id) REFERENCES voices(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_meditation_sessions_user_id ON meditation_sessions(user_id);
CREATE INDEX idx_meditation_sessions_started_at ON meditation_sessions(started_at DESC);
CREATE INDEX idx_meditation_sessions_completed_at ON meditation_sessions(completed_at DESC);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX idx_progress_user_id ON progress(user_id);
CREATE INDEX idx_stress_logs_user_id ON stress_logs(user_id);
CREATE INDEX idx_stress_logs_created_at ON stress_logs(created_at DESC);
CREATE INDEX idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX idx_notification_history_sent_at ON notification_history(sent_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at
    BEFORE UPDATE ON progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to initialize progress for new users
CREATE OR REPLACE FUNCTION create_user_progress()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO progress (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create progress record
CREATE TRIGGER trigger_create_user_progress
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_progress();

-- Add comments for documentation
COMMENT ON TABLE users IS 'User profiles with preferences and settings';
COMMENT ON TABLE voices IS 'Available meditation instructor voices';
COMMENT ON TABLE exercises IS 'Meditation exercises library';
COMMENT ON TABLE achievements IS 'Available achievements and badges';
COMMENT ON TABLE meditation_sessions IS 'User meditation session history';
COMMENT ON TABLE user_achievements IS 'Unlocked achievements per user';
COMMENT ON TABLE progress IS 'User progress statistics and streaks';
COMMENT ON TABLE stress_logs IS 'Historical stress level measurements';
COMMENT ON TABLE notification_history IS 'Push notification delivery history';

COMMENT ON COLUMN users.session_interval_hours IS 'Minimum hours between meditation reminders (1-8)';
COMMENT ON COLUMN meditation_sessions.stress_before IS 'Stress level before session (0-100)';
COMMENT ON COLUMN meditation_sessions.stress_after IS 'Stress level after session (0-100)';
COMMENT ON COLUMN meditation_sessions.rating IS 'User rating of session (1-5 stars)';
COMMENT ON COLUMN progress.sessions_before_meetings IS 'Count of sessions completed before calendar meetings';
COMMENT ON COLUMN progress.stress_reduction_avg IS 'Average stress reduction percentage';
COMMENT ON COLUMN stress_logs.context IS 'Additional context: heart_rate, calendar_event, etc.';
COMMENT ON COLUMN notification_history.accepted IS 'Whether user accepted the notification prompt';