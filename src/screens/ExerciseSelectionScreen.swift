import SwiftUI
import Combine

struct ExerciseSelectionScreen: View {
    @StateObject private var viewModel = ExerciseSelectionViewModel()
    @Environment(\.dismiss) private var dismiss
    
    let stressLevel: Int
    let calendarContext: CalendarEvent?
    
    var body: some View {
        ZStack {
            Color.background
                .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 24) {
                    headerSection
                    
                    if viewModel.isLoading {
                        loadingView
                    } else {
                        recommendedExerciseSection
                        alternativesSection
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
                .padding(.bottom, 40)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button(action: { dismiss() }) {
                    Image(systemName: "xmark")
                        .foregroundColor(.primary)
                        .font(.system(size: 16, weight: .medium))
                }
            }
        }
        .onAppear {
            viewModel.loadRecommendations(
                stressLevel: stressLevel,
                calendarContext: calendarContext
            )
        }
    }
    
    private var headerSection: some View {
        VStack(spacing: 12) {
            Text("Выберите практику")
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(.primary)
            
            Text("Мы подобрали упражнения на основе вашего текущего состояния")
                .font(.system(size: 15))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 20)
        }
    }
    
    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.2)
                .tint(.primary)
            
            Text("Подбираем практику...")
                .font(.system(size: 15))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }
    
    private var recommendedExerciseSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "sparkles")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.primary)
                
                Text("Рекомендовано для вас")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(.primary)
                
                Spacer()
            }
            
            if let recommended = viewModel.recommendedExercise {
                ExerciseCard(
                    exercise: recommended,
                    isRecommended: true,
                    aiReason: viewModel.recommendationReason,
                    onSelect: {
                        viewModel.selectExercise(recommended)
                    }
                )
                .transition(.scale.combined(with: .opacity))
            }
        }
    }
    
    private var alternativesSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Альтернативные практики")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(.primary)
                
                Spacer()
            }
            
            ForEach(viewModel.alternativeExercises) { exercise in
                ExerciseCard(
                    exercise: exercise,
                    isRecommended: false,
                    aiReason: nil,
                    onSelect: {
                        viewModel.selectExercise(exercise)
                    }
                )
                .transition(.scale.combined(with: .opacity))
            }
        }
    }
}

@MainActor
class ExerciseSelectionViewModel: ObservableObject {
    @Published var recommendedExercise: Exercise?
    @Published var alternativeExercises: [Exercise] = []
    @Published var recommendationReason: String = ""
    @Published var isLoading: Bool = false
    
    private let recommendationService = RecommendationService.shared
    private let meditationService = MeditationService.shared
    private var cancellables = Set<AnyCancellable>()
    
    func loadRecommendations(stressLevel: Int, calendarContext: CalendarEvent?) {
        isLoading = true
        
        Task {
            do {
                let recommendations = try await recommendationService.getExerciseRecommendations(
                    stressLevel: stressLevel,
                    calendarContext: calendarContext
                )
                
                await MainActor.run {
                    self.recommendedExercise = recommendations.recommended
                    self.alternativeExercises = recommendations.alternatives
                    self.recommendationReason = recommendations.reason
                    self.isLoading = false
                }
            } catch {
                Logger.shared.error("Failed to load recommendations: \(error.localizedDescription)")
                await MainActor.run {
                    self.loadFallbackExercises()
                    self.isLoading = false
                }
            }
        }
    }
    
    func selectExercise(_ exercise: Exercise) {
        meditationService.startSession(exercise: exercise)
    }
    
    private func loadFallbackExercises() {
        let fallbackExercises = [
            Exercise(
                id: UUID(),
                name: "Дыхание 4-7-8",
                description: "Успокаивающая техника дыхания для быстрого снижения стресса",
                type: .breathing,
                durationSeconds: 300,
                audioURL: "breathing_4_7_8.mp3",
                difficulty: .beginner,
                benefits: ["Снижение тревоги", "Улучшение сна", "Расслабление"],
                instructions: ["Вдох 4 секунды", "Задержка 7 секунд", "Выдох 8 секунд"]
            ),
            Exercise(
                id: UUID(),
                name: "Осознанность",
                description: "Практика присутствия в моменте для снижения напряжения",
                type: .mindfulness,
                durationSeconds: 600,
                audioURL: "mindfulness_basic.mp3",
                difficulty: .intermediate,
                benefits: ["Улучшение фокуса", "Снижение стресса", "Ясность ума"],
                instructions: ["Сосредоточьтесь на дыхании", "Наблюдайте мысли", "Возвращайтесь к настоящему"]
            ),
            Exercise(
                id: UUID(),
                name: "Сканирование тела",
                description: "Техника расслабления через осознание телесных ощущений",
                type: .bodyScan,
                durationSeconds: 900,
                audioURL: "body_scan.mp3",
                difficulty: .intermediate,
                benefits: ["Глубокое расслабление", "Снятие напряжения", "Телесная осознанность"],
                instructions: ["Лягте удобно", "Сканируйте тело от головы до ног", "Расслабляйте каждую часть"]
            )
        ]
        
        self.recommendedExercise = fallbackExercises[0]
        self.alternativeExercises = Array(fallbackExercises[1...])
        self.recommendationReason = "Подобрано на основе вашего уровня стресса"
    }
}

struct ExerciseCard: View {
    let exercise: Exercise
    let isRecommended: Bool
    let aiReason: String?
    let onSelect: () -> Void
    
    @State private var isPressed = false
    
    var body: some View {
        Button(action: {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                isPressed = true
            }
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    isPressed = false
                }
                onSelect()
            }
        }) {
            VStack(alignment: .leading, spacing: 16) {
                if isRecommended, let reason = aiReason {
                    HStack(spacing: 8) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(.primary)
                        
                        Text(reason)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.primary)
                        
                        Spacer()
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color.primary.opacity(0.1))
                    )
                }
                
                HStack(alignment: .top, spacing: 16) {
                    exerciseIcon
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text(exercise.name)
                            .font(.system(size: 19, weight: .semibold))
                            .foregroundColor(.primary)
                        
                        Text(exercise.description)
                            .font(.system(size: 15))
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                        
                        HStack(spacing: 16) {
                            durationBadge
                            difficultyBadge
                        }
                    }
                }
                
                if !exercise.benefits.isEmpty {
                    benefitsSection
                }
            }
            .padding(20)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.white)
                    .shadow(
                        color: isRecommended ? Color.primary.opacity(0.15) : Color.black.opacity(0.05),
                        radius: isRecommended ? 12 : 8,
                        x: 0,
                        y: isRecommended ? 4 : 2
                    )
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(
                        isRecommended ? Color.primary.opacity(0.2) : Color.clear,
                        lineWidth: isRecommended ? 2 : 0
                    )
            )
            .scaleEffect(isPressed ? 0.97 : 1.0)
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private var exerciseIcon: some View {
        ZStack {
            Circle()
                .fill(iconBackgroundColor)
                .frame(width: 56, height: 56)
            
            Image(systemName: iconName)
                .font(.system(size: 24, weight: .medium))
                .foregroundColor(iconColor)
        }
    }
    
    private var durationBadge: some View {
        HStack(spacing: 4) {
            Image(systemName: "clock")
                .font(.system(size: 12))
            
            Text("\(exercise.durationSeconds / 60) мин")
                .font(.system(size: 13, weight: .medium))
        }
        .foregroundColor(.secondary)
    }
    
    private var difficultyBadge: some View {
        HStack(spacing: 4) {
            Image(systemName: "chart.bar")
                .font(.system(size: 12))
            
            Text(difficultyText)
                .font(.system(size: 13, weight: .medium))
        }
        .foregroundColor(.secondary)
    }
    
    private var benefitsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Преимущества:")
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(.secondary)
            
            FlowLayout(spacing: 8) {
                ForEach(exercise.benefits.prefix(3), id: \.self) { benefit in
                    Text(benefit)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.primary)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(
                            Capsule()
                                .fill(Color.primary.opacity(0.08))
                        )
                }
            }
        }
    }
    
    private var iconName: String {
        switch exercise.type {
        case .breathing:
            return "wind"
        case .mindfulness:
            return "brain.head.profile"
        case .bodyScan:
            return "figure.stand"
        }
    }
    
    private var iconColor: Color {
        switch exercise.type {
        case .breathing:
            return .blue
        case .mindfulness:
            return .purple
        case .bodyScan:
            return .green
        }
    }
    
    private var iconBackgroundColor: Color {
        iconColor.opacity(0.15)
    }
    
    private var difficultyText: String {
        switch exercise.difficulty {
        case .beginner:
            return "Начальный"
        case .intermediate:
            return "Средний"
        case .advanced:
            return "Продвинутый"
        }
    }
}

struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(
            in: proposal.replacingUnspecifiedDimensions().width,
            subviews: subviews,
            spacing: spacing
        )
        return result.size
    }
    
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(
            in: bounds.width,
            subviews: subviews,
            spacing: spacing
        )
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: bounds.minX + result.positions[index].x, y: bounds.minY + result.positions[index].y), proposal: .unspecified)
        }
    }
    
    struct FlowResult {
        var size: CGSize = .zero
        var positions: [CGPoint] = []
        
        init(in maxWidth: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var x: CGFloat = 0
            var y: CGFloat = 0
            var lineHeight: CGFloat = 0
            
            for subview in subviews {
                let size = subview.sizeThatFits(.unspecified)
                
                if x + size.width > maxWidth, x > 0 {
                    x = 0
                    y += lineHeight + spacing
                    lineHeight = 0
                }
                
                positions.append(CGPoint(x: x, y: y))
                lineHeight = max(lineHeight, size.height)
                x += size.width + spacing
            }
            
            self.size = CGSize(width: maxWidth, height: y + lineHeight)
        }
    }
}

struct ExerciseSelectionScreen_Previews: PreviewProvider {
    static var previews: some View {
        NavigationStack