import SwiftUI
import WidgetKit
import Intents

struct LockScreenWidgetProvider: IntentTimelineProvider {
    typealias Entry = LockScreenWidgetEntry
    typealias Intent = MeditationIntent
    
    private let supabaseService = SupabaseService.shared
    private let stressAnalysisService = StressAnalysisService()
    
    func placeholder(in context: Context) -> LockScreenWidgetEntry {
        LockScreenWidgetEntry(
            date: Date(),
            stressLevel: 5,
            recommendedExercise: "Breathing Exercise",
            exerciseDuration: 300,
            configuration: MeditationIntent()
        )
    }
    
    func getSnapshot(for configuration: MeditationIntent, in context: Context, completion: @escaping (LockScreenWidgetEntry) -> Void) {
        Task {
            let entry = await createEntry(for: configuration)
            completion(entry)
        }
    }
    
    func getTimeline(for configuration: MeditationIntent, in context: Context, completion: @escaping (Timeline<LockScreenWidgetEntry>) -> Void) {
        Task {
            let currentEntry = await createEntry(for: configuration)
            let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date()
            
            let timeline = Timeline(entries: [currentEntry], policy: .after(nextUpdate))
            completion(timeline)
        }
    }
    
    private func createEntry(for configuration: MeditationIntent) async -> LockScreenWidgetEntry {
        do {
            let userId = try await supabaseService.getCurrentUserId()
            let stressLevel = await stressAnalysisService.getCurrentStressLevel(userId: userId)
            let recommendation = await stressAnalysisService.getRecommendedExercise(
                userId: userId,
                stressLevel: stressLevel
            )
            
            return LockScreenWidgetEntry(
                date: Date(),
                stressLevel: stressLevel,
                recommendedExercise: recommendation?.name ?? "Quick Meditation",
                exerciseDuration: recommendation?.durationSeconds ?? 300,
                configuration: configuration
            )
        } catch {
            return LockScreenWidgetEntry(
                date: Date(),
                stressLevel: 5,
                recommendedExercise: "Breathing Exercise",
                exerciseDuration: 300,
                configuration: configuration
            )
        }
    }
}

struct LockScreenWidgetEntry: TimelineEntry {
    let date: Date
    let stressLevel: Int
    let recommendedExercise: String
    let exerciseDuration: Int
    let configuration: MeditationIntent
    
    var stressColor: Color {
        switch stressLevel {
        case 0...3:
            return .green
        case 4...6:
            return .yellow
        case 7...10:
            return .red
        default:
            return .gray
        }
    }
    
    var stressEmoji: String {
        switch stressLevel {
        case 0...3:
            return "😌"
        case 4...6:
            return "😐"
        case 7...10:
            return "😰"
        default:
            return "🧘"
        }
    }
    
    var durationText: String {
        let minutes = exerciseDuration / 60
        return "\(minutes) min"
    }
}

struct LockScreenWidgetEntryView: View {
    var entry: LockScreenWidgetProvider.Entry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        switch family {
        case .accessoryCircular:
            circularView
        case .accessoryRectangular:
            rectangularView
        case .accessoryInline:
            inlineView
        default:
            circularView
        }
    }
    
    private var circularView: some View {
        ZStack {
            AccessoryWidgetBackground()
            
            VStack(spacing: 2) {
                Text(entry.stressEmoji)
                    .font(.system(size: 24))
                
                Text("\(entry.stressLevel)")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(entry.stressColor)
            }
        }
    }
    
    private var rectangularView: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 4) {
                Text(entry.stressEmoji)
                    .font(.system(size: 14))
                
                Text("Stress: \(entry.stressLevel)/10")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(entry.stressColor)
            }
            
            Text(entry.recommendedExercise)
                .font(.system(size: 11, weight: .medium))
                .lineLimit(1)
            
            Text(entry.durationText)
                .font(.system(size: 10))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
    
    private var inlineView: some View {
        HStack(spacing: 4) {
            Text(entry.stressEmoji)
            Text("Stress \(entry.stressLevel)")
            Text("•")
            Text(entry.recommendedExercise)
        }
        .font(.system(size: 12))
    }
}

struct LockScreenWidget: Widget {
    let kind: String = "LockScreenWidget"
    
    var body: some WidgetConfiguration {
        IntentConfiguration(
            kind: kind,
            intent: MeditationIntent.self,
            provider: LockScreenWidgetProvider()
        ) { entry in
            LockScreenWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("MindFlow")
        .description("Monitor your stress level and get meditation suggestions.")
        .supportedFamilies([
            .accessoryCircular,
            .accessoryRectangular,
            .accessoryInline
        ])
    }
}

struct LockScreenWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            LockScreenWidgetEntryView(entry: LockScreenWidgetEntry(
                date: Date(),
                stressLevel: 3,
                recommendedExercise: "Calm Breathing",
                exerciseDuration: 300,
                configuration: MeditationIntent()
            ))
            .previewContext(WidgetPreviewContext(family: .accessoryCircular))
            .previewDisplayName("Circular - Low Stress")
            
            LockScreenWidgetEntryView(entry: LockScreenWidgetEntry(
                date: Date(),
                stressLevel: 7,
                recommendedExercise: "Quick Relaxation",
                exerciseDuration: 180,
                configuration: MeditationIntent()
            ))
            .previewContext(WidgetPreviewContext(family: .accessoryRectangular))
            .previewDisplayName("Rectangular - High Stress")
            
            LockScreenWidgetEntryView(entry: LockScreenWidgetEntry(
                date: Date(),
                stressLevel: 5,
                recommendedExercise: "Mindfulness",
                exerciseDuration: 420,
                configuration: MeditationIntent()
            ))
            .previewContext(WidgetPreviewContext(family: .accessoryInline))
            .previewDisplayName("Inline - Medium Stress")
        }
    }
}

class MeditationIntent: INIntent {
    override init() {
        super.init()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
    }
}

extension LockScreenWidget {
    static func reloadAllTimelines() {
        WidgetCenter.shared.reloadAllTimelines()
    }
    
    static func reloadTimelines(ofKind kind: String) {
        WidgetCenter.shared.reloadTimelines(ofKind: kind)
    }
}

struct WidgetDeepLinkHandler {
    static func handle(url: URL) -> DeepLink? {
        guard url.scheme == "mindflow" else { return nil }
        
        switch url.host {
        case "start-meditation":
            return .startMeditation
        case "view-stress":
            return .viewStressLevel
        case "settings":
            return .settings
        default:
            return nil
        }
    }
    
    enum DeepLink {
        case startMeditation
        case viewStressLevel
        case settings
    }
}