-- Function to calculate and update user progress after a meditation session
CREATE OR REPLACE FUNCTION calculate_user_progress(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_sessions INT;
    v_total_minutes INT;
    v_current_streak INT;
    v_longest_streak INT;
    v_sessions_before_meetings INT;
    v_stress_reduction_avg FLOAT;
    v_last_session_date DATE;
    v_today DATE;
    v_yesterday DATE;
BEGIN
    v_today := CURRENT_DATE;
    v_yesterday := v_today - INTERVAL '1 day';
    
    -- Calculate total sessions
    SELECT COUNT(*)
    INTO v_total_sessions
    FROM meditation_sessions
    WHERE user_id = p_user_id
    AND completed_at IS NOT NULL;
    
    -- Calculate total minutes
    SELECT COALESCE(SUM(duration_seconds), 0) / 60
    INTO v_total_minutes
    FROM meditation_sessions
    WHERE user_id = p_user_id
    AND completed_at IS NOT NULL;
    
    -- Calculate average stress reduction
    SELECT COALESCE(AVG(stress_before - stress_after), 0)
    INTO v_stress_reduction_avg
    FROM meditation_sessions
    WHERE user_id = p_user_id
    AND completed_at IS NOT NULL
    AND stress_before IS NOT NULL
    AND stress_after IS NOT NULL;
    
    -- Calculate sessions before meetings
    SELECT COUNT(*)
    INTO v_sessions_before_meetings
    FROM meditation_sessions ms
    WHERE ms.user_id = p_user_id
    AND ms.completed_at IS NOT NULL
    AND EXISTS (
        SELECT 1
        FROM stress_logs sl
        WHERE sl.user_id = p_user_id
        AND sl.created_at >= ms.started_at - INTERVAL '2 hours'
        AND sl.created_at <= ms.started_at
        AND sl.context->>'trigger_type' = 'calendar_event'
    );
    
    -- Get last session date
    SELECT DATE(completed_at)
    INTO v_last_session_date
    FROM meditation_sessions
    WHERE user_id = p_user_id
    AND completed_at IS NOT NULL
    ORDER BY completed_at DESC
    LIMIT 1;
    
    -- Calculate current streak
    WITH daily_sessions AS (
        SELECT DISTINCT DATE(completed_at) as session_date
        FROM meditation_sessions
        WHERE user_id = p_user_id
        AND completed_at IS NOT NULL
        ORDER BY session_date DESC
    ),
    streak_calc AS (
        SELECT 
            session_date,
            ROW_NUMBER() OVER (ORDER BY session_date DESC) as row_num,
            session_date - (ROW_NUMBER() OVER (ORDER BY session_date DESC) * INTERVAL '1 day') as streak_group
        FROM daily_sessions
    )
    SELECT COUNT(*)
    INTO v_current_streak
    FROM streak_calc
    WHERE streak_group = (
        SELECT streak_group
        FROM streak_calc
        WHERE session_date = v_today OR session_date = v_yesterday
        ORDER BY session_date DESC
        LIMIT 1
    );
    
    -- If no recent session, streak is 0
    IF v_last_session_date IS NULL OR v_last_session_date < v_yesterday THEN
        v_current_streak := 0;
    END IF;
    
    -- Calculate longest streak
    WITH daily_sessions AS (
        SELECT DISTINCT DATE(completed_at) as session_date
        FROM meditation_sessions
        WHERE user_id = p_user_id
        AND completed_at IS NOT NULL
        ORDER BY session_date
    ),
    streak_groups AS (
        SELECT 
            session_date,
            session_date - (ROW_NUMBER() OVER (ORDER BY session_date) * INTERVAL '1 day') as streak_group
        FROM daily_sessions
    ),
    streak_lengths AS (
        SELECT COUNT(*) as streak_length
        FROM streak_groups
        GROUP BY streak_group
    )
    SELECT COALESCE(MAX(streak_length), 0)
    INTO v_longest_streak
    FROM streak_lengths;
    
    -- Update or insert progress
    INSERT INTO progress (
        user_id,
        total_sessions,
        total_minutes,
        current_streak,
        longest_streak,
        sessions_before_meetings,
        stress_reduction_avg,
        updated_at
    )
    VALUES (
        p_user_id,
        v_total_sessions,
        v_total_minutes,
        v_current_streak,
        v_longest_streak,
        v_sessions_before_meetings,
        v_stress_reduction_avg,
        NOW()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
        total_sessions = v_total_sessions,
        total_minutes = v_total_minutes,
        current_streak = v_current_streak,
        longest_streak = GREATEST(progress.longest_streak, v_longest_streak),
        sessions_before_meetings = v_sessions_before_meetings,
        stress_reduction_avg = v_stress_reduction_avg,
        updated_at = NOW();
END;
$$;

-- Function to check and unlock achievements for a user
CREATE OR REPLACE FUNCTION check_achievements(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_achievement RECORD;
    v_condition JSONB;
    v_condition_met BOOLEAN;
    v_progress RECORD;
BEGIN
    -- Get user progress
    SELECT * INTO v_progress
    FROM progress
    WHERE user_id = p_user_id;
    
    -- If no progress exists, exit
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Loop through all achievements
    FOR v_achievement IN 
        SELECT a.id, a.unlock_condition
        FROM achievements a
        WHERE NOT EXISTS (
            SELECT 1 
            FROM user_achievements ua 
            WHERE ua.user_id = p_user_id 
            AND ua.achievement_id = a.id
        )
    LOOP
        v_condition := v_achievement.unlock_condition;
        v_condition_met := FALSE;
        
        -- Check total_sessions condition
        IF v_condition ? 'total_sessions' THEN
            IF v_progress.total_sessions >= (v_condition->>'total_sessions')::INT THEN
                v_condition_met := TRUE;
            ELSE
                CONTINUE;
            END IF;
        END IF;
        
        -- Check total_minutes condition
        IF v_condition ? 'total_minutes' THEN
            IF v_progress.total_minutes >= (v_condition->>'total_minutes')::INT THEN
                v_condition_met := TRUE;
            ELSE
                CONTINUE;
            END IF;
        END IF;
        
        -- Check current_streak condition
        IF v_condition ? 'current_streak' THEN
            IF v_progress.current_streak >= (v_condition->>'current_streak')::INT THEN
                v_condition_met := TRUE;
            ELSE
                CONTINUE;
            END IF;
        END IF;
        
        -- Check longest_streak condition
        IF v_condition ? 'longest_streak' THEN
            IF v_progress.longest_streak >= (v_condition->>'longest_streak')::INT THEN
                v_condition_met := TRUE;
            ELSE
                CONTINUE;
            END IF;
        END IF;
        
        -- Check sessions_before_meetings condition
        IF v_condition ? 'sessions_before_meetings' THEN
            IF v_progress.sessions_before_meetings >= (v_condition->>'sessions_before_meetings')::INT THEN
                v_condition_met := TRUE;
            ELSE
                CONTINUE;
            END IF;
        END IF;
        
        -- Check stress_reduction_avg condition
        IF v_condition ? 'stress_reduction_avg' THEN
            IF v_progress.stress_reduction_avg >= (v_condition->>'stress_reduction_avg')::FLOAT THEN
                v_condition_met := TRUE;
            ELSE
                CONTINUE;
            END IF;
        END IF;
        
        -- Unlock achievement if condition met
        IF v_condition_met THEN
            INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
            VALUES (p_user_id, v_achievement.id, NOW())
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
        END IF;
    END LOOP;
END;
$$;

-- Function to get user statistics for progress screen
CREATE OR REPLACE FUNCTION get_user_statistics(p_user_id UUID)
RETURNS TABLE (
    total_sessions INT,
    total_minutes INT,
    current_streak INT,
    longest_streak INT,
    sessions_before_meetings INT,
    stress_reduction_avg FLOAT,
    achievements_unlocked INT,
    total_achievements INT,
    sessions_this_week INT,
    sessions_this_month INT,
    avg_session_duration INT,
    most_used_exercise_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.total_sessions,
        p.total_minutes,
        p.current_streak,
        p.longest_streak,
        p.sessions_before_meetings,
        p.stress_reduction_avg,
        (SELECT COUNT(*) FROM user_achievements WHERE user_id = p_user_id)::INT as achievements_unlocked,
        (SELECT COUNT(*) FROM achievements)::INT as total_achievements,
        (
            SELECT COUNT(*)::INT
            FROM meditation_sessions
            WHERE user_id = p_user_id
            AND completed_at >= DATE_TRUNC('week', CURRENT_DATE)
            AND completed_at IS NOT NULL
        ) as sessions_this_week,
        (
            SELECT COUNT(*)::INT
            FROM meditation_sessions
            WHERE user_id = p_user_id
            AND completed_at >= DATE_TRUNC('month', CURRENT_DATE)
            AND completed_at IS NOT NULL
        ) as sessions_this_month,
        (
            SELECT COALESCE(AVG(duration_seconds), 0)::INT
            FROM meditation_sessions
            WHERE user_id = p_user_id
            AND completed_at IS NOT NULL
        ) as avg_session_duration,
        (
            SELECT e.name
            FROM meditation_sessions ms
            JOIN exercises e ON e.id = ms.exercise_id
            WHERE ms.user_id = p_user_id
            AND ms.completed_at IS NOT NULL
            GROUP BY e.id, e.name
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) as most_used_exercise_name
    FROM progress p
    WHERE p.user_id = p_user_id;
END;
$$;

-- Function to get session history with pagination
CREATE OR REPLACE FUNCTION get_session_history(
    p_user_id UUID,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    exercise_name TEXT,
    exercise_type TEXT,
    stress_before INT,
    stress_after INT,
    stress_reduction INT,
    duration_seconds INT,
    rating INT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ms.id,
        e.name as exercise_name,
        e.type as exercise_type,
        ms.stress_before,
        ms.stress_after,
        (ms.stress_before - ms.stress_after) as stress_reduction,
        ms.duration_seconds,
        ms.rating,
        ms.started_at,
        ms.completed_at
    FROM meditation_sessions ms
    JOIN exercises e ON e.id = ms.exercise_id
    WHERE ms.user_id = p_user_id
    AND ms.completed_at IS NOT NULL
    ORDER BY ms.completed_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function to calculate stress trend over time
CREATE OR REPLACE FUNCTION get_stress_trend(
    p_user_id UUID,
    p_days INT DEFAULT 30
)
RETURNS TABLE (
    date DATE,
    avg_stress FLOAT,
    min_stress INT,
    max_stress INT,
    session_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH stress_data AS (
        SELECT 
            DATE(created_at) as log_date,
            stress_level
        FROM stress_logs
        WHERE user_id = p_user_id
        AND created_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL
    )
    SELECT 
        log_date as date,
        AVG(stress_level)::FLOAT as avg_stress,
        MIN(stress_level)::INT as min_stress,
        MAX(stress_level)::INT as max_stress,
        COUNT(*)::INT as session_count
    FROM stress_data
    GROUP BY log_date
    ORDER BY log_date DESC;
END;
$$;

-- Function to recommend next exercise based on context
CREATE OR REPLACE FUNCTION recommend_exercise(
    p_user_id UUID,
    p_current_stress INT DEFAULT NULL,
    p_time_available_seconds INT DEFAULT NULL
)
RETURNS TABLE (
    exercise_id UUID,
    exercise_name TEXT,
    exercise_type TEXT,
    duration_seconds INT,
    description TEXT,
    recommendation_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_most_effective_type TEXT;
    v_avg_stress_reduction FLOAT;
BEGIN
    -- Find most effective exercise type for user
    SELECT e.type, AVG(ms.stress_before - ms.stress_after)
    INTO v_most_effective_type, v_avg_stress_reduction
    FROM meditation_sessions ms
    JOIN exercises e ON e.id = ms.exercise_id
    WHERE ms.user_id = p_user_id
    AND ms.completed_at IS NOT NULL
    AND ms.stress_before IS NOT NULL
    AND ms.stress_after IS NOT NULL
    GROUP BY e.type
    ORDER BY AVG(ms.stress_before - ms.stress_after) DESC
    LIMIT 1;
    
    RETURN QUERY
    SELECT 
        e.id as exercise_id,
        e.name as exercise_name,
        e.type as exercise_type,
        e.duration_seconds,
        e.description,
        CASE 
            WHEN p_current_stress IS NOT NULL AND p_current_stress >= 8 THEN 
                'Recommended for high stress - quick relief'
            WHEN e.type = v_most_effective_type THEN 
                'Most effective for you (avg -' || ROUND(v_avg_stress_reduction, 1) || ' stress)'
            WHEN p_time_available_seconds IS NOT NULL AND e.duration_seconds <= p_time_available_seconds THEN
                'Fits your available time'
            ELSE
                'Popular choice'
        END as recommendation_reason
    FROM exercises e
    WHERE 
        (p_time_available_seconds IS NULL OR e.duration_seconds <= p_time_available_seconds)
        AND (
            (p_current_stress IS NOT NULL AND p_current_stress >= 8 AND e.type = 'breathing')
            OR (e.type = v_most_effective_type)
            OR (v_most_effective_type IS NULL)
        )
    ORDER BY 
        CASE 
            WHEN p_current_stress IS NOT NULL AND p_current_stress >= 8 AND e.type = 'breathing' THEN 1
            WHEN e.type = v_most_effective_type THEN 2
            ELSE 3
        END,
        RANDOM()
    LIMIT 3;
END;
$$;

-- Function to check if user should receive notification
CREATE OR REPLACE FUNCTION should_send_notification(
    p_user_id UUID,
    p_notification_type TEXT