import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'app.dart';
import 'services/database_service.dart';
import 'services/notification_service.dart';
import 'services/audio_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
    ),
  );

  await _initializeServices();

  runApp(
    const ProviderScope(
      child: MindFlowAppEntry(),
    ),
  );
}

Future<void> _initializeServices() async {
  final databaseService = DatabaseService.instance;
  await databaseService.initialize();

  final notificationService = NotificationService.instance;
  await notificationService.initialize();

  final audioService = AudioService.instance;
  await audioService.initialize();
}

class MindFlowAppEntry extends StatelessWidget {
  const MindFlowAppEntry({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(375, 812),
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (context, child) {
        return const MindFlowApp();
      },
    );
  }
}