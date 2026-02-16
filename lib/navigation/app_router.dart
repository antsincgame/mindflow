import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../navigation/bottom_tab_scaffold.dart';
import '../screens/home/home_screen.dart';
import '../screens/home/emotion_selection_screen.dart';
import '../screens/exercise/exercise_list_screen.dart';
import '../screens/exercise/exercise_session_screen.dart';
import '../screens/exercise/exercise_result_screen.dart';
import '../screens/statistics/statistics_screen.dart';
import '../screens/achievements/achievements_screen.dart';
import '../screens/settings/settings_screen.dart';
import '../screens/settings/notification_settings_screen.dart';
import '../screens/settings/biometric_permissions_screen.dart';
import '../screens/settings/share_progress_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _homeNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'home');
final _statisticsNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'statistics');
final _achievementsNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'achievements');
final _settingsNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'settings');

abstract class AppRoutes {
  static const String home = '/home';
  static const String emotionSelection = '/home/emotion-selection';
  static const String exerciseList = '/home/exercises';
  static const String exerciseSession = '/home/exercises/session';
  static const String exerciseResult = '/home/exercises/result';
  static const String statistics = '/statistics';
  static const String achievements = '/achievements';
  static const String settings = '/settings';
  static const String notificationSettings = '/settings/notifications';
  static const String biometricPermissions = '/settings/biometric-permissions';
  static const String shareProgress = '/settings/share-progress';
}

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: AppRoutes.home,
    debugLogDiagnostics: true,
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return BottomTabScaffold(navigationShell: navigationShell);
        },
        branches: [
          // Home tab
          StatefulShellBranch(
            navigatorKey: _homeNavigatorKey,
            routes: [
              GoRoute(
                path: AppRoutes.home,
                name: 'home',
                pageBuilder: (context, state) => const NoTransitionPage(
                  child: HomeScreen(),
                ),
                routes: [
                  GoRoute(
                    path: 'emotion-selection',
                    name: 'emotionSelection',
                    parentNavigatorKey: _rootNavigatorKey,
                    pageBuilder: (context, state) => CustomTransitionPage(
                      key: state.pageKey,
                      child: const EmotionSelectionScreen(),
                      transitionsBuilder: (context, animation, secondaryAnimation, child) {
                        return SlideTransition(
                          position: Tween<Offset>(
                            begin: const Offset(0, 1),
                            end: Offset.zero,
                          ).animate(CurvedAnimation(
                            parent: animation,
                            curve: Curves.easeOutCubic,
                          )),
                          child: child,
                        );
                      },
                    ),
                  ),
                  GoRoute(
                    path: 'exercises',
                    name: 'exerciseList',
                    parentNavigatorKey: _rootNavigatorKey,
                    pageBuilder: (context, state) {
                      final emotionId = state.uri.queryParameters['emotionId'];
                      return CustomTransitionPage(
                        key: state.pageKey,
                        child: ExerciseListScreen(emotionId: emotionId),
                        transitionsBuilder: (context, animation, secondaryAnimation, child) {
                          return SlideTransition(
                            position: Tween<Offset>(
                              begin: const Offset(1, 0),
                              end: Offset.zero,
                            ).animate(CurvedAnimation(
                              parent: animation,
                              curve: Curves.easeOutCubic,
                            )),
                            child: child,
                          );
                        },
                      );
                    },
                    routes: [
                      GoRoute(
                        path: 'session',
                        name: 'exerciseSession',
                        parentNavigatorKey: _rootNavigatorKey,
                        pageBuilder: (context, state) {
                          final exerciseId = state.uri.queryParameters['exerciseId'];
                          return CustomTransitionPage(
                            key: state.pageKey,
                            child: ExerciseSessionScreen(exerciseId: exerciseId),
                            transitionsBuilder: (context, animation, secondaryAnimation, child) {
                              return FadeTransition(
                                opacity: CurvedAnimation(
                                  parent: animation,
                                  curve: Curves.easeIn,
                                ),
                                child: child,
                              );
                            },
                          );
                        },
                      ),
                      GoRoute(
                        path: 'result',
                        name: 'exerciseResult',
                        parentNavigatorKey: _rootNavigatorKey,
                        pageBuilder: (context, state) {
                          final sessionId = state.uri.queryParameters['sessionId'];
                          return CustomTransitionPage(
                            key: state.pageKey,
                            child: ExerciseResultScreen(sessionId: sessionId),
                            transitionsBuilder: (context, animation, secondaryAnimation, child) {
                              return SlideTransition(
                                position: Tween<Offset>(
                                  begin: const Offset(0, 1),
                                  end: Offset.zero,
                                ).animate(CurvedAnimation(
                                  parent: animation,
                                  curve: Curves.easeOutCubic,
                                )),
                                child: child,
                              );
                            },
                          );
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),

          // Statistics tab
          StatefulShellBranch(
            navigatorKey: _statisticsNavigatorKey,
            routes: [
              GoRoute(
                path: AppRoutes.statistics,
                name: 'statistics',
                pageBuilder: (context, state) => const NoTransitionPage(
                  child: StatisticsScreen(),
                ),
              ),
            ],
          ),

          // Achievements tab
          StatefulShellBranch(
            navigatorKey: _achievementsNavigatorKey,
            routes: [
              GoRoute(
                path: AppRoutes.achievements,
                name: 'achievements',
                pageBuilder: (context, state) => const NoTransitionPage(
                  child: AchievementsScreen(),
                ),
              ),
            ],
          ),

          // Settings tab
          StatefulShellBranch(
            navigatorKey: _settingsNavigatorKey,
            routes: [
              GoRoute(
                path: AppRoutes.settings,
                name: 'settings',
                pageBuilder: (context, state) => const NoTransitionPage(
                  child: SettingsScreen(),
                ),
                routes: [
                  GoRoute(
                    path: 'notifications',
                    name: 'notificationSettings',
                    parentNavigatorKey: _rootNavigatorKey,
                    pageBuilder: (context, state) => CustomTransitionPage(
                      key: state.pageKey,
                      child: const NotificationSettingsScreen(),
                      transitionsBuilder: (context, animation, secondaryAnimation, child) {
                        return SlideTransition(
                          position: Tween<Offset>(
                            begin: const Offset(1, 0),
                            end: Offset.zero,
                          ).animate(CurvedAnimation(
                            parent: animation,
                            curve: Curves.easeOutCubic,
                          )),
                          child: child,
                        );
                      },
                    ),
                  ),
                  GoRoute(
                    path: 'biometric-permissions',
                    name: 'biometricPermissions',
                    parentNavigatorKey: _rootNavigatorKey,
                    pageBuilder: (context, state) => CustomTransitionPage(
                      key: state.pageKey,
                      child: const BiometricPermissionsScreen(),
                      transitionsBuilder: (context, animation, secondaryAnimation, child) {
                        return SlideTransition(
                          position: Tween<Offset>(
                            begin: const Offset(1, 0),
                            end: Offset.zero,
                          ).animate(CurvedAnimation(
                            parent: animation,
                            curve: Curves.easeOutCubic,
                          )),
                          child: child,
                        );
                      },
                    ),
                  ),
                  GoRoute(
                    path: 'share-progress',
                    name: 'shareProgress',
                    parentNavigatorKey: _rootNavigatorKey,
                    pageBuilder: (context, state) => CustomTransitionPage(
                      key: state.pageKey,
                      child: const ShareProgressScreen(),
                      transitionsBuilder: (context, animation, secondaryAnimation, child) {
                        return SlideTransition(
                          position: Tween<Offset>(
                            begin: const Offset(0, 1),
                            end: Offset.zero,
                          ).animate(CurvedAnimation(
                            parent: animation,
                            curve: Curves.easeOutCubic,
                          )),
                          child: child,
                        );
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
    errorPageBuilder: (context, state) => MaterialPage(
      key: state.pageKey,
      child: Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline_rounded,
                size: 64,
                color: Colors.grey,
              ),
              const SizedBox(height: 16),
              Text(
                'Страница не найдена',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(
                state.uri.toString(),
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey,
                    ),
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () => context.go(AppRoutes.home),
                child: const Text('На главную'),
              ),
            ],
          ),
        ),
      ),
    ),
  );
});