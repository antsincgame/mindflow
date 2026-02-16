import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers/settings_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_spacing.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);
    final settingsNotifier = ref.read(settingsProvider.notifier);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Настройки'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.sm,
          ),
          children: [
            _SectionHeader(title: 'Уведомления'),
            const SizedBox(height: AppSpacing.xs),
            _SettingsCard(
              children: [
                _SwitchTile(
                  icon: Icons.notifications_outlined,
                  iconColor: AppColors.calmingBlue,
                  title: 'Уведомления',
                  subtitle: 'Напоминания о практике',
                  value: settings.notificationsEnabled,
                  onChanged: (value) {
                    settingsNotifier.setNotificationsEnabled(value);
                  },
                ),
                if (settings.notificationsEnabled) ...[
                  const Divider(height: 1, indent: 56),
                  _NavigationTile(
                    icon: Icons.schedule_outlined,
                    iconColor: AppColors.softPurple,
                    title: 'Расписание напоминаний',
                    subtitle: 'Настроить время и режим',
                    onTap: () {
                      context.push('/settings/notifications');
                    },
                  ),
                ],
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            _SectionHeader(title: 'Биометрика'),
            const SizedBox(height: AppSpacing.xs),
            _SettingsCard(
              children: [
                _SwitchTile(
                  icon: Icons.favorite_outline,
                  iconColor: Colors.redAccent,
                  title: 'Пульс',
                  subtitle: 'Отслеживание частоты сердцебиения',
                  value: settings.biometricPermissions['heart_rate'] ?? false,
                  onChanged: (value) {
                    settingsNotifier.setBiometricPermission(
                      'heart_rate',
                      value,
                    );
                  },
                ),
                const Divider(height: 1, indent: 56),
                _SwitchTile(
                  icon: Icons.bedtime_outlined,
                  iconColor: AppColors.softPurple,
                  title: 'Сон',
                  subtitle: 'Анализ качества сна',
                  value: settings.biometricPermissions['sleep'] ?? false,
                  onChanged: (value) {
                    settingsNotifier.setBiometricPermission('sleep', value);
                  },
                ),
                const Divider(height: 1, indent: 56),
                _SwitchTile(
                  icon: Icons.directions_walk_outlined,
                  iconColor: AppColors.gentleGreen,
                  title: 'Активность',
                  subtitle: 'Уровень физической активности',
                  value: settings.biometricPermissions['activity'] ?? false,
                  onChanged: (value) {
                    settingsNotifier.setBiometricPermission('activity', value);
                  },
                ),
                const Divider(height: 1, indent: 56),
                _NavigationTile(
                  icon: Icons.tune_outlined,
                  iconColor: AppColors.calmingBlue,
                  title: 'Управление разрешениями',
                  subtitle: 'Подробные настройки биометрики',
                  onTap: () {
                    context.push('/settings/biometric-permissions');
                  },
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            _SectionHeader(title: 'Внешний вид'),
            const SizedBox(height: AppSpacing.xs),
            _SettingsCard(
              children: [
                _ThemeSelector(
                  currentTheme: settings.themeMode,
                  onChanged: (mode) {
                    settingsNotifier.setThemeMode(mode);
                  },
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            _SectionHeader(title: 'Прогресс'),
            const SizedBox(height: AppSpacing.xs),
            _SettingsCard(
              children: [
                _NavigationTile(
                  icon: Icons.share_outlined,
                  iconColor: AppColors.calmingBlue,
                  title: 'Поделиться прогрессом',
                  subtitle: 'Отправить другу или терапевту',
                  onTap: () {
                    context.push('/settings/share-progress');
                  },
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            _SectionHeader(title: 'О приложении'),
            const SizedBox(height: AppSpacing.xs),
            _SettingsCard(
              children: [
                _NavigationTile(
                  icon: Icons.shield_outlined,
                  iconColor: AppColors.gentleGreen,
                  title: 'Приватность',
                  subtitle: 'Все данные хранятся на устройстве',
                  onTap: () {
                    _showPrivacyDialog(context);
                  },
                ),
                const Divider(height: 1, indent: 56),
                _InfoTile(
                  icon: Icons.info_outline,
                  iconColor: colorScheme.onSurfaceVariant,
                  title: 'Версия',
                  trailing: Text(
                    '1.0.0',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xl),
          ],
        ),
      ),
    );
  }

  void _showPrivacyDialog(BuildContext context) {
    final theme = Theme.of(context);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
        title: Row(
          children: [
            Icon(
              Icons.shield_outlined,
              color: AppColors.gentleGreen,
              size: 28,
            ),
            const SizedBox(width: AppSpacing.sm),
            const Text('Приватность'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _PrivacyItem(
              icon: Icons.smartphone,
              text: 'Все данные хранятся локально на вашем устройстве',
            ),
            const SizedBox(height: AppSpacing.md),
            _PrivacyItem(
              icon: Icons.cloud_off,
              text: 'Мы не отправляем данные на серверы',
            ),
            const SizedBox(height: AppSpacing.md),
            _PrivacyItem(
              icon: Icons.lock_outline,
              text: 'Биометрические данные читаются только с вашего разрешения',
            ),
            const SizedBox(height: AppSpacing.md),
            _PrivacyItem(
              icon: Icons.share_outlined,
              text:
                  'При шаринге передаётся только статистика — без личных данных',
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Понятно'),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;

  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(
        left: AppSpacing.xs,
        top: AppSpacing.sm,
      ),
      child: Text(
        title.toUpperCase(),
        style: theme.textTheme.labelMedium?.copyWith(
          color: theme.colorScheme.onSurfaceVariant,
          fontWeight: FontWeight.w600,
          letterSpacing: 1.2,
        ),
      ),
    );
  }
}

class _SettingsCard extends StatelessWidget {
  final List<Widget> children;

  const _SettingsCard({required this.children});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(
          color: theme.colorScheme.outlineVariant.withOpacity(0.3),
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: children,
      ),
    );
  }
}

class _SwitchTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _SwitchTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SwitchListTile.adaptive(
      secondary: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: iconColor.withOpacity(0.12),
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        ),
        child: Icon(icon, color: iconColor, size: 22),
      ),
      title: Text(
        title,
        style: theme.textTheme.bodyLarge?.copyWith(
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: theme.textTheme.bodySmall?.copyWith(
          color: theme.colorScheme.onSurfaceVariant,
        ),
      ),
      value: value,
      onChanged: onChanged,
      activeColor: AppColors.calmingBlue,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xxs,
      ),
    );
  }
}

class _NavigationTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _NavigationTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListTile(
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: iconColor.withOpacity(0.12),
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        ),
        child: Icon(icon, color: iconColor, size: 22),
      ),
      title: Text(
        title,
        style: theme.textTheme.bodyLarge?.copyWith(
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: theme.textTheme.bodySmall?.copyWith(
          color: theme.colorScheme.onSurfaceVariant,
        ),
      ),
      trailing: Icon(
        Icons.chevron_right,
        color: theme.colorScheme.onSurfaceVariant,
      ),
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xxs,
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final Widget trailing;

  const _InfoTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListTile(
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: iconColor.withOpacity(0.12),
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        ),
        child: Icon(icon, color: iconColor, size: 22),
      ),
      title: Text(
        title,
        style: theme.textTheme.bodyLarge?.copyWith(
          fontWeight: FontWeight.w500,
        ),
      ),
      trailing: trailing,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xxs,
      ),
    );
  }
}

class _ThemeSelector extends StatelessWidget {
  final String currentTheme;
  final ValueChanged<String> onChanged;

  const _ThemeSelector({
    required this.currentTheme,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.softPurple.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                ),
                child: const Icon(
                  Icons.palette_outlined,
                  color: AppColors.softPurple,
                  size: 22,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Тема оформления',
                      style: theme.textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _themeDescription(currentTh