import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../models/emotion.dart';
import '../../models/exercise.dart';
import '../../providers/emotion_provider.dart';
import '../../providers/exercise_provider.dart';
import '../../providers/health_provider.dart';
import '../../components/exercise_card.dart';
import '../../components/stress_level_indicator.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_spacing.dart';
import '../../theme/app_typography.dart';

class ExerciseListScreen extends ConsumerWidget {
  const ExerciseListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedEmotion = ref.watch(selectedEmotionProvider);
    final exercisesAsync = ref.watch(filteredExercisesProvider);
    final healthData = ref.watch(currentHealthDataProvider);
    final stressLevel = ref.watch(currentStressLevelProvider);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios_rounded,
            color: Theme.of(context).iconTheme.color,
          ),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Упражнения',
          style: AppTypography.heading3.copyWith(
            color: Theme.of(context).textTheme.titleLarge?.color,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (selectedEmotion != null)
              _buildEmotionHeader(context, selectedEmotion, stressLevel),
            const SizedBox(height: AppSpacing.md),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Text(
                'Рекомендуемые упражнения',
                style: AppTypography.heading4.copyWith(
                  color: Theme.of(context).textTheme.titleMedium?.color,
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Expanded(
              child: exercisesAsync.when(
                data: (exercises) => _buildExerciseList(context, exercises),
                loading: () => _buildLoadingState(),
                error: (error, stack) => _buildErrorState(context, error, ref),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmotionHeader(
    BuildContext context,
    Emotion emotion,
    AsyncValue<int> stressLevel,
  ) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            emotion.color.withOpacity(0.15),
            emotion.color.withOpacity(0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(
          color: emotion.color.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: emotion.color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            ),
            child: Center(
              child: Text(
                emotion.icon,
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
                  'Вы чувствуете: ${emotion.name}',
                  style: AppTypography.bodyMedium.copyWith(
                    color: Theme.of(context).textTheme.bodyLarge?.color,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  emotion.description,
                  style: AppTypography.bodySmall.copyWith(
                    color: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.color
                        ?.withOpacity(0.7),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          stressLevel.when(
            data: (level) => StressLevelIndicator(
              level: level,
              size: 44,
              compact: true,
            ),
            loading: () => const SizedBox(
              width: 44,
              height: 44,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            error: (_, __) => const SizedBox.shrink(),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.1, end: 0);
  }

  Widget _buildExerciseList(BuildContext context, List<Exercise> exercises) {
    if (exercises.isEmpty) {
      return _buildEmptyState(context);
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.sm,
      ),
      itemCount: exercises.length,
      itemBuilder: (context, index) {
        final exercise = exercises[index];
        final isRecommended = index == 0;

        return Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.md),
          child: ExerciseCard(
            exercise: exercise,
            isRecommended: isRecommended,
            onStart: () => _startExercise(context, exercise),
          ),
        )
            .animate()
            .fadeIn(
              duration: 400.ms,
              delay: Duration(milliseconds: 100 * index),
            )
            .slideX(
              begin: 0.05,
              end: 0,
              delay: Duration(milliseconds: 100 * index),
            );
      },
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(
            color: AppColors.calmingBlue,
            strokeWidth: 3,
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'Подбираем упражнения...',
            style: AppTypography.bodyMedium.copyWith(
              color: AppColors.calmingBlue,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, Object error, WidgetRef ref) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline_rounded,
              size: 64,
              color: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.color
                  ?.withOpacity(0.4),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Не удалось загрузить упражнения',
              style: AppTypography.bodyLarge.copyWith(
                color: Theme.of(context).textTheme.bodyLarge?.color,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Попробуйте ещё раз',
              style: AppTypography.bodySmall.copyWith(
                color: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.color
                    ?.withOpacity(0.6),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.lg),
            ElevatedButton.icon(
              onPressed: () {
                ref.invalidate(filteredExercisesProvider);
              },
              icon: const Icon(Icons.refresh_rounded, size: 20),
              label: const Text('Повторить'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.calmingBlue,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.sm,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              '🧘',
              style: const TextStyle(fontSize: 64),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Пока нет подходящих упражнений',
              style: AppTypography.bodyLarge.copyWith(
                color: Theme.of(context).textTheme.bodyLarge?.color,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Попробуйте выбрать другую эмоцию',
              style: AppTypography.bodySmall.copyWith(
                color: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.color
                    ?.withOpacity(0.6),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 500.ms);
  }

  void _startExercise(BuildContext context, Exercise exercise) {
    context.push('/exercise/session/${exercise.id}');
  }
}