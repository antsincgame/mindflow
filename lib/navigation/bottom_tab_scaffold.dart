import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class BottomTabScaffold extends StatelessWidget {
  const BottomTabScaffold({
    super.key,
    required this.navigationShell,
  });

  final StatefulNavigationShell navigationShell;

  static const List<_TabItem> _tabs = [
    _TabItem(
      icon: Icons.home_outlined,
      activeIcon: Icons.home_rounded,
      label: 'Главная',
    ),
    _TabItem(
      icon: Icons.bar_chart_outlined,
      activeIcon: Icons.bar_chart_rounded,
      label: 'Статистика',
    ),
    _TabItem(
      icon: Icons.emoji_events_outlined,
      activeIcon: Icons.emoji_events_rounded,
      label: 'Достижения',
    ),
    _TabItem(
      icon: Icons.settings_outlined,
      activeIcon: Icons.settings_rounded,
      label: 'Настройки',
    ),
  ];

  void _onTap(int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: colorScheme.shadow.withOpacity(0.08),
              blurRadius: 16,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: NavigationBar(
          selectedIndex: navigationShell.currentIndex,
          onDestinationSelected: _onTap,
          animationDuration: const Duration(milliseconds: 400),
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          backgroundColor: colorScheme.surface,
          indicatorColor: colorScheme.primaryContainer.withOpacity(0.4),
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          height: 72,
          destinations: _tabs.map((tab) {
            return NavigationDestination(
              icon: Icon(
                tab.icon,
                size: 24,
              ),
              selectedIcon: Icon(
                tab.activeIcon,
                size: 24,
                color: colorScheme.primary,
              ),
              label: tab.label,
              tooltip: tab.label,
            );
          }).toList(),
        ),
      ),
    );
  }
}

class _TabItem {
  const _TabItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
  });

  final IconData icon;
  final IconData activeIcon;
  final String label;
}