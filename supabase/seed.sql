-- Seed data for MindFlow app
-- Version: 1.0.0
-- Description: Initial data for voices, exercises, and achievements

-- ============================================
-- VOICES
-- ============================================

INSERT INTO voices (id, name, gender, accent, preview_audio_url, created_at) VALUES
-- Male voices
('550e8400-e29b-41d4-a716-446655440001', 'James', 'male', 'American', 'https://storage.supabase.co/voices/james_preview.mp3', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Oliver', 'male', 'British', 'https://storage.supabase.co/voices/oliver_preview.mp3', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Lucas', 'male', 'Australian', 'https://storage.supabase.co/voices/lucas_preview.mp3', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'Ethan', 'male', 'Canadian', 'https://storage.supabase.co/voices/ethan_preview.mp3', NOW()),

-- Female voices
('550e8400-e29b-41d4-a716-446655440005', 'Emma', 'female', 'American', 'https://storage.supabase.co/voices/emma_preview.mp3', NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'Sophia', 'female', 'British', 'https://storage.supabase.co/voices/sophia_preview.mp3', NOW()),
('550e8400-e29b-41d4-a716-446655440007', 'Olivia', 'female', 'Australian', 'https://storage.supabase.co/voices/olivia_preview.mp3', NOW()),
('550e8400-e29b-41d4-a716-446655440008', 'Ava', 'female', 'Canadian', 'https://storage.supabase.co/voices/ava_preview.mp3', NOW());

-- ============================================
-- EXERCISES
-- ============================================

-- Breathing exercises (short duration)
INSERT INTO exercises (id, name, description, type, duration_seconds, audio_url, created_at) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'Quick Breath Reset', 'A rapid 2-minute breathing exercise to instantly calm your nervous system. Perfect for moments of acute stress.', 'breathing', 120, 'https://storage.supabase.co/exercises/quick_breath_reset.mp3', NOW()),
('650e8400-e29b-41d4-a716-446655440002', 'Box Breathing', 'Military-grade breathing technique: inhale 4, hold 4, exhale 4, hold 4. Reduces stress and improves focus.', 'breathing', 180, 'https://storage.supabase.co/exercises/box_breathing.mp3', NOW()),
('650e8400-e29b-41d4-a716-446655440003', '4-7-8 Breath', 'Dr. Weil''s relaxation breath: inhale 4, hold 7, exhale 8. Activates parasympathetic nervous system.', 'breathing', 240, 'https://storage.supabase.co/exercises/4_7_8_breath.mp3', NOW()),
('650e8400-e29b-41d4-a716-446655440004', 'Coherent Breathing', 'Breathe at 5 breaths per minute for optimal heart rate variability. Balances mind and body.', 'breathing', 300, 'https://storage.supabase.co/exercises/coherent_breathing.mp3', NOW()),

-- Mindfulness exercises (medium duration)
('650e8400-e29b-41d4-a716-446655440005', 'Present Moment Awareness', 'Anchor yourself in the now. Notice thoughts, feelings, and sensations without judgment.', 'mindfulness', 300, 'https://storage.supabase.co/exercises/present_moment.mp3', NOW()),
('650e8400-e29b-41d4-a716-446655440006', 'Stress Release Visualization', 'Visualize stress leaving your body like dark smoke, replaced by calming light.', 'mindfulness', 360, 'https://storage.supabase.co/exercises/stress_release.mp3', NOW()),
('650e8400-e29b-41d4-a716-446655440007', 'Gratitude Meditation', 'Shift focus from stress to appreciation. Rewire your brain for positivity.', 'mindfulness', 420, 'https://storage.supabase.co/exercises/gratitude.mp3', NOW()),
('650e8400-e29b-41d4-a716-446655440008', 'Loving-Kindness Practice', 'Cultivate compassion for yourself and others. Reduces anxiety and increases wellbeing.', 'mindfulness', 480, 'https://storage.supabase.co/exercises/loving_kindness.mp3', NOW()),

-- Body scan exercises (longer duration)
('650e8400-e29b-41d4-a716-446655440009', 'Quick Body Scan', 'Rapid tension release from head to toe. Identify and relax areas of physical stress.', 'body_scan', 360, 'https://storage.supabase.co/exercises/quick_body_scan.mp3', NOW()),
('650e8400-e29b-41d4-a716-446655440010', 'Progressive Muscle Relaxation', 'Systematically tense and release muscle groups. Proven to reduce physical anxiety.', 'body_scan', 600, 'https://storage.supabase.co/exercises/progressive_relaxation.mp3', NOW()),
('650e8400-e29b-41d4-a716-446655440011', 'Full Body Awareness', 'Deep dive into bodily sensations. Connect mind and body for complete relaxation.', 'body_scan', 720, 'https://storage.supabase.co/exercises/full_body_awareness.mp3', NOW()),
('650e8400-e29b-41d4-a716-446655440012', 'Sleep Preparation Scan', 'Evening body scan designed to prepare you for deep, restorative sleep.', 'body_scan', 900, 'https://storage.supabase.co/exercises/sleep_preparation.mp3', NOW()),

-- Emergency exercises (ultra-short)
('650e8400-e29b-41d4-a716-446655440013', 'Emergency Calm', '60-second emergency intervention for panic or extreme stress. Use anytime, anywhere.', 'breathing', 60, 'https://storage.supabase.co/exercises/emergency_calm.mp3', NOW()),
('650e8400-e29b-41d4-a716-446655440014', 'Pre-Meeting Centering', '90-second grounding exercise before important meetings or presentations.', 'mindfulness', 90, 'https://storage.supabase.co/exercises/pre_meeting.mp3', NOW());

-- ============================================
-- ACHIEVEMENTS
-- ============================================

-- Beginner achievements
INSERT INTO achievements (id, name, description, icon_url, unlock_condition, created_at) VALUES
('750e8400-e29b-41d4-a716-446655440001', 'First Breath', 'Complete your first meditation session', 'https://storage.supabase.co/icons/first_breath.png', '{"type": "sessions_completed", "count": 1}', NOW()),
('750e8400-e29b-41d4-a716-446655440002', 'Early Bird', 'Meditate before 8 AM', 'https://storage.supabase.co/icons/early_bird.png', '{"type": "time_of_day", "before": "08:00"}', NOW()),
('750e8400-e29b-41d4-a716-446655440003', 'Night Owl', 'Meditate after 10 PM', 'https://storage.supabase.co/icons/night_owl.png', '{"type": "time_of_day", "after": "22:00"}', NOW()),

-- Consistency achievements
('750e8400-e29b-41d4-a716-446655440004', 'Building Momentum', '3-day meditation streak', 'https://storage.supabase.co/icons/momentum_3.png', '{"type": "streak", "days": 3}', NOW()),
('750e8400-e29b-41d4-a716-446655440005', 'Week Warrior', '7-day meditation streak', 'https://storage.supabase.co/icons/week_warrior.png', '{"type": "streak", "days": 7}', NOW()),
('750e8400-e29b-41d4-a716-446655440006', 'Mindful Month', '30-day meditation streak', 'https://storage.supabase.co/icons/mindful_month.png', '{"type": "streak", "days": 30}', NOW()),
('750e8400-e29b-41d4-a716-446655440007', 'Zen Master', '100-day meditation streak', 'https://storage.supabase.co/icons/zen_master.png', '{"type": "streak", "days": 100}', NOW()),

-- Session count achievements
('750e8400-e29b-41d4-a716-446655440008', 'Getting Started', 'Complete 5 meditation sessions', 'https://storage.supabase.co/icons/started_5.png', '{"type": "total_sessions", "count": 5}', NOW()),
('750e8400-e29b-41d4-a716-446655440009', 'Committed Practitioner', 'Complete 25 meditation sessions', 'https://storage.supabase.co/icons/committed_25.png', '{"type": "total_sessions", "count": 25}', NOW()),
('750e8400-e29b-41d4-a716-446655440010', 'Meditation Veteran', 'Complete 50 meditation sessions', 'https://storage.supabase.co/icons/veteran_50.png', '{"type": "total_sessions", "count": 50}', NOW()),
('750e8400-e29b-41d4-a716-446655440011', 'Century Club', 'Complete 100 meditation sessions', 'https://storage.supabase.co/icons/century_100.png', '{"type": "total_sessions", "count": 100}', NOW()),
('750e8400-e29b-41d4-a716-446655440012', 'Enlightened', 'Complete 365 meditation sessions', 'https://storage.supabase.co/icons/enlightened_365.png', '{"type": "total_sessions", "count": 365}', NOW()),

-- Time-based achievements
('750e8400-e29b-41d4-a716-446655440013', 'First Hour', 'Meditate for 60 total minutes', 'https://storage.supabase.co/icons/first_hour.png', '{"type": "total_minutes", "count": 60}', NOW()),
('750e8400-e29b-41d4-a716-446655440014', 'Five Hours', 'Meditate for 300 total minutes', 'https://storage.supabase.co/icons/five_hours.png', '{"type": "total_minutes", "count": 300}', NOW()),
('750e8400-e29b-41d4-a716-446655440015', 'Half Day', 'Meditate for 12 total hours', 'https://storage.supabase.co/icons/half_day.png', '{"type": "total_minutes", "count": 720}', NOW()),
('750e8400-e29b-41d4-a716-446655440016', 'Full Day', 'Meditate for 24 total hours', 'https://storage.supabase.co/icons/full_day.png', '{"type": "total_minutes", "count": 1440}', NOW()),

-- Meeting-specific achievements
('750e8400-e29b-41d4-a716-446655440017', 'Meeting Prep Pro', 'Meditate before 5 meetings', 'https://storage.supabase.co/icons/meeting_prep.png', '{"type": "sessions_before_meetings", "count": 5}', NOW()),
('750e8400-e29b-41d4-a716-446655440018', 'Calendar Zen', 'Meditate before 25 meetings', 'https://storage.supabase.co/icons/calendar_zen.png', '{"type": "sessions_before_meetings", "count": 25}', NOW()),
('750e8400-e29b-41d4-a716-446655440019', 'Executive Presence', 'Meditate before 50 meetings', 'https://storage.supabase.co/icons/executive.png', '{"type": "sessions_before_meetings", "count": 50}', NOW()),

-- Stress reduction achievements
('750e8400-e29b-41d4-a716-446655440020', 'Stress Buster', 'Reduce stress by 30% on average', 'https://storage.supabase.co/icons/stress_buster.png', '{"type": "avg_stress_reduction", "percentage": 30}', NOW()),
('750e8400-e29b-41d4-a716-446655440021', 'Calm Champion', 'Reduce stress by 50% on average', 'https://storage.supabase.co/icons/calm_champion.png', '{"type": "avg_stress_reduction", "percentage": 50}', NOW()),
('750e8400-e29b-41d4-a716-446655440022', 'Tranquility Master', 'Reduce stress by 70% on average', 'https://storage.supabase.co/icons/tranquility.png', '{"type": "avg_stress_reduction", "percentage": 70}', NOW()),

-- Exercise variety achievements
('750e8400-e29b-41d4-a716-446655440023', 'Breath Explorer', 'Try all breathing exercises', 'https://storage.supabase.co/icons/breath_explorer.png', '{"type": "exercise_type_variety", "types": ["breathing"]}', NOW()),
('750e8400-e29b-41d4-a716-446655440024', 'Mindfulness Seeker', 'Try all mindfulness exercises', 'https://storage.supabase.co/icons/mindfulness_seeker.png', '{"type": "exercise_type_variety", "types": ["mindfulness"]}', NOW()),
('750e8400-e29b-41d4-a716-446655440025', 'Body Awareness', 'Try all body scan exercises', 'https://storage.supabase.co/icons/body_awareness.png', '{"type": "exercise_type_variety", "types": ["body_scan"]}', NOW()),
('750e8400-e29b-41d4-a716-446655440026', 'Well-Rounded', 'Try all exercise types', 'https://storage.supabase.co/icons/well_rounded.png', '{"type": "exercise_type_variety", "types": ["breathing", "mindfulness", "body_scan"]}', NOW()),

-- Special achievements
('750e8400-e29b-41d4-a716-446655440027', 'Weekend Warrior', 'Meditate on both Saturday and Sunday', 'https://storage.supabase.co/icons/weekend_warrior.png', '{"type": "weekend_sessions", "count": 2}', NOW()),
('750e8400-e29b-41d4-a716-446655440028', 'Emergency Response', 'Use emergency exercises 10 times', 'https://storage.supabase.co/icons/emergency_response.png', '{"type": "emergency_exercises",