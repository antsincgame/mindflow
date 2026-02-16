import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'navigation/app_router.dart';
import 'theme/app_theme.dart';
import 'providers/settings_provider.dart';
import 'utils/date_utils.dart' as app_date_utils;

class MindFlowApp extends ConsumerStatefulWidget {
  const MindFlowApp({super.key});

  @override
  ConsumerState<MindFlowApp> createState() => _MindFlowAppState();
}

class _MindFlowAppState extends ConsumerState<MindFlowApp>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangePlatformBrightness() {
    setState(() {});
  }

  ThemeMode _resolveThemeMode(String themeModeSetting) {
    switch (themeModeSetting) {
      case 'light':
        return ThemeMode.light;
      case 'dark':
        return ThemeMode.dark;
      case 'auto':
      default:
        return _getTimeBasedThemeMode();
    }
  }

  ThemeMode _getTimeBasedThemeMode() {
    final now = DateTime.now();
    final hour = now.hour;
    final isDaytime = hour >= 7 && hour < 21;
    return isDaytime ? ThemeMode.light : ThemeMode.dark;
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(appRouterProvider);
    final settingsAsync = ref.watch(settingsProvider);

    final themeModeSetting = settingsAsync.whenOrNull(
          data: (settings) => settings.themeMode,
        ) ??
        'auto';

    final resolvedThemeMode = _resolveThemeMode(themeModeSetting);

    return ScreenUtilInit(
      designSize: const Size(375, 812),
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (context, child) {
        return MaterialApp.router(
          title: 'MindFlow',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: resolvedThemeMode,
          routerConfig: router,
          localizationsDelegates: const [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [
            Locale('en', ''),
            Locale('ru', ''),
          ],
          locale: const Locale('ru', ''),
          builder: (context, child) {
            return MediaQuery(
              data: MediaQuery.of(context).copyWith(
                textScaler: TextScaler.noScaling,
              ),
              child: child ?? const SizedBox.shrink(),
            );
          },
        );
      },
    );
  }
}