import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../models/emotion.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';

class EmotionCard extends StatefulWidget {
  final Emotion emotion;
  final VoidCallback? onTap;
  final bool isSelected;

  const EmotionCard({
    super.key,
    required this.emotion,
    this.onTap,
    this.isSelected = false,
  });

  @override
  State<EmotionCard> createState() => _EmotionCardState();
}

class _EmotionCardState extends State<EmotionCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _scaleController;
  late Animation<double> _scaleAnimation;
  bool _isPressed = false;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.93).animate(
      CurvedAnimation(
        parent: _scaleController,
        curve: Curves.easeInOut,
      ),
    );
  }

  @override
  void dispose() {
    _scaleController.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails details) {
    setState(() => _isPressed = true);
    _scaleController.forward();
  }

  void _onTapUp(TapUpDetails details) {
    setState(() => _isPressed = false);
    _scaleController.reverse();
    widget.onTap?.call();
  }

  void _onTapCancel() {
    setState(() => _isPressed = false);
    _scaleController.reverse();
  }

  Gradient _buildGradient() {
    final colors = _emotionGradientColors(widget.emotion.type);
    return LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: colors,
    );
  }

  List<Color> _emotionGradientColors(EmotionType type) {
    switch (type) {
      case EmotionType.sadness:
        return [
          AppColors.sadnessLight,
          AppColors.sadnessDark,
        ];
      case EmotionType.stress:
        return [
          AppColors.stressLight,
          AppColors.stressDark,
        ];
      case EmotionType.anxiety:
        return [
          AppColors.anxietyLight,
          AppColors.anxietyDark,
        ];
      case EmotionType.fatigue:
        return [
          AppColors.fatigueLight,
          AppColors.fatigueDark,
        ];
    }
  }

  String _emotionIcon(EmotionType type) {
    switch (type) {
      case EmotionType.sadness:
        return '☁️';
      case EmotionType.stress:
        return '⚡';
      case EmotionType.anxiety:
        return '🌀';
      case EmotionType.fatigue:
        return '🪫';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: child,
        );
      },
      child: GestureDetector(
        onTapDown: _onTapDown,
        onTapUp: _onTapUp,
        onTapCancel: _onTapCancel,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeInOut,
          decoration: BoxDecoration(
            gradient: _buildGradient(),
            borderRadius: BorderRadius.circular(AppSpacing.radiusXL),
            border: widget.isSelected
                ? Border.all(
                    color: isDark ? Colors.white70 : Colors.white,
                    width: 3.0,
                  )
                : null,
            boxShadow: [
              BoxShadow(
                color: _emotionGradientColors(widget.emotion.type)
                    .last
                    .withOpacity(_isPressed ? 0.2 : 0.35),
                blurRadius: _isPressed ? 8 : 16,
                offset: Offset(0, _isPressed ? 4 : 8),
                spreadRadius: _isPressed ? -2 : 0,
              ),
            ],
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.xl,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _emotionIcon(widget.emotion.type),
                style: const TextStyle(fontSize: 64),
              )
                  .animate(
                    onPlay: (controller) => controller.repeat(reverse: true),
                  )
                  .scaleXY(
                    begin: 1.0,
                    end: 1.08,
                    duration: 2000.ms,
                    curve: Curves.easeInOut,
                  ),
              const SizedBox(height: AppSpacing.md),
              Text(
                widget.emotion.name,
                style: AppTypography.headlineMedium.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
              ),
              if (widget.emotion.description != null &&
                  widget.emotion.description!.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.sm),
                Text(
                  widget.emotion.description!,
                  style: AppTypography.bodyMedium.copyWith(
                    color: Colors.white.withOpacity(0.85),
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              if (widget.isSelected) ...[
                const SizedBox(height: AppSpacing.md),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.md,
                    vertical: AppSpacing.xs,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(AppSpacing.radiusLG),
                  ),
                  child: Text(
                    'Выбрано',
                    style: AppTypography.labelMedium.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    )
        .animate()
        .fadeIn(duration: 400.ms, curve: Curves.easeOut)
        .slideY(begin: 0.1, end: 0, duration: 400.ms, curve: Curves.easeOut);
  }
}

class AnimatedBuilder extends AnimatedWidget {
  final Widget Function(BuildContext context, Widget? child) builder;
  final Widget? child;

  const AnimatedBuilder({
    super.key,
    required super.listenable,
    required this.builder,
    this.child,
  });

  @override
  Widget build(BuildContext context) {
    return builder(context, child);
  }
}