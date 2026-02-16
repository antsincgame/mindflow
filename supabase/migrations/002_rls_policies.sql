-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Meditation sessions policies
CREATE POLICY "Users can view own sessions"
  ON meditation_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON meditation_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON meditation_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON meditation_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Exercises policies (public read, admin write)
CREATE POLICY "Anyone can view exercises"
  ON exercises FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only service role can insert exercises"
  ON exercises FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Only service role can update exercises"
  ON exercises FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only service role can delete exercises"
  ON exercises FOR DELETE
  TO service_role
  USING (true);

-- Voices policies (public read, admin write)
CREATE POLICY "Anyone can view voices"
  ON voices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only service role can insert voices"
  ON voices FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Only service role can update voices"
  ON voices FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only service role can delete voices"
  ON voices FOR DELETE
  TO service_role
  USING (true);

-- Achievements policies (public read, admin write)
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only service role can insert achievements"
  ON achievements FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Only service role can update achievements"
  ON achievements FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only service role can delete achievements"
  ON achievements FOR DELETE
  TO service_role
  USING (true);

-- User achievements policies
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert user achievements"
  ON user_achievements FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Users can delete own achievements"
  ON user_achievements FOR DELETE
  USING (auth.uid() = user_id);

-- Progress policies
CREATE POLICY "Users can view own progress"
  ON progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update any progress"
  ON progress FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Stress logs policies
CREATE POLICY "Users can view own stress logs"
  ON stress_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stress logs"
  ON stress_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stress logs"
  ON stress_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stress logs"
  ON stress_logs FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert stress logs"
  ON stress_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Notification history policies
CREATE POLICY "Users can view own notification history"
  ON notification_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification history"
  ON notification_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification history"
  ON notification_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert notification history"
  ON notification_history FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update notification history"
  ON notification_history FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Additional policies for anonymous access where needed
CREATE POLICY "Anonymous can view exercises"
  ON exercises FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous can view voices"
  ON voices FOR SELECT
  TO anon
  USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON exercises, voices, achievements TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Create indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_user_id ON meditation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_stress_logs_user_id ON stress_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_user_started ON meditation_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_stress_logs_user_created ON stress_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_history_user_sent ON notification_history(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_unlocked ON user_achievements(user_id, unlocked_at DESC);