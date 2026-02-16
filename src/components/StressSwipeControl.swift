import SwiftUI

struct StressSwipeControl: View {
    @Binding var stressLevel: Int
    @State private var dragOffset: CGFloat = 0
    @State private var isDragging: Bool = false
    @State private var hapticFeedback = UIImpactFeedbackGenerator(style: .medium)
    
    private let minStress: Int = 1
    private let maxStress: Int = 10
    private let trackHeight: CGFloat = 8
    private let thumbSize: CGFloat = 44
    
    var body: some View {
        VStack(spacing: 24) {
            // Stress Level Display
            VStack(spacing: 8) {
                Text("\(stressLevel)")
                    .font(.system(size: 72, weight: .bold, design: .rounded))
                    .foregroundColor(stressColor)
                    .animation(.spring(response: 0.3, dampingFraction: 0.7), value: stressLevel)
                
                Text(stressDescription)
                    .font(.system(size: 17, weight: .medium))
                    .foregroundColor(.secondary)
                    .animation(.easeInOut(duration: 0.2), value: stressLevel)
            }
            .padding(.top, 32)
            
            // Swipe Track
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    // Background Track
                    RoundedRectangle(cornerRadius: trackHeight / 2)
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: trackHeight)
                    
                    // Progress Track
                    RoundedRectangle(cornerRadius: trackHeight / 2)
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [
                                    Color(red: 0.4, green: 0.8, blue: 0.6),
                                    Color(red: 1.0, green: 0.8, blue: 0.2),
                                    Color(red: 1.0, green: 0.4, blue: 0.4)
                                ]),
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: thumbPosition(in: geometry.size.width), height: trackHeight)
                    
                    // Thumb
                    Circle()
                        .fill(Color.white)
                        .frame(width: thumbSize, height: thumbSize)
                        .shadow(color: Color.black.opacity(0.15), radius: 8, x: 0, y: 4)
                        .overlay(
                            Circle()
                                .strokeBorder(stressColor, lineWidth: 3)
                        )
                        .offset(x: thumbPosition(in: geometry.size.width) - thumbSize / 2)
                        .gesture(
                            DragGesture(minimumDistance: 0)
                                .onChanged { value in
                                    handleDragChanged(value: value, width: geometry.size.width)
                                }
                                .onEnded { _ in
                                    handleDragEnded()
                                }
                        )
                        .scaleEffect(isDragging ? 1.2 : 1.0)
                        .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isDragging)
                }
                .frame(height: thumbSize)
            }
            .frame(height: thumbSize)
            .padding(.horizontal, 24)
            
            // Stress Level Labels
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Low")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.secondary)
                    Text("Calm & Relaxed")
                        .font(.system(size: 12))
                        .foregroundColor(.secondary.opacity(0.7))
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("High")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.secondary)
                    Text("Very Stressed")
                        .font(.system(size: 12))
                        .foregroundColor(.secondary.opacity(0.7))
                }
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 16)
            
            // Quick Selection Buttons
            HStack(spacing: 12) {
                ForEach([1, 3, 5, 7, 10], id: \.self) { level in
                    Button(action: {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            stressLevel = level
                        }
                        hapticFeedback.impactOccurred()
                    }) {
                        VStack(spacing: 4) {
                            Text("\(level)")
                                .font(.system(size: 16, weight: .semibold))
                            
                            Circle()
                                .fill(colorForLevel(level))
                                .frame(width: 8, height: 8)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(stressLevel == level ? Color.gray.opacity(0.1) : Color.clear)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .strokeBorder(
                                    stressLevel == level ? colorForLevel(level) : Color.clear,
                                    lineWidth: 2
                                )
                        )
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 24)
        }
        .background(Color(UIColor.systemBackground))
        .onAppear {
            hapticFeedback.prepare()
        }
    }
    
    // MARK: - Private Methods
    
    private func thumbPosition(in width: CGFloat) -> CGFloat {
        let usableWidth = width - thumbSize
        let progress = CGFloat(stressLevel - minStress) / CGFloat(maxStress - minStress)
        return (progress * usableWidth) + (thumbSize / 2)
    }
    
    private func handleDragChanged(value: DragGesture.Value, width: CGFloat) {
        isDragging = true
        
        let usableWidth = width - thumbSize
        let xPosition = max(0, min(value.location.x - thumbSize / 2, usableWidth))
        let progress = xPosition / usableWidth
        
        let newLevel = minStress + Int(progress * CGFloat(maxStress - minStress))
        let clampedLevel = max(minStress, min(maxStress, newLevel))
        
        if clampedLevel != stressLevel {
            stressLevel = clampedLevel
            hapticFeedback.impactOccurred()
        }
    }
    
    private func handleDragEnded() {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
            isDragging = false
        }
    }
    
    private var stressColor: Color {
        colorForLevel(stressLevel)
    }
    
    private func colorForLevel(_ level: Int) -> Color {
        let progress = Double(level - minStress) / Double(maxStress - minStress)
        
        if progress < 0.33 {
            return Color(red: 0.4, green: 0.8, blue: 0.6)
        } else if progress < 0.66 {
            return Color(red: 1.0, green: 0.8, blue: 0.2)
        } else {
            return Color(red: 1.0, green: 0.4, blue: 0.4)
        }
    }
    
    private var stressDescription: String {
        switch stressLevel {
        case 1...2:
            return "Very Calm"
        case 3...4:
            return "Relaxed"
        case 5...6:
            return "Moderate"
        case 7...8:
            return "Stressed"
        case 9...10:
            return "Very Stressed"
        default:
            return "Moderate"
        }
    }
}

// MARK: - Preview

struct StressSwipeControl_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            StressSwipeControlPreview()
                .previewDisplayName("Light Mode")
            
            StressSwipeControlPreview()
                .preferredColorScheme(.dark)
                .previewDisplayName("Dark Mode")
        }
    }
}

private struct StressSwipeControlPreview: View {
    @State private var stressLevel: Int = 5
    
    var body: some View {
        VStack {
            StressSwipeControl(stressLevel: $stressLevel)
            
            Spacer()
            
            Text("Current Stress Level: \(stressLevel)")
                .font(.headline)
                .padding()
        }
        .padding()
    }
}