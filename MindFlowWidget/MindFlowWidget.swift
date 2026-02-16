import WidgetKit
import SwiftUI
import Intents

struct MindFlowWidgetProvider: IntentTimelineProvider {
    typealias Entry = MindFlowWidgetEntry
    typealias Intent = ConfigurationIntent
    
    func placeholder(in context: Context) -> MindFlowWidgetEntry {
        MindFlowWidgetEntry(
            date: Date(),
            stressLevel: 7,
            recommendedExercise: "Дыхательное упражнение",
            duration: 5,
            configuration: ConfigurationIntent()
        )
    }
    
    func getSnapshot(for configuration: ConfigurationIntent, in context: Context, completion: @escaping (MindFlowWidgetEntry) -> Void) {
        Task {
            let entry = await fetchCurrentEntry(configuration: configuration)
            completion(entry)
        }
    }
    
    func getTimeline(for configuration: ConfigurationIntent, in context: Context, completion: @escaping (Timeline<MindFlowWidgetEntry>) -> Void) {
        Task {
            let currentEntry = await fetchCurrentEntry(configuration: configuration)
            
            let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date()
            let timeline = Timeline(entries: [currentEntry], policy: .after(nextUpdate))
            
            completion(timeline)
        }
    }
    
    private func fetchCurrentEntry(configuration: ConfigurationIntent) async -> MindFlowWidgetEntry {
        let sharedDefaults = UserDefaults(suiteName: "group.com.mindflow.app")
        
        let stressLevel = sharedDefaults?.integer(forKey: "currentStressLevel") ?? 5
        let exerciseName = sharedDefaults?.string(forKey: "recommendedExercise") ?? "Осознанное дыхание"
        let duration = sharedDefaults?.integer(forKey: "exerciseDuration") ?? 5
        
        return MindFlowWidgetEntry(
            date: Date(),
            stressLevel: stressLevel,
            recommendedExercise: exerciseName,
            duration: duration,
            configuration: configuration
        )
    }
}

struct MindFlowWidgetEntry: TimelineEntry {
    let date: Date
    let stressLevel: Int
    let recommendedExercise: String
    let duration: Int
    let configuration: ConfigurationIntent
    
    var stressColor: Color {
        switch stressLevel {
        case 0...3:
            return Color(red: 0.4, green: 0.8, blue: 0.6)
        case 4...6:
            return Color(red: 1.0, green: 0.8, blue: 0.4)
        default:
            return Color(red: 1.0, green: 0.5, blue: 0.5)
        }
    }
    
    var stressText: String {
        switch stressLevel {
        case 0...3:
            return "Низкий"
        case 4...6:
            return "Средний"
        default:
            return "Высокий"
        }
    }
}

struct MindFlowWidgetEntryView: View {
    @Environment(\.widgetFamily) var widgetFamily
    var entry: MindFlowWidgetProvider.Entry
    
    var body: some View {
        switch widgetFamily {
        case .accessoryCircular:
            CircularWidgetView(entry: entry)
        case .accessoryRectangular:
            RectangularWidgetView(entry: entry)
        case .accessoryInline:
            InlineWidgetView(entry: entry)
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}

struct CircularWidgetView: View {
    var entry: MindFlowWidgetEntry
    
    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            
            VStack(spacing: 2) {
                Image(systemName: "heart.fill")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(entry.stressColor)
                
                Text("\(entry.stressLevel)")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
            }
        }
    }
}

struct RectangularWidgetView: View {
    var entry: MindFlowWidgetEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                Image(systemName: "heart.fill")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(entry.stressColor)
                
                Text("Стресс: \(entry.stressText)")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.white)
            }
            
            Text(entry.recommendedExercise)
                .font(.system(size: 11, weight: .regular))
                .foregroundColor(.white.opacity(0.8))
                .lineLimit(1)
            
            HStack(spacing: 4) {
                Image(systemName: "clock.fill")
                    .font(.system(size: 10))
                    .foregroundColor(.white.opacity(0.6))
                
                Text("\(entry.duration) мин")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.white.opacity(0.8))
            }
        }
        .padding(.vertical, 6)
        .padding(.horizontal, 8)
    }
}

struct InlineWidgetView: View {
    var entry: MindFlowWidgetEntry
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "heart.fill")
                .foregroundColor(entry.stressColor)
            
            Text("Стресс \(entry.stressLevel)/10")
            
            Text("·")
                .foregroundColor(.secondary)
            
            Text(entry.recommendedExercise)
        }
        .font(.system(size: 14))
    }
}

struct SmallWidgetView: View {
    var entry: MindFlowWidgetEntry
    
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.95, green: 0.97, blue: 1.0),
                    Color(red: 0.9, green: 0.95, blue: 0.98)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            VStack(spacing: 12) {
                HStack {
                    Image(systemName: "heart.fill")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(entry.stressColor)
                    
                    Spacer()
                    
                    Text(entry.stressText)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.primary.opacity(0.7))
                }
                
                VStack(spacing: 4) {
                    Text("\(entry.stressLevel)")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(entry.stressColor)
                    
                    Text("уровень стресса")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(spacing: 4) {
                    Text(entry.recommendedExercise)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.primary)
                        .lineLimit(2)
                        .multilineTextAlignment(.center)
                    
                    HStack(spacing: 4) {
                        Image(systemName: "clock.fill")
                            .font(.system(size: 9))
                        
                        Text("\(entry.duration) мин")
                            .font(.system(size: 10, weight: .medium))
                    }
                    .foregroundColor(.secondary)
                }
            }
            .padding(16)
        }
    }
}

struct MediumWidgetView: View {
    var entry: MindFlowWidgetEntry
    
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.95, green: 0.97, blue: 1.0),
                    Color(red: 0.9, green: 0.95, blue: 0.98)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            HStack(spacing: 20) {
                VStack(spacing: 12) {
                    HStack {
                        Image(systemName: "heart.fill")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(entry.stressColor)
                        
                        Text(entry.stressText)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.primary.opacity(0.7))
                        
                        Spacer()
                    }
                    
                    VStack(spacing: 4) {
                        Text("\(entry.stressLevel)")
                            .font(.system(size: 48, weight: .bold))
                            .foregroundColor(entry.stressColor)
                        
                        Text("уровень стресса")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                }
                .frame(maxWidth: .infinity)
                
                Divider()
                    .frame(height: 80)
                
                VStack(alignment: .leading, spacing: 12) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Рекомендуем")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.secondary)
                        
                        Text(entry.recommendedExercise)
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(.primary)
                            .lineLimit(2)
                    }
                    
                    HStack(spacing: 8) {
                        HStack(spacing: 4) {
                            Image(systemName: "clock.fill")
                                .font(.system(size: 11))
                            
                            Text("\(entry.duration) мин")
                                .font(.system(size: 12, weight: .medium))
                        }
                        .foregroundColor(.secondary)
                        
                        Spacer()
                        
                        HStack(spacing: 4) {
                            Image(systemName: "play.circle.fill")
                                .font(.system(size: 11))
                            
                            Text("Начать")
                                .font(.system(size: 12, weight: .semibold))
                        }
                        .foregroundColor(Color(red: 0.3, green: 0.6, blue: 0.9))
                    }
                    
                    Spacer()
                }
                .frame(maxWidth: .infinity)
            }
            .padding(16)
        }
    }
}

@main
struct MindFlowWidget: Widget {
    let kind: String = "MindFlowWidget"
    
    var body: some WidgetConfiguration {
        IntentConfiguration(
            kind: kind,
            intent: ConfigurationIntent.self,
            provider: MindFlowWidgetProvider()
        ) { entry in
            MindFlowWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("MindFlow")
        .description("Отслеживайте уровень стресса и получайте рекомендации по медитации")
        .supportedFamilies([
            .accessoryCircular,
            .accessoryRectangular,
            .accessoryInline,
            .systemSmall,
            .systemMedium
        ])
    }
}

struct MindFlowWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            MindFlowWidgetEntryView(entry: MindFlowWidgetEntry(
                date: Date(),
                stressLevel: 7,
                recommendedExercise: "Дыхательное упражнение",
                duration: 5,
                configuration: ConfigurationIntent()
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))
            .previewDisplayName("Small Widget")
            
            MindFlowWidgetEntryView(entry: MindFlowWidgetEntry(
                date: Date(),
                stressLevel: 7,
                recommendedExercise: "Дыхательное упражнение",
                duration: 5,
                configuration: ConfigurationIntent()
            ))
            .previewContext(WidgetPreviewContext(family: .systemMedium))
            .previewDisplayName("Medium Widget")
            
            MindFlowWidgetEntryView(entry: MindFlowWidgetEntry(
                date: Date(),
                stressLevel: 7,
                recommendedExercise: "Дыхательное упражнение",
                duration: 5,
                configuration: ConfigurationIntent()
            ))
            .previewContext(WidgetPreviewContext(family: .accessoryCircular))
            .previewDisplayName("Circular Lock Screen")
            
            MindFlowWidgetEntryView(entry: MindFlowWidgetEntry(
                date: Date(),
                stressLevel: 7,
                recommendedExercise: "Дыхательное упражнение",
                duration: 5,
                configuration: ConfigurationIntent()
            ))
            .previewContext(WidgetPreviewContext(family: .accessoryRectangular))
            .previewDisplayName("Rectangular Lock Screen")
            
            MindFlowWidgetEntryView(entry: MindFlowWidgetEntry(
                date: Date(),
                stressLevel: 7,
                recommendedExercise: "Дыхательное упражнение",
                duration: 5,
                configuration: ConfigurationIntent()
            ))
            .previewContext(WidgetPreviewContext(family: .accessoryInline))
            .previewDisplayName("Inline Lock Screen")
        }
    }
}