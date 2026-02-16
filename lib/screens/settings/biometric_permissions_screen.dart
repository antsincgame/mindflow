import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../providers/health_provider.dart';
import '../../providers/settings_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_spacing.dart';
import '../../theme/app_typography.dart';

enum BiometricType {
  heartRate,
  sleep,
  activity,
  respiratory,
}

class BiometricPermissionItem {
  final BiometricType type;
  final String key;
  final String title;
  final String subtitle;
  final String description;
  final IconData icon;
  final Color color;

  const BiometricPermissionItem({
    required this.type,
    required this.key,
    required this.title,
    required this.subtitle,
    required this.description,
    required this.icon,
    required this.color,
  });
}

final _biometricItems = [
  BiometricPermissionItem(
    type: BiometricType.heartRate,
    key: 'heart_rate',
    title: 'Пульс',
    subtitle: 'Частота сердечных сокращений и HRV',
    description:
        'Данные о пульсе и вариабельности сердечного ритма помогают точнее определять уровень стресса в реальном времени. '
        'Высокий пульс и низкая HRV часто указывают на повышенное напряжение.',
    icon: Icons.favorite_rounded,
    color: AppColors.stressHigh,
  ),
  BiometricPermissionItem(
    type: BiometricType.sleep,
    key: 'sleep',
    title: 'Сон',
    subtitle: 'Качество и продолжительность сна',
    description:
        'Информация о сне позволяет учитывать вашу восстановленность при подборе упражнений. '
        'После плохого сна мы предложим более мягкие и короткие практики.',
    icon: Icons.bedtime_rounded,
    color: AppColors.softPurple,
  ),
  BiometricPermissionItem(
    type: BiometricType.activity,
    key: 'activity',
    title: 'Активность',
    subtitle: 'Шаги, калории и физическая нагрузка',
    description:
        'Данные об активности помогают понять, достаточно ли вы двигаетесь. '
        'При низкой активности мы можем рекомендовать упражнения с элементами движения.',
    icon: Icons.directions_walk_rounded,
    color: AppColors.gentleGreen,
  ),
  BiometricPermissionItem(
    type: BiometricType.respiratory,
    key: 'respiratory',
    title: 'Дыхание',
    subtitle: 'Частота дыхания',
    description:
        'Частота дыхания — важный индикатор вашего текущего состояния. '
        'Учащённое дыхание может говорить о тревоге, и мы подберём подходящее дыхательное упражнение.',
    icon: Icons.air_rounded,
    color: AppColors.calmingBlue,
  ),
];

class BiometricPermissionsScreen extends ConsumerStatefulWidget {
  const BiometricPermissionsScreen({super.key});

  @override
  ConsumerState<BiometricPermissionsScreen> createState() =>
      _BiometricPermissionsScreenState();
}

class _BiometricPermissionsScreenState
    extends ConsumerState<BiometricPermissionsScreen> {
  String? _expandedKey;
  bool _isRequestingPermission = false;

  @override
  Widget build(BuildContext context) {
    final settings = ref.watch(settingsProvider);
    final biometricPermissions =
        settings.valueOrNull?.biometricPermissions ?? {};

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Биометрические данные',
          style: AppTypography.heading3,
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(
            horizontal: AppSpacing.screenPaddingH,
            vertical: AppSpacing.md,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeaderCard(context),
              SizedBox(height: AppSpacing.lg),
              ..._biometricItems.map(
                (item) => _buildPermissionCard(
                  context,
                  item: item,
                  isEnabled: biometricPermissions[item.key] ?? false,
                ),
              ),
              SizedBox(height: AppSpacing.lg),
              _buildPrivacyNote(context),
              SizedBox(height: AppSpacing.xl),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeaderCard(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDark
              ? [
                  AppColors.calmingBlue.withOpacity(0.2),
                  AppColors.softPurple.withOpacity(0.15),
                ]
              : [
                  AppColors.calmingBlue.withOpacity(0.1),
                  AppColors.softPurple.withOpacity(0.08),
                ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
      ),
      child: Column(
        children: [
          Icon(
            Icons.health_and_safety_rounded,
            size: 48.sp,
            color: AppColors.calmingBlue,
          ),
          SizedBox(height: AppSpacing.md),
          Text(
            'Apple Health',
            style: AppTypography.heading3.copyWith(
              color: theme.colorScheme.onSurface,
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: AppSpacing.sm),
          Text(
            'Подключите данные о здоровье для более точного анализа стресса и персональных рекомендаций',
            style: AppTypography.bodyMedium.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.7),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildPermissionCard(
    BuildContext context, {
    required BiometricPermissionItem item,
    required bool isEnabled,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isExpanded = _expandedKey == item.key;

    return Padding(
      padding: EdgeInsets.only(bottom: AppSpacing.md),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        decoration: BoxDecoration(
          color: isDark
              ? theme.colorScheme.surface
              : theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          border: Border.all(
            color: isEnabled
                ? item.color.withOpacity(0.4)
                : theme.colorScheme.outline.withOpacity(0.15),
            width: isEnabled ? 1.5 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: isEnabled
                  ? item.color.withOpacity(0.08)
                  : Colors.black.withOpacity(0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            InkWell(
              onTap: () {
                setState(() {
                  _expandedKey = isExpanded ? null : item.key;
                });
              },
              borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
              child: Padding(
                padding: EdgeInsets.all(AppSpacing.md),
                child: Row(
                  children: [
                    Container(
                      width: 48.w,
                      height: 48.w,
                      decoration: BoxDecoration(
                        color: item.color.withOpacity(isEnabled ? 0.15 : 0.08),
                        borderRadius:
                            BorderRadius.circular(AppSpacing.radiusMd),
                      ),
                      child: Icon(
                        item.icon,
                        color: isEnabled
                            ? item.color
                            : item.color.withOpacity(0.5),
                        size: 24.sp,
                      ),
                    ),
                    SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.title,
                            style: AppTypography.bodyLarge.copyWith(
                              fontWeight: FontWeight.w600,
                              color: theme.colorScheme.onSurface,
                            ),
                          ),
                          SizedBox(height: 2.h),
                          Text(
                            item.subtitle,
                            style: AppTypography.bodySmall.copyWith(
                              color: theme.colorScheme.onSurface
                                  .withOpacity(0.6),
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(width: AppSpacing.sm),
                    AnimatedRotation(
                      turns: isExpanded ? 0.5 : 0,
                      duration: const Duration(milliseconds: 200),
                      child: Icon(
                        Icons.keyboard_arrow_down_rounded,
                        color:
                            theme.colorScheme.onSurface.withOpacity(0.4),
                        size: 24.sp,
                      ),
                    ),
                    SizedBox(width: AppSpacing.xs),
                    IgnorePointer(
                      ignoring: _isRequestingPermission,
                      child: Switch.adaptive(
                        value: isEnabled,
                        onChanged: (value) =>
                            _onTogglePermission(item, value),
                        activeColor: item.color,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            AnimatedCrossFade(
              firstChild: const SizedBox.shrink(),
              secondChild: _buildExpandedDescription(context, item, isEnabled),
              crossFadeState: isExpanded
                  ? CrossFadeState.showSecond
                  : CrossFadeState.showFirst,
              duration: const Duration(milliseconds: 250),
              sizeCurve: Curves.easeInOut,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildExpandedDescription(
    BuildContext context,
    BiometricPermissionItem item,
    bool isEnabled,
  ) {
    final theme = Theme.of(context);

    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(
        AppSpacing.md,
        0,
        AppSpacing.md,
        AppSpacing.md,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Divider(
            color: theme.colorScheme.outline.withOpacity(0.1),
            height: 1,
          ),
          SizedBox(height: AppSpacing.md),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                Icons.info_outline_rounded,
                size: 18.sp,
                color: item.color.withOpacity(0.7),
              ),
              SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  item.description,
                  style: AppTypography.bodyMedium.copyWith(
                    color: theme.colorScheme.onSurface.withOpacity(0.7),
                    height: 1.5,
                  ),
                ),
              ),
            ],
          ),
          if (!isEnabled) ...[
            SizedBox(height: AppSpacing.md),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _isRequestingPermission
                    ? null
                    : () => _onTogglePermission(item, true),
                icon: Icon(
                  Icons.lock_open_rounded,
                  size: 18.sp,
                ),
                label: const Text('Разрешить доступ'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: item.color,
                  side: BorderSide(color: item.color.withOpacity(0.5)),
                  shape: RoundedRectangleBorder(
                    borderRadius:
                        BorderRadius.circular(AppSpacing.radiusMd),
                  ),
                  padding: EdgeInsets.symmetric(
                    vertical: AppSpacing.sm,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPrivacyNote(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: theme.colorScheme.onSurface.withOpacity(0.04),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.shield_rounded,
            size: 20.sp,
            color: AppColors.gentleGreen,
          ),
          SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Ваши данные в безопасности',
                  style: AppTypography.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                SizedBox(height: 4.h),
                Text(
                  'Все биометрические данные хранятся только на вашем устройстве и никогда не передаются на внешние серверы. '
                  'Вы можете отключить доступ в любой момент.',
                  style: AppTypography.bodySmall.copyWith(
                    color: theme.colorScheme.onSurface.withOpacity(0.6),
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _onTogglePermission(
    BiometricPermissionItem item,
    bool value,
  ) async {
    if (_isRequestingPermission) return;

    setState(() {
      _isRequestingPermission = true;
    });

    try {
      if (value) {
        final healthNotifier = ref.read(healthProvider.not