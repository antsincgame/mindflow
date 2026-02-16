import SwiftUI

struct ExerciseCard: View {
    let exercise: Exercise
    let isRecommended: Bool
    let onSelect: () -> Void
    
    @State private var isPressed = false
    
    var body: some View {
        Button(action: {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                isPressed = true
            }
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                    isPressed = false
                }
                onSelect()
            }
        }) {
            VStack(alignment: .leading, spacing: 0) {
                if isRecommended {
                    HStack(spacing: 6) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(.white)
                        
                        Text("AI рекомендует")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(.white)
                        
                        Spacer()
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color(red: 0.4, green: 0.6, blue: 1.0),
                                Color(red: 0.5, green: 0.7, blue: 1.0)
                            ]),
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                }
                
                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 12) {
                        ZStack {
                            Circle()
                                .fill(
                                    LinearGradient(
                                        gradient: Gradient(colors: [
                                            exerciseTypeColor.opacity(0.2),
                                            exerciseTypeColor.opacity(0.1)
                                        ]),
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .frame(width: 48, height: 48)
                            
                            Image(systemName: exerciseTypeIcon)
                                .font(.system(size: 20, weight: .medium))
                                .foregroundColor(exerciseTypeColor)
                        }
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(exercise.name)
                                .font(.system(size: 17, weight: .semibold))
                                .foregroundColor(.primary)
                                .lineLimit(1)
                            
                            HStack(spacing: 8) {
                                HStack(spacing: 4) {
                                    Image(systemName: "clock")
                                        .font(.system(size: 12, weight: .medium))
                                        .foregroundColor(.secondary)
                                    
                                    Text(formatDuration(exercise.durationSeconds))
                                        .font(.system(size: 13, weight: .medium))
                                        .foregroundColor(.secondary)
                                }
                                
                                Circle()
                                    .fill(Color.secondary.opacity(0.3))
                                    .frame(width: 3, height: 3)
                                
                                Text(exerciseTypeLabel)
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(.secondary)
                            }
                        }
                        
                        Spacer()
                        
                        Image(systemName: "chevron.right")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.secondary.opacity(0.5))
                    }
                    
                    Text(exercise.description)
                        .font(.system(size: 14, weight: .regular))
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                }
                .padding(16)
            }
            .background(Color.white)
            .cornerRadius(isRecommended ? 16 : 12)
            .shadow(
                color: isRecommended 
                    ? Color(red: 0.4, green: 0.6, blue: 1.0).opacity(0.15)
                    : Color.black.opacity(0.08),
                radius: isRecommended ? 12 : 8,
                x: 0,
                y: isRecommended ? 4 : 2
            )
            .overlay(
                RoundedRectangle(cornerRadius: isRecommended ? 16 : 12)
                    .stroke(
                        isRecommended 
                            ? Color(red: 0.4, green: 0.6, blue: 1.0).opacity(0.3)
                            : Color.clear,
                        lineWidth: isRecommended ? 1.5 : 0
                    )
            )
            .scaleEffect(isPressed ? 0.97 : 1.0)
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private var exerciseTypeColor: Color {
        switch exercise.type {
        case .breathing:
            return Color(red: 0.4, green: 0.7, blue: 1.0)
        case .mindfulness:
            return Color(red: 0.5, green: 0.8, blue: 0.6)
        case .bodyScan:
            return Color(red: 0.9, green: 0.6, blue: 0.5)
        }
    }
    
    private var exerciseTypeIcon: String {
        switch exercise.type {
        case .breathing:
            return "wind"
        case .mindfulness:
            return "brain.head.profile"
        case .bodyScan:
            return "figure.walk"
        }
    }
    
    private var exerciseTypeLabel: String {
        switch exercise.type {
        case .breathing:
            return "Дыхание"
        case .mindfulness:
            return "Осознанность"
        case .bodyScan:
            return "Сканирование тела"
        }
    }
    
    private func formatDuration(_ seconds: Int) -> String {
        let minutes = seconds / 60
        if minutes < 60 {
            return "\(minutes) мин"
        } else {
            let hours = minutes / 60
            let remainingMinutes = minutes % 60
            if remainingMinutes == 0 {
                return "\(hours) ч"
            } else {
                return "\(hours) ч \(remainingMinutes) мин"
            }
        }
    }
}

struct ExerciseCard_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 16) {
            ExerciseCard(
                exercise: Exercise(
                    id: UUID(),
                    name: "Глубокое дыхание",
                    description: "Успокаивающее дыхательное упражнение для быстрого снижения стресса и восстановления баланса",
                    type: .breathing,
                    durationSeconds: 300,
                    audioUrl: "https://example.com/audio.mp3",
                    createdAt: Date()
                ),
                isRecommended: true,
                onSelect: {}
            )
            .padding(.horizontal, 20)
            
            ExerciseCard(
                exercise: Exercise(
                    id: UUID(),
                    name: "Сканирование тела",
                    description: "Последовательное расслабление всех частей тела для глубокого отдыха",
                    type: .bodyScan,
                    durationSeconds: 600,
                    audioUrl: "https://example.com/audio.mp3",
                    createdAt: Date()
                ),
                isRecommended: false,
                onSelect: {}
            )
            .padding(.horizontal, 20)
            
            ExerciseCard(
                exercise: Exercise(
                    id: UUID(),
                    name: "Осознанная медитация",
                    description: "Практика присутствия в моменте",
                    type: .mindfulness,
                    durationSeconds: 900,
                    audioUrl: "https://example.com/audio.mp3",
                    createdAt: Date()
                ),
                isRecommended: false,
                onSelect: {}
            )
            .padding(.horizontal, 20)
            
            Spacer()
        }
        .padding(.top, 40)
        .background(Color(red: 0.98, green: 0.98, blue: 0.98))
        .previewLayout(.sizeThatFits)
    }
}