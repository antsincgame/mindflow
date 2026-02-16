import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../providers/health_provider.dart';
import '../../providers/session_provider.dart';
import '../../providers/statistics_provider.dart';
import '../../providers/exercise_provider.dart';
import '../../components/stress_level_indicator.dart';
import '../../components/mini_stat_card.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_spacing.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final healthState = ref.watch(healthProvider);
    final statisticsState = ref.watch(statisticsProvider);
    final lastSession = ref.watch(lastSessionProvider);
    final exercises = ref.watch(exerciseProvider);

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.screenPaddingH,
            vertical: AppSpacing.screenPaddingV,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: AppSpacing.lg),
              _buildGreeting(context),
              const SizedBox(height: AppSpacing.xl),
              _buildStressSection(context, ref, healthState),
              const SizedBox(height: AppSpacing.xxl),
              _buildMainButton(context),
              const SizedBox(height: AppSpacing.xxl),
              _buildQuickStats(context, statisticsState),
              const SizedBox(height: AppSpacing.xl),
              _buildLastExercise(context, ref, lastSession, exercises),
              const SizedBox(height: AppSpacing.xl),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGreeting(BuildContext context) {
    final hour = DateTime.now().hour;
    String greeting;
    String emoji;

    if (hour < 6) {
      greeting = 'Доброй ночи';
      emoji = '🌙';
    } else if (hour < 12) {
      greeting = 'Доброе утро';
      emoji = '☀️';
    } else if (hour < 18) {
      greeting = 'Добрый день';
      emoji = '🌤️';
    } else {
      greeting = 'Добрый вечер';
      emoji = '🌅';
    }

    return Column(
      children: [
        Text(
          emoji,
          style: const TextStyle(fontSize: 36),
        )
            .animate()
            .fadeIn(duration: 600.ms)
            .scale(begin: const Offset(0.5, 0.5), end: const Offset(1, 1)),
        const SizedBox(height: AppSpacing.sm),
        Text(
          greeting,
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w600,
                color: Theme.of(context).colorScheme.onSurface,
              ),
        ).animate().fadeIn(duration: 600.ms, delay: 200.ms).slideY(begin: 0.2),
      ],
    );
  }

  Widget _buildStressSection(
    BuildContext context,
    WidgetRef ref,
    AsyncValue<HealthState> healthState,
  ) {
    return healthState.when(
      data: (health) {
        final stressLevel = health.stressLevel;
        if (stressLevel == null) {
          return _buildNoStressData(context);
        }
        return Container(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surfaceContainerLowest,
            borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
            boxShadow: [
              BoxShadow(
                color: Theme.of(context)
                    .colorScheme
                    .shadow
                    .withOpacity(0.05),
                blurRadius: 20,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              Text(
                'Текущий уровень стресса',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: Theme.of(context)
                          .colorScheme
                          .onSurface
                          .withOpacity(0.6),
                    ),
              ),
              const SizedBox(height: AppSpacing.md),
              StressLevelIndicator(
                level: stressLevel,
                size: 120,
                showLabel: true,
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                _stressMessage(stressLevel),
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context)
                          .colorScheme
                          .onSurface
                          .withOpacity(0.7),
                    ),
              ),
            ],
          ),
        )
            .animate()
            .fadeIn(duration: 600.ms, delay: 400.ms)
            .slideY(begin: 0.1);
      },
      loading: () => Container(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: const CircularProgressIndicator.adaptive(),
      ),
      error: (_, __) => _buildNoStressData(context),
    );
  }

  Widget _buildNoStressData(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
      ),
      child: Column(
        children: [
          Icon(
            Icons.favorite_border_rounded,
            size: 48,
            color: AppColors.calmingBlue.withOpacity(0.5),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Подключите Apple Health\nдля отслеживания стресса',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context)
                      .colorScheme
                      .onSurface
                      .withOpacity(0.5),
                ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 600.ms, delay: 400.ms);
  }

  Widget _buildMainButton(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/emotion-selection'),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(
          vertical: AppSpacing.xl,
          horizontal: AppSpacing.lg,
        ),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AppColors.calmingBlue,
              AppColors.softPurple,
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
          boxShadow: [
            BoxShadow(
              color: AppColors.calmingBlue.withOpacity(0.3),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          children: [
            const Text(
              '🧘',
              style: TextStyle(fontSize: 48),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Как ты себя чувствуешь?',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Нажми, чтобы начать упражнение',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.white.withOpacity(0.8),
                  ),
            ),
          ],
        ),
      ),
    )
        .animate()
        .fadeIn(duration: 600.ms, delay: 600.ms)
        .scale(
          begin: const Offset(0.95, 0.95),
          end: const Offset(1, 1),
          duration: 600.ms,
          delay: 600.ms,
        )
        .then()
        .shimmer(
          duration: 2000.ms,
          delay: 1000.ms,
          color: Colors.white.withOpacity(0.1),
        );
  }

  Widget _buildQuickStats(
    BuildContext context,
    AsyncValue<StatisticsState> statisticsState,
  ) {
    return statisticsState.when(
      data: (stats) {
        return Row(
          children: [
            Expanded(
              child: MiniStatCard(
                icon: Icons.self_improvement_rounded,
                value: '${stats.todaySessions}',
                label: 'Сегодня',
                trend: stats.sessionsTrend,
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: MiniStatCard(
                icon: Icons.local_fire_department_rounded,
                value: '${stats.currentStreak}',
                label: 'Дней подряд',
                trend: null,
                accentColor: AppColors.gentleGreen,
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: MiniStatCard(
                icon: Icons.timer_rounded,
                value: '${stats.totalMinutesThisWeek}',
                label: 'Мин/нед',
                trend: stats.durationTrend,
                accentColor: AppColors.softPurple,
              ),
            ),
          ],
        )
            .animate()
            .fadeIn(duration: 600.ms, delay: 800.ms)
            .slideY(begin: 0.1);
      },
      loading: () => const SizedBox(
        height: 80,
        child: Center(child: CircularProgressIndicator.adaptive()),
      ),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildLastExercise(
    BuildContext context,
    WidgetRef ref,
    AsyncValue<SessionData?> lastSession,
    AsyncValue<List<ExerciseData>> exercises,
  ) {
    return lastSession.when(
      data: (session) {
        if (session == null) {
          return const SizedBox.shrink();
        }

        final exercise = exercises.whenOrNull(
          data: (list) {
            try {
              return list.firstWhere((e) => e.id == session.exerciseId);
            } catch (_) {
              return null;
            }
          },
        );

        if (exercise == null) return const SizedBox.shrink();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(left: AppSpacing.xs),
              child: Text(
                'Продолжить',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            GestureDetector(
              onTap: () => context.push(
                '/exercise-session',
                extra: exercise,
              ),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(AppSpacing.lg),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerLowest,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                  border: Border.all(
                    color: AppColors.gentleGreen.withOpacity(0.3),
                    width: 1,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: AppColors.gentleGreen.withOpacity(0.1),
                        borderRadius:
                            BorderRadius.circular(AppSpacing.radiusMd),
                      ),
                      child: Center(
                        child: Text(
                          exercise.icon,
                          style: const TextStyle(fontSize: 24),
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            exercise.name,
                            style: Theme.of(context)
                                .textTheme
                                .titleSmall
                                ?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${exercise.durationSeconds ~/ 60} мин • ${exercise.typeName}',
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .onSurface
                                      .withOpacity(0.5),
                                ),
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      Icons.play_circle_filled_rounded,
                      color: AppColors.gentleGreen,
                      size: 40,
                    ),
                  ],
                ),
              ),
            ),
          ],
        )
            .animate()
            .fadeIn(duration: 600.ms, delay: 1000.ms)
            .slideY(begin: 0.1);
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  String _stressMessage(int level) {
    if (level <= 25) {
      return 'Вы спокойны и расслаблены 🌿\nОтличное время для медитации';
    } else if (level <= 50) {
      return 'Небольшое напряжение 🌤️\nДыхательное упражнение поможет';
    } else if (level <= 75) {
      return 'Повышенный стресс 🌊\nРекомендуем сделать перерыв';
    } else {
      return 'Высокий уровень стресса ⚡\nДавайте подышим вместе';
    }
  }
}