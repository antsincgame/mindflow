import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:uuid/uuid.dart';

import '../models/daily_stats.dart';
import '../services/database_service.dart';

class ShareService {
  ShareService._();
  static final ShareService instance = ShareService._();

  final DatabaseService _databaseService = DatabaseService.instance;
  final Uuid _uuid = const Uuid();

  Future<File> generateProgressImage({
    required List<DailyStats> dailyStats,
    required double avgStress,
    required int totalSessions,
    required double avgSleepQuality,
    required String periodLabel,
  }) async {
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);

    const double width = 1080;
    const double height = 1920;

    _drawBackground(canvas, width, height);
    _drawHeader(canvas, width, periodLabel);
    _drawStatsSummary(canvas, width, avgStress, totalSessions, avgSleepQuality);
    _drawHeatmap(canvas, width, dailyStats);
    _drawStressChart(canvas, width, dailyStats);
    _drawFooter(canvas, width, height);

    final picture = recorder.endRecording();
    final image = await picture.toImage(width.toInt(), height.toInt());
    final byteData = await image.toByteData(format: ui.ImageByteFormat.png);

    if (byteData == null) {
      throw Exception('Failed to generate image');
    }

    final buffer = byteData.buffer.asUint8List();
    final directory = await getTemporaryDirectory();
    final fileName = 'mindflow_progress_${_uuid.v4().substring(0, 8)}.png';
    final file = File('${directory.path}/$fileName');
    await file.writeAsBytes(buffer);

    return file;
  }

  void _drawBackground(Canvas canvas, double width, double height) {
    final bgPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          Color(0xFFF0F4FF),
          Color(0xFFE8F0FE),
          Color(0xFFF5F0FF),
        ],
      ).createShader(Rect.fromLTWH(0, 0, width, height));

    canvas.drawRect(Rect.fromLTWH(0, 0, width, height), bgPaint);
  }

  void _drawHeader(Canvas canvas, double width, String periodLabel) {
    final titleParagraphBuilder = ui.ParagraphBuilder(
      ui.ParagraphStyle(
        textAlign: TextAlign.center,
        fontSize: 48,
        fontWeight: FontWeight.bold,
      ),
    )
      ..pushStyle(ui.TextStyle(color: const Color(0xFF2D3748)))
      ..addText('MindFlow Progress');

    final titleParagraph = titleParagraphBuilder.build()
      ..layout(ui.ParagraphConstraints(width: width - 80));
    canvas.drawParagraph(titleParagraph, const Offset(40, 80));

    final subtitleBuilder = ui.ParagraphBuilder(
      ui.ParagraphStyle(
        textAlign: TextAlign.center,
        fontSize: 28,
      ),
    )
      ..pushStyle(ui.TextStyle(color: const Color(0xFF718096)))
      ..addText(periodLabel);

    final subtitleParagraph = subtitleBuilder.build()
      ..layout(ui.ParagraphConstraints(width: width - 80));
    canvas.drawParagraph(subtitleParagraph, const Offset(40, 150));
  }

  void _drawStatsSummary(
    Canvas canvas,
    double width,
    double avgStress,
    int totalSessions,
    double avgSleepQuality,
  ) {
    const double cardY = 220;
    const double cardHeight = 160;
    const double cardSpacing = 20;
    final double cardWidth = (width - 80 - cardSpacing * 2) / 3;

    final stats = [
      _StatItem(
        label: 'Avg Stress',
        value: '${avgStress.toStringAsFixed(0)}%',
        color: _getStressColor(avgStress),
      ),
      _StatItem(
        label: 'Sessions',
        value: '$totalSessions',
        color: const Color(0xFF6C63FF),
      ),
      _StatItem(
        label: 'Sleep Quality',
        value: '${avgSleepQuality.toStringAsFixed(0)}%',
        color: const Color(0xFF48BB78),
      ),
    ];

    for (int i = 0; i < stats.length; i++) {
      final x = 40.0 + i * (cardWidth + cardSpacing);

      final cardRRect = RRect.fromRectAndRadius(
        Rect.fromLTWH(x, cardY, cardWidth, cardHeight),
        const Radius.circular(16),
      );

      final cardPaint = Paint()..color = Colors.white.withOpacity(0.9);
      canvas.drawRRect(cardRRect, cardPaint);

      final borderPaint = Paint()
        ..color = stats[i].color.withOpacity(0.3)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2;
      canvas.drawRRect(cardRRect, borderPaint);

      final valueBuilder = ui.ParagraphBuilder(
        ui.ParagraphStyle(
          textAlign: TextAlign.center,
          fontSize: 40,
          fontWeight: FontWeight.bold,
        ),
      )
        ..pushStyle(ui.TextStyle(color: stats[i].color))
        ..addText(stats[i].value);

      final valueParagraph = valueBuilder.build()
        ..layout(ui.ParagraphConstraints(width: cardWidth - 20));
      canvas.drawParagraph(valueParagraph, Offset(x + 10, cardY + 30));

      final labelBuilder = ui.ParagraphBuilder(
        ui.ParagraphStyle(
          textAlign: TextAlign.center,
          fontSize: 22,
        ),
      )
        ..pushStyle(ui.TextStyle(color: const Color(0xFF718096)))
        ..addText(stats[i].label);

      final labelParagraph = labelBuilder.build()
        ..layout(ui.ParagraphConstraints(width: cardWidth - 20));
      canvas.drawParagraph(labelParagraph, Offset(x + 10, cardY + 95));
    }
  }

  void _drawHeatmap(Canvas canvas, double width, List<DailyStats> dailyStats) {
    const double startY = 440;
    const double cellSize = 28;
    const double cellSpacing = 4;
    const int columns = 7;

    final sectionTitleBuilder = ui.ParagraphBuilder(
      ui.ParagraphStyle(
        fontSize: 30,
        fontWeight: FontWeight.w600,
      ),
    )
      ..pushStyle(ui.TextStyle(color: const Color(0xFF2D3748)))
      ..addText('Activity Heatmap');

    final sectionTitle = sectionTitleBuilder.build()
      ..layout(ui.ParagraphConstraints(width: width - 80));
    canvas.drawParagraph(sectionTitle, const Offset(40, startY));

    final statsMap = <String, DailyStats>{};
    for (final stat in dailyStats) {
      final key = DateFormat('yyyy-MM-dd').format(stat.date);
      statsMap[key] = stat;
    }

    final now = DateTime.now();
    final startDate = now.subtract(const Duration(days: 90));

    double currentX = 40;
    double currentY = startY + 50;

    for (int day = 0; day <= 90; day++) {
      final date = startDate.add(Duration(days: day));
      final key = DateFormat('yyyy-MM-dd').format(date);
      final stat = statsMap[key];
      final sessionCount = stat?.sessionCount ?? 0;

      final color = _getHeatmapColor(sessionCount);

      final cellRect = RRect.fromRectAndRadius(
        Rect.fromLTWH(currentX, currentY, cellSize, cellSize),
        const Radius.circular(4),
      );

      canvas.drawRRect(cellRect, Paint()..color = color);

      if ((day + 1) % columns == 0) {
        currentX = 40;
        currentY += cellSize + cellSpacing;
      } else {
        currentX += cellSize + cellSpacing;
      }
    }
  }

  void _drawStressChart(
    Canvas canvas,
    double width,
    List<DailyStats> dailyStats,
  ) {
    const double chartY = 940;
    const double chartHeight = 300;
    const double chartLeft = 40;
    final double chartRight = width - 40;
    final double chartWidth = chartRight - chartLeft;

    final sectionTitleBuilder = ui.ParagraphBuilder(
      ui.ParagraphStyle(
        fontSize: 30,
        fontWeight: FontWeight.w600,
      ),
    )
      ..pushStyle(ui.TextStyle(color: const Color(0xFF2D3748)))
      ..addText('Stress Trend');

    final sectionTitle = sectionTitleBuilder.build()
      ..layout(ui.ParagraphConstraints(width: width - 80));
    canvas.drawParagraph(sectionTitle, const Offset(40, chartY));

    final chartTop = chartY + 50;
    final chartBottom = chartTop + chartHeight;

    final gridPaint = Paint()
      ..color = const Color(0xFFE2E8F0)
      ..strokeWidth = 1;

    for (int i = 0; i <= 4; i++) {
      final y = chartTop + (chartHeight / 4) * i;
      canvas.drawLine(Offset(chartLeft, y), Offset(chartRight, y), gridPaint);
    }

    if (dailyStats.isEmpty) return;

    final sortedStats = List<DailyStats>.from(dailyStats)
      ..sort((a, b) => a.date.compareTo(b.date));

    final stressValues = sortedStats
        .where((s) => s.avgStress > 0)
        .toList();

    if (stressValues.isEmpty) return;

    final path = Path();
    final fillPath = Path();

    for (int i = 0; i < stressValues.length; i++) {
      final x = chartLeft + (i / (stressValues.length - 1).clamp(1, double.infinity)) * chartWidth;
      final normalizedStress = stressValues[i].avgStress.clamp(0.0, 100.0) / 100.0;
      final y = chartBottom - normalizedStress * chartHeight;

      if (i == 0) {
        path.moveTo(x, y);
        fillPath.moveTo(x, chartBottom);
        fillPath.lineTo(x, y);
      } else {
        path.lineTo(x, y);
        fillPath.lineTo(x, y);
      }
    }

    fillPath.lineTo(
      chartLeft + ((stressValues.length - 1) / (stressValues.length - 1).clamp(1, double.infinity)) * chartWidth,
      chartBottom,
    );
    fillPath.close();

    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          const Color(0xFF6C63FF).withOpacity(0.3),
          const Color(0xFF6C63FF).withOpacity(0.0),
        ],
      ).createShader(Rect.fromLTRB(chartLeft, chartTop, chartRight, chartBottom));

    canvas.drawPath(fillPath, fillPaint);

    final linePaint = Paint()
      ..color = const Color(0xFF6C63FF)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    canvas.drawPath(path, linePaint);
  }

  void _drawFooter(Canvas canvas, double width, double height) {
    final footerBuilder = ui.ParagraphBuilder(
      ui.ParagraphStyle(
        textAlign: TextAlign.center,
        fontSize: 24,
      ),
    )
      ..pushStyle(ui.TextStyle(color: const Color(0xFFA0AEC0)))
      ..addText('Generated by MindFlow • ${DateFormat('MMM d, yyyy').format(DateTime.now())}');

    final footerParagraph = footerBuilder.build()
      ..layout(ui.ParagraphConstraints(width: width - 80));
    canvas.drawParagraph(footerParagraph, Offset(40, height - 100));

    final privacyBuilder = ui.ParagraphBuilder(
      ui.ParagraphStyle(
        textAlign: TextAlign.center,
        fontSize: 18,
      ),
    )
      ..pushStyle(ui.TextStyle(color: const Color(0xFFCBD5E0)))
      ..addText('No personal health data included');

    final privacyParagraph = privacyBuilder.build()
      ..layout(ui.ParagraphConstraints(width: width - 80));
    canvas.drawParagraph(privacyParagraph, Offset(40, height - 60));
  }

  Color _getStressColor(double stress) {
    if (stress <= 30) return const Color(0xFF48BB78);
    if (stress <= 60) return const Color(0xFFECC94B);
    return const Color(0xFFFC8181);
  }

  Color _getHeatmapColor(int sessionCount) {
    if (sessionCount == 0) return const Color(0xFFEDF2F7);
    if (sessionCount <= 1) return const Color(0xFFC6F6D5);
    if (sessionCount <= 2) return const Color(0xFF68D391);
    return const Color(0xFF2F855A);
  }

  Future<File> generateShareableProgressFile({
    String period = 'week',
  }) async {
    final now = DateTime.now();
    late DateTime startDate;
    late String periodLabel;

    switch (period) {
      case 'week':
        startDate = now.subtract(const Duration(days: 7));
        periodLabel = 'Last 7 Days';
        break;
      case 'month':
        startDate = now.subtract(const Duration(days: 30));
        periodLabel = 'Last 30 Days';
        break;
      case 'all':
        startDate = now.subtract(const Duration(days: 90));
        periodLabel = 'Last 3 Months';
        break;
      default:
        startDate = now.subtract(const Duration(days: 7));
        periodLabel = 'Last 7 Days';
    }

    final dailyStats = await _databaseService.getDailyStats(startDate, now);

    double avgStress = 0;
    int totalSessions = 0;
    double avgSleepQuality = 0;

    if (dailyStats.isNotEmpty) {
      final stressValues = dailyStats.where((s) => s.avgStress > 0).toList();
      avgStress = stressValues.isNotEmpty
          ? stressValues.fold(0.0, (sum, s) => sum +