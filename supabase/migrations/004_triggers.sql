-- Триггер для автоматического обновления прогресса после завершения сессии
CREATE OR REPLACE FUNCTION update_progress_after_session()
RETURNS TRIGGER AS $$
DECLARE
  v_session_minutes INT;
  v_stress_reduction INT;
  v_last_session_date DATE;
  v_today DATE;
  v_streak_broken BOOLEAN;
BEGIN
  -- Проверяем, что сессия завершена
  IF NEW.completed_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Вычисляем длительность сессии в минутах
  v_session_minutes := CEIL(NEW.duration_seconds / 60.0);
  
  -- Вычисляем снижение стресса
  v_stress_reduction := NEW.stress_before - NEW.stress_after;

  -- Получаем дату последней сессии и сегодняшнюю дату
  SELECT DATE(MAX(completed_at))
  INTO v_last_session_date
  FROM meditation_sessions
  WHERE user_id = NEW.user_id
    AND completed_at < NEW.completed_at
    AND completed_at IS NOT NULL;

  v_today := DATE(NEW.completed_at);

  -- Проверяем, прервался ли стрик
  v_streak_broken := FALSE;
  IF v_last_session_date IS NOT NULL THEN
    IF v_today - v_last_session_date > 1 THEN
      v_streak_broken := TRUE;
    END IF;
  END IF;

  -- Обновляем или создаем запись прогресса
  INSERT INTO progress (
    user_id,
    total_sessions,
    total_minutes,
    current_streak,
    longest_streak,
    stress_reduction_avg,
    updated_at
  )
  VALUES (
    NEW.user_id,
    1,
    v_session_minutes,
    1,
    1,
    v_stress_reduction,
    NEW.completed_at
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_sessions = progress.total_sessions + 1,
    total_minutes = progress.total_minutes + v_session_minutes,
    current_streak = CASE
      WHEN v_streak_broken THEN 1
      WHEN v_last_session_date IS NULL THEN 1
      WHEN v_today = v_last_session_date THEN progress.current_streak
      ELSE progress.current_streak + 1
    END,
    longest_streak = GREATEST(
      progress.longest_streak,
      CASE
        WHEN v_streak_broken THEN 1
        WHEN v_last_session_date IS NULL THEN 1
        WHEN v_today = v_last_session_date THEN progress.current_streak
        ELSE progress.current_streak + 1
      END
    ),
    stress_reduction_avg = (
      (progress.stress_reduction_avg * progress.total_sessions + v_stress_reduction) / 
      (progress.total_sessions + 1)
    ),
    updated_at = NEW.completed_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_progress_after_session
AFTER INSERT OR UPDATE OF completed_at ON meditation_sessions
FOR EACH ROW
EXECUTE FUNCTION update_progress_after_session();

-- Триггер для подсчета сессий перед встречами
CREATE OR REPLACE FUNCTION update_sessions_before_meetings()
RETURNS TRIGGER AS $$
DECLARE
  v_has_meeting BOOLEAN;
  v_meeting_time TIMESTAMP;
BEGIN
  -- Проверяем, что сессия завершена
  IF NEW.completed_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Проверяем, была ли встреча в течение 2 часов после сессии
  -- (данные о встречах должны храниться в context поле stress_logs или отдельной таблице)
  SELECT EXISTS(
    SELECT 1
    FROM stress_logs
    WHERE user_id = NEW.user_id
      AND created_at BETWEEN NEW.completed_at AND NEW.completed_at + INTERVAL '2 hours'
      AND context->>'trigger_type' = 'calendar_event'
  ) INTO v_has_meeting;

  IF v_has_meeting THEN
    UPDATE progress
    SET sessions_before_meetings = sessions_before_meetings + 1,
        updated_at = NEW.completed_at
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sessions_before_meetings
AFTER INSERT OR UPDATE OF completed_at ON meditation_sessions
FOR EACH ROW
EXECUTE FUNCTION update_sessions_before_meetings();

-- Триггер для автоматической разблокировки достижений
CREATE OR REPLACE FUNCTION check_achievements()
RETURNS TRIGGER AS $$
DECLARE
  v_achievement RECORD;
  v_condition JSONB;
  v_unlocked BOOLEAN;
BEGIN
  -- Проходим по всем достижениям
  FOR v_achievement IN SELECT * FROM achievements LOOP
    v_condition := v_achievement.unlock_condition;
    v_unlocked := FALSE;

    -- Проверяем условие "Первая сессия"
    IF v_condition->>'type' = 'first_session' THEN
      IF NEW.total_sessions >= 1 THEN
        v_unlocked := TRUE;
      END IF;
    END IF;

    -- Проверяем условие "N сессий"
    IF v_condition->>'type' = 'total_sessions' THEN
      IF NEW.total_sessions >= (v_condition->>'value')::INT THEN
        v_unlocked := TRUE;
      END IF;
    END IF;

    -- Проверяем условие "N минут медитации"
    IF v_condition->>'type' = 'total_minutes' THEN
      IF NEW.total_minutes >= (v_condition->>'value')::INT THEN
        v_unlocked := TRUE;
      END IF;
    END IF;

    -- Проверяем условие "Стрик N дней"
    IF v_condition->>'type' = 'streak' THEN
      IF NEW.current_streak >= (v_condition->>'value')::INT THEN
        v_unlocked := TRUE;
      END IF;
    END IF;

    -- Проверяем условие "N сессий перед встречами"
    IF v_condition->>'type' = 'sessions_before_meetings' THEN
      IF NEW.sessions_before_meetings >= (v_condition->>'value')::INT THEN
        v_unlocked := TRUE;
      END IF;
    END IF;

    -- Проверяем условие "Среднее снижение стресса"
    IF v_condition->>'type' = 'stress_reduction_avg' THEN
      IF NEW.stress_reduction_avg >= (v_condition->>'value')::FLOAT THEN
        v_unlocked := TRUE;
      END IF;
    END IF;

    -- Если достижение разблокировано, добавляем запись
    IF v_unlocked THEN
      INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
      VALUES (NEW.user_id, v_achievement.id, NEW.updated_at)
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_achievements
AFTER INSERT OR UPDATE ON progress
FOR EACH ROW
EXECUTE FUNCTION check_achievements();

-- Триггер для автоматического создания записи прогресса при создании пользователя
CREATE OR REPLACE FUNCTION create_initial_progress()
RETURNS TRIGGER AS $$
BEGIN
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
    NEW.id,
    0,
    0,
    0,
    0,
    0,
    0,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_initial_progress
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_initial_progress();

-- Триггер для обновления updated_at в таблице users
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();

-- Триггер для обновления updated_at в таблице progress
CREATE OR REPLACE FUNCTION update_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_progress_updated_at
BEFORE UPDATE ON progress
FOR EACH ROW
EXECUTE FUNCTION update_progress_updated_at();

-- Триггер для логирования уровня стресса после сессии
CREATE OR REPLACE FUNCTION log_stress_after_session()
RETURNS TRIGGER AS $$
BEGIN
  -- Проверяем, что сессия завершена
  IF NEW.completed_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Логируем уровень стресса после сессии
  INSERT INTO stress_logs (
    user_id,
    stress_level,
    source,
    context,
    created_at
  )
  VALUES (
    NEW.user_id,
    NEW.stress_after,
    'meditation_session',
    jsonb_build_object(
      'session_id', NEW.id,
      'exercise_id', NEW.exercise_id,
      'stress_before', NEW.stress_before,
      'duration_seconds', NEW.duration_seconds
    ),
    NEW.completed_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_stress_after_session
AFTER INSERT OR UPDATE OF completed_at ON meditation_sessions
FOR EACH ROW
EXECUTE FUNCTION log_stress_after_session();

-- Триггер для валидации рейтинга сессии
CREATE OR REPLACE FUNCTION validate_session_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating IS NOT NULL AND (NEW.rating < 1 OR NEW.rating > 5) THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_session_rating
BEFORE INSERT OR UPDATE OF rating ON meditation_sessions
FOR EACH ROW
EXECUTE FUNCTION validate_session_rating();

-- Триггер для валидации уровня стресса
CREATE OR REPLACE FUNCTION validate_stress_level()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stress_before IS NOT NULL AND (NEW.stress_before < 0 OR NEW.stress_before > 10) THEN
    RAISE EXCEPTION 'Stress level before must be between 0 and 10';
  END IF;
  
  IF NEW.stress_after IS NOT NULL AND (NEW.stress_after < 0 OR NEW.stress_after > 10) THEN
    RAISE EXCEPTION 'Stress level after must be between 0 and 10';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_stress_level
BEFORE INSERT OR UPDATE ON meditation_sessions
FOR EACH ROW
EXECUTE FUNCTION validate_stress_level();

-- Индексы для оптимизации работы триггеров
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_user_completed 
ON meditation_sessions(user_id, completed_at DESC) 
WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stress_logs_user_created 
ON stress_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stress_logs_context_trigger 
ON stress_logs USING GIN(context) 
WHERE context->>'trigger_type' = 'calendar_event';

CREATE INDEX IF NOT EXISTS idx_user_achievements_user 
ON user_achievements(user_id, achievement_id);

-- Комментарии к триггерам
COMMENT ON TRIGGER trigger_update_progress_after_session ON meditation_sessions IS 
'Автоматически обновляет прогресс пользователя после завершения медитационной сессии: общее количество сессий, минут, стрики, среднее снижение стресса';

COMMENT ON TRIGGER trigger_update_sessions_before_meetings ON meditation_sessions IS 
'Подсчитывает количество сессий, проведенных перед важными встречами (в течение 2 часов до события)';

COMMENT ON TRIGGER trigger_check_achievements ON progress IS 
'Проверяет и автоматически разблокирует достижения на основе условий (количество сессий, стрики, снижение стресса и т.д.)';

COMMENT ON TRIGGER trigger_create_initial_progress ON users IS 
'Создает начальную запись прогресса для нового пользователя с нулевыми значениями';

COMMENT ON TRIGGER trigger_update_users_updated_at ON users IS 
'Автоматически обновляет поле updated_at при изменении записи пользователя';

COMMENT ON TRIGGER trigger_update_progress_updated_at ON progress IS 
'Автоматически обновляет поле updated_at при изменении записи прогресса';

COMMENT ON TRIGGER trigger_log_stress_after_session ON meditation_sessions IS 
'Логирует уровень стресса после завершения сессии в таблицу stress_logs для исторического анализа';

COMMENT ON TRIGGER trigger_validate_session_rating ON meditation_sessions IS 
'Валидирует рейтинг сессии (должен быть от 1 до 5)';

COMMENT ON TRIGGER trigger_validate_stress_level ON meditation_sessions IS 
'Валидирует уровень стресса до и после сессии (должен быть от 0 до 10)';