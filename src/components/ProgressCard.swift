import SwiftUI

struct ProgressCard: View {
    let title: String
    let progress: Double
    let currentValue: Int
    let targetValue: Int
    let icon: String
    let color: Color
    let description: String?
    
    @State private var animatedProgress: Double = 0
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 24, weight: .medium))
                    .foregroundColor(color)
                    .frame(width: 40, height: 40)
                    .background(color.opacity(0.1))
                    .clipShape(Circle())
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.primary)
                    
                    if let description = description {
                        Text(description)
                            .font(.system(size: 13))
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }
                }
                
                Spacer()
                
                Text("\(Int(progress * 100))%")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(color)
            }
            
            VStack(alignment: .leading, spacing: 6) {
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(color.opacity(0.1))
                            .frame(height: 8)
                        
                        RoundedRectangle(cornerRadius: 8)
                            .fill(
                                LinearGradient(
                                    gradient: Gradient(colors: [color.opacity(0.8), color]),
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: geometry.size.width * animatedProgress, height: 8)
                            .animation(.spring(response: 0.8, dampingFraction: 0.7), value: animatedProgress)
                    }
                }
                .frame(height: 8)
                
                HStack {
                    Text("\(currentValue)")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.primary)
                    
                    Spacer()
                    
                    Text("\(targetValue)")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)
        .onAppear {
            withAnimation(.easeInOut(duration: 1.0).delay(0.2)) {
                animatedProgress = min(max(progress, 0), 1)
            }
        }
        .onChange(of: progress) { newProgress in
            withAnimation(.easeInOut(duration: 0.5)) {
                animatedProgress = min(max(newProgress, 0), 1)
            }
        }
    }
}

struct ProgressCard_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 16) {
            ProgressCard(
                title: "Текущий стрик",
                progress: 0.7,
                currentValue: 7,
                targetValue: 10,
                icon: "flame.fill",
                color: .orange,
                description: "Медитируй ещё 3 дня подряд"
            )
            
            ProgressCard(
                title: "Общее время",
                progress: 0.45,
                currentValue: 450,
                targetValue: 1000,
                icon: "clock.fill",
                color: .blue,
                description: "550 минут до следующего уровня"
            )
            
            ProgressCard(
                title: "Сессии перед встречами",
                progress: 1.0,
                currentValue: 12,
                targetValue: 12,
                icon: "calendar.badge.checkmark",
                color: .green,
                description: "Цель достигнута!"
            )
        }
        .padding()
        .background(Color(.systemGroupedBackground))
        .previewLayout(.sizeThatFits)
    }
}