import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../models/emotion.dart';
import '../../providers/emotion_provider.dart';
import '../../components/emotion_card.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_spacing.dart';
import '../../theme/app_typography.dart';

class EmotionSelectionScreen extends ConsumerStatefulWidget {
  const EmotionSelectionScreen({super.key});

  @override
  ConsumerState<EmotionSelectionScreen> createState() =>
      _EmotionSelectionScreenState();
}

class _EmotionSelectionScreenState
    extends ConsumerState<EmotionSelectionScreen>
    with TickerProviderStateMixin {
  int _currentIndex = 0;
  late final PageController _pageController;
  late final AnimationController _pulseController;
  bool _isTransitioning = false;

  static const List<_EmotionCardData> _emotions = [
    _EmotionCardData(
      type: EmotionType.sadness,
      label: 'Грусть',
      icon: '☁️',
      description: 'Чувствую печаль или подавленность',
      gradient: [Color(0xFF7EB6D8), Color(0xFF5A9BC7)],
    ),
    _EmotionCardData(
      type: EmotionType.stress,
      label: 'Стресс',
      icon: '⚡',
      description: 'Чувствую напряжение или давление',
      gradient: [Color(0xFFE8A87C), Color(0xFFD4845A)],
    ),
    _EmotionCardData(
      type: EmotionType.anxiety,
      label: 'Беспокойство',
      icon: '🌀',
      description: 'Чувствую тревогу или волнение',
      gradient: [Color(0xFFB39DDB), Color(0xFF9575CD)],
    ),
    _EmotionCardData(
      type: EmotionType.fatigue,
      label: 'Усталость',
      icon: '🪫',
      description: 'Чувствую истощение или нехватку сил',
      gradient: [Color(0xFF81C784), Color(0xFF66BB6A)],
    ),
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController(
      viewportFraction: 0.78,
      initialPage: 0,
    );
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pageController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _onEmotionSelected(_EmotionCardData data) async {
    if (_isTransitioning) return;
    setState(() => _isTransitioning = true);

    final emotion = Emotion(
      id: data.type.name,
      type: data.type,
      name: data.label,
      icon: data.icon,
      color: data.gradient.first,
      description: data.description,
    );

    ref.read(emotionProvider.notifier).selectEmotion(emotion);

    await Future.delayed(const Duration(milliseconds: 350));

    if (mounted) {
      context.push('/exercises', extra: emotion);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF121212) : const Color(0xFFF8F9FE),
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(context, isDark),
            SizedBox(height: screenHeight * 0.02),
            _buildTitle(isDark)
                .animate()
                .fadeIn(duration: 500.ms)
                .slideY(begin: -0.1, end: 0),
            SizedBox(height: screenHeight * 0.01),
            _buildSubtitle(isDark)
                .animate()
                .fadeIn(duration: 500.ms, delay: 150.ms)
                .slideY(begin: -0.1, end: 0),
            SizedBox(height: screenHeight * 0.04),
            Expanded(
              child: _buildCardCarousel(isDark),
            ),
            _buildPageIndicator(isDark)
                .animate()
                .fadeIn(duration: 400.ms, delay: 400.ms),
            SizedBox(height: screenHeight * 0.02),
            _buildSwipeHint(isDark)
                .animate()
                .fadeIn(duration: 400.ms, delay: 600.ms),
            SizedBox(height: screenHeight * 0.03),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: () => context.pop(),
            icon: Icon(
              Icons.arrow_back_ios_new_rounded,
              color: isDark ? Colors.white70 : Colors.black54,
              size: 22,
            ),
            style: IconButton.styleFrom(
              backgroundColor: isDark
                  ? Colors.white.withOpacity(0.08)
                  : Colors.black.withOpacity(0.04),
              padding: const EdgeInsets.all(AppSpacing.sm),
            ),
          ),
          const Spacer(),
        ],
      ),
    );
  }

  Widget _buildTitle(bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Text(
        'Как ты себя чувствуешь?',
        style: TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w700,
          color: isDark ? Colors.white : const Color(0xFF1A1A2E),
          height: 1.2,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }

  Widget _buildSubtitle(bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
      child: Text(
        'Выбери эмоцию, которая ближе всего\nк твоему состоянию прямо сейчас',
        style: TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w400,
          color: isDark ? Colors.white54 : Colors.black45,
          height: 1.5,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }

  Widget _buildCardCarousel(bool isDark) {
    return PageView.builder(
      controller: _pageController,
      itemCount: _emotions.length,
      onPageChanged: (index) {
        setState(() => _currentIndex = index);
      },
      physics: const BouncingScrollPhysics(),
      itemBuilder: (context, index) {
        final data = _emotions[index];
        return AnimatedBuilder(
          animation: _pageController,
          builder: (context, child) {
            double value = 1.0;
            if (_pageController.position.haveDimensions) {
              value = (_pageController.page ?? 0) - index;
              value = (1 - (value.abs() * 0.25)).clamp(0.0, 1.0);
            }
            return Center(
              child: SizedBox(
                height: Curves.easeOut.transform(value) * 420,
                child: child,
              ),
            );
          },
          child: _buildEmotionCard(data, index, isDark),
        );
      },
    );
  }

  Widget _buildEmotionCard(
      _EmotionCardData data, int index, bool isDark) {
    final isActive = _currentIndex == index;

    return GestureDetector(
      onTap: () => _onEmotionSelected(data),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
        margin: EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: isActive ? 0 : 20,
        ),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isActive
                ? data.gradient
                : data.gradient
                    .map((c) => c.withOpacity(isDark ? 0.5 : 0.7))
                    .toList(),
          ),
          borderRadius: BorderRadius.circular(28),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: data.gradient.first.withOpacity(0.35),
                    blurRadius: 30,
                    offset: const Offset(0, 15),
                    spreadRadius: 0,
                  ),
                ]
              : [
                  BoxShadow(
                    color: data.gradient.first.withOpacity(0.15),
                    blurRadius: 15,
                    offset: const Offset(0, 8),
                  ),
                ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedBuilder(
                animation: _pulseController,
                builder: (context, child) {
                  final scale = isActive
                      ? 1.0 + (_pulseController.value * 0.06)
                      : 1.0;
                  return Transform.scale(
                    scale: scale,
                    child: child,
                  );
                },
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      data.icon,
                      style: const TextStyle(fontSize: 52),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              Text(
                data.label,
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                  letterSpacing: 0.3,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                data.description,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w400,
                  color: Colors.white.withOpacity(0.85),
                  height: 1.4,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.lg),
              if (isActive)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.lg,
                    vertical: AppSpacing.sm + 2,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.25),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: Colors.white.withOpacity(0.3),
                      width: 1,
                    ),
                  ),
                  child: const Text(
                    'Нажми, чтобы выбрать',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                )
                    .animate(
                      onPlay: (c) => c.repeat(reverse: true),
                    )
                    .fadeIn(duration: 600.ms)
                    .then()
                    .shimmer(
                      duration: 1800.ms,
                      color: Colors.white.withOpacity(0.3),
                    ),
            ],
          ),
        ),
      ),
    )
        .animate()
        .fadeIn(
          duration: 400.ms,
          delay: Duration(milliseconds: 100 * index),
        )
        .slideY(
          begin: 0.15,
          end: 0,
          duration: 400.ms,
          delay: Duration(milliseconds: 100 * index),
          curve: Curves.easeOutCubic,
        );
  }

  Widget _buildPageIndicator(bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(
          _emotions.length,
          (index) {
            final isActive = _currentIndex == index;
            final data = _emotions[index];
            return AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOutCubic,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              width: isActive ? 28 : 8,
              height: 8,
              decoration: BoxDecoration(
                color: isActive
                    ? data.gradient.first
                    : (isDark ? Colors.white24 : Colors.black12),
                borderRadius: BorderRadius.circular(4),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildSwipeHint(bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.swipe_rounded,
          size: 18,
          color: isDark ? Colors.white30 : Colors.black26,
        ),
        const SizedBox(width: 6),
        Text(
          'Листай для выбора',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w400,
            color: isDark ? Colors.white30 : Colors.black26,
          ),
        ),
      ],
    );
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

class _EmotionCardData {
  final EmotionType type;
  final String label;
  final String icon;
  final String description;
  final List<Color> gradient;

  const _EmotionCardData({
    required this.type,
    required this.label,
    required this.icon,
    required this.description,
    required this.gradient,
  });
}