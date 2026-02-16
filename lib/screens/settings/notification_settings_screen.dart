import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';

import '../../models/notification_settings.dart';
import '../../providers/settings_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_spacing.dart';
import '../../theme/app_typography.dart';

class NotificationSettingsScreen extends ConsumerStatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  ConsumerState<NotificationSettingsScreen> createState() =>
      _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState
    extends ConsumerState<NotificationSettingsScreen> {
  late NotificationMode _selectedMode;
  late List<TimeOfDay> _scheduledTimes;
  late bool _smartEnabled;
  late int _smartThreshold;

  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      _initFromProvider();
      _initialized = true;
    }
  }

  void _initFromProvider() {
    final settings = ref.read(settingsProvider);
    final notificationSettings = settings.notificationSettings;
    _selectedMode = notificationSettings?.mode ?? NotificationMode.manual;
    _scheduledTimes =
        List<TimeOfDay>.from(notificationSettings?.scheduledTimes ?? []);
    _smartEnabled = notificationSettings?.smartEnabled ?? false;
    _smartThreshold = notificationSettings?.smartThreshold ?? 70;
  }

  void _saveSettings() {
    final notificationSettings = NotificationSettings(
      mode: _selectedMode,
      scheduledTimes: _scheduledTimes,
      smartEnabled: _smartEnabled,
      smartThreshold: _smartThreshold,
    );
    ref
        .read(settingsProvider.notifier)
        .updateNotificationSettings(notificationSettings);
  }

  Future<void> _addTime() async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: Theme.of(context).colorScheme.copyWith(
                  primary: AppColors.calmingBlue,
                  onPrimary: Colors.white,
                ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      final alreadyExists = _scheduledTimes.any(
        (t) => t.hour == picked.hour && t.minute == picked.minute,
      );
      if (!alreadyExists) {
        setState(() {
          _scheduledTimes.add(picked);
          _scheduledTimes.sort((a, b) {
            final aMinutes = a.hour * 60 + a.minute;
            final bMinutes = b.hour * 60 + b.minute;
            return aMinutes.compareTo(bMinutes);
          });
        });
        _saveSettings();
      }
    }
  }

  void _removeTime(int index) {
    setState(() {
      _scheduledTimes.removeAt(index);
    });
    _saveSettings();
  }

  void _setMode(NotificationMode mode) {
    setState(() {
      _selectedMode = mode;
      if (mode == NotificationMode.smart) {
        _smartEnabled = true;
      } else if (mode == NotificationMode.manual) {
        _smartEnabled = false;
      } else {
        _smartEnabled = true;
      }
    });
    _saveSettings();
  }

  String _formatTimeOfDay(TimeOfDay time) {
    final now = DateTime.now();
    final dt = DateTime(now.year, now.month, now.day, time.hour, time.minute);
    return DateFormat.jm().format(dt);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Уведомления',
          style: AppTypography.heading2(context),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.symmetric(
          horizontal: AppSpacing.screenPaddingH,
          vertical: AppSpacing.md,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionTitle('Режим уведомлений'),
            SizedBox(height: AppSpacing.sm),
            _buildModeCard(
              mode: NotificationMode.manual,
              icon: Icons.schedule_rounded,
              title: 'Ручное расписание',
              description: 'Выберите конкретные времена для напоминаний',
              isDark: isDark,
            ),
            SizedBox(height: AppSpacing.sm),
            _buildModeCard(
              mode: NotificationMode.smart,
              icon: Icons.auto_awesome_rounded,
              title: 'Умные уведомления',
              description:
                  'Напоминания на основе вашего уровня стресса и биометрики',
              isDark: isDark,
            ),
            SizedBox(height: AppSpacing.sm),
            _buildModeCard(
              mode: NotificationMode.combined,
              icon: Icons.merge_type_rounded,
              title: 'Комбинированный',
              description:
                  'Расписание + дополнительные напоминания при высоком стрессе',
              isDark: isDark,
            ),
            SizedBox(height: AppSpacing.lg),
            if (_selectedMode == NotificationMode.manual ||
                _selectedMode == NotificationMode.combined) ...[
              _buildSectionTitle('Расписание'),
              SizedBox(height: AppSpacing.sm),
              _buildScheduledTimesList(isDark),
              SizedBox(height: AppSpacing.md),
              _buildAddTimeButton(isDark),
              SizedBox(height: AppSpacing.lg),
            ],
            if (_selectedMode == NotificationMode.smart ||
                _selectedMode == NotificationMode.combined) ...[
              _buildSectionTitle('Умные настройки'),
              SizedBox(height: AppSpacing.sm),
              _buildSmartSettingsCard(isDark),
              SizedBox(height: AppSpacing.lg),
            ],
            _buildInfoCard(isDark),
            SizedBox(height: AppSpacing.xl),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: EdgeInsets.only(left: 4.w),
      child: Text(
        title,
        style: AppTypography.heading3(context).copyWith(
              fontWeight: FontWeight.w600,
            ),
      ),
    );
  }

  Widget _buildModeCard({
    required NotificationMode mode,
    required IconData icon,
    required String title,
    required String description,
    required bool isDark,
  }) {
    final isSelected = _selectedMode == mode;
    final selectedColor = AppColors.calmingBlue;

    return GestureDetector(
      onTap: () => _setMode(mode),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeInOut,
        padding: EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: isSelected
              ? selectedColor.withOpacity(isDark ? 0.15 : 0.08)
              : isDark
                  ? Colors.white.withOpacity(0.05)
                  : Colors.grey.withOpacity(0.06),
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          border: Border.all(
            color: isSelected
                ? selectedColor.withOpacity(0.6)
                : Colors.transparent,
            width: 2,
          ),
        ),
        child: Row(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: 48.w,
              height: 48.w,
              decoration: BoxDecoration(
                color: isSelected
                    ? selectedColor.withOpacity(0.2)
                    : isDark
                        ? Colors.white.withOpacity(0.08)
                        : Colors.grey.withOpacity(0.1),
                borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              ),
              child: Icon(
                icon,
                color: isSelected
                    ? selectedColor
                    : isDark
                        ? Colors.white54
                        : Colors.grey,
                size: 24.sp,
              ),
            ),
            SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTypography.body(context).copyWith(
                          fontWeight: FontWeight.w600,
                          color: isSelected ? selectedColor : null,
                        ),
                  ),
                  SizedBox(height: 4.h),
                  Text(
                    description,
                    style: AppTypography.caption(context).copyWith(
                          color: isDark ? Colors.white54 : Colors.grey[600],
                        ),
                  ),
                ],
              ),
            ),
            AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: 24.w,
              height: 24.w,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? selectedColor : Colors.transparent,
                border: Border.all(
                  color: isSelected
                      ? selectedColor
                      : isDark
                          ? Colors.white24
                          : Colors.grey[400]!,
                  width: 2,
                ),
              ),
              child: isSelected
                  ? Icon(
                      Icons.check_rounded,
                      color: Colors.white,
                      size: 16.sp,
                    )
                  : null,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScheduledTimesList(bool isDark) {
    if (_scheduledTimes.isEmpty) {
      return Container(
        padding: EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: isDark
              ? Colors.white.withOpacity(0.05)
              : Colors.grey.withOpacity(0.06),
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
        child: Center(
          child: Column(
            children: [
              Icon(
                Icons.notifications_off_outlined,
                size: 40.sp,
                color: isDark ? Colors.white24 : Colors.grey[400],
              ),
              SizedBox(height: AppSpacing.sm),
              Text(
                'Нет запланированных напоминаний',
                style: AppTypography.caption(context).copyWith(
                      color: isDark ? Colors.white38 : Colors.grey[500],
                    ),
              ),
              SizedBox(height: 4.h),
              Text(
                'Нажмите кнопку ниже, чтобы добавить',
                style: AppTypography.caption(context).copyWith(
                      color: isDark ? Colors.white24 : Colors.grey[400],
                      fontSize: 12.sp,
                    ),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: List.generate(_scheduledTimes.length, (index) {
        final time = _scheduledTimes[index];
        return Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.xs),
          child: _buildTimeRow(time, index, isDark),
        );
      }),
    );
  }

  Widget _buildTimeRow(TimeOfDay time, int index, bool isDark) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: isDark
            ? Colors.white.withOpacity(0.05)
            : Colors.grey.withOpacity(0.06),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
      child: Row(
        children: [
          Icon(
            Icons.alarm_rounded,
            color: AppColors.calmingBlue,
            size: 22.sp,
          ),
          SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(
              _formatTimeOfDay(time),
              style: AppTypography.body(context).copyWith(
                    fontWeight: FontWeight.w500,
                    fontSize: 17.sp,
                  ),
            ),
          ),
          Text(
            _getTimeLabel(time),
            style: AppTypography.caption(context).copyWith(
                  color: isDark ? Colors.white38 : Colors.grey[500],
                ),
          ),
          SizedBox(width: AppSpacing.sm),
          GestureDetector(
            onTap: () => _removeTime(index),
            child: Container(
              width: 32.w,
              height: 32.w,
              decoration: BoxDecoration(
                color: AppColors.stressHigh.withOpacity(0.1),
                borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
              ),
              child: Icon(
                Icons.close_rounded,
                color: AppColors.stressHigh,
                size: 18.sp,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _getTimeLabel(TimeOfDay time) {
    if (time.hour >= 5 && time.hour < 12) return 'Утро';
    if (time.hour >= 12 && time.hour < 17) return 'День';
    if (time.hour >= 17 && time.hour < 21) return 'Вечер';
    return 'Ночь';
  }

  Widget _buildAddTimeButton(bool isDark) {
    return GestureDetector(
      onTap: _addTime,
      child: Container(
        width: double.infinity,
        padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.calmingBlue.withOpacity(isDark ? 0.15 : 0.08),
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(
            color: AppColors.calmingBlue.withOpacity(0.3),
            width: 1.5,
            strokeAlign: BorderSide.strokeAlignInside,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.add_rounded,
              color: AppColors.calmingBlue,
              size: 22.sp,
            ),
            SizedBox(width: AppSpacing.xs),
            Text(
              'Добавить время',
              style: AppTypography.body(context).copyWith(
                    color: AppColors.calmingBlue,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSmartSettingsCard(bool isDark) {
    return Container(
      padding: EdgeInsets.all(AppSpacing.md),