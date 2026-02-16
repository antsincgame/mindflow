import SwiftUI

struct AchievementBadge: View {
    let achievement: Achievement
    let isUnlocked: Bool
    let size: BadgeSize
    let showDescription: Bool
    
    init(
        achievement: Achievement,
        isUnlocked: Bool = false,
        size: BadgeSize = .medium,
        showDescription: Bool = true
    ) {
        self.achievement = achievement
        self.isUnlocked = isUnlocked
        self.size = size
        self.showDescription = showDescription
    }
    
    var body: some View {
        VStack(spacing: Spacing.xs) {
            badgeIcon
            
            if showDescription {
                VStack(spacing: Spacing.xxs) {
                    Text(achievement.name)
                        .font(size.titleFont)
                        .fontWeight(.semibold)
                        .foregroundColor(isUnlocked ? Colors.text : Colors.textSecondary)
                        .multilineTextAlignment(.center)
                    
                    Text(achievement.description)
                        .font(size.descriptionFont)
                        .foregroundColor(Colors.textSecondary)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                }
                .padding(.horizontal, Spacing.xs)
            }
        }
        .frame(maxWidth: size.maxWidth)
    }
    
    private var badgeIcon: some View {
        ZStack {
            Circle()
                .fill(badgeBackground)
                .frame(width: size.iconSize, height: size.iconSize)
                .overlay(
                    Circle()
                        .strokeBorder(badgeBorder, lineWidth: 2)
                )
                .shadow(
                    color: isUnlocked ? Colors.primary.opacity(0.3) : Color.clear,
                    radius: 8,
                    x: 0,
                    y: 4
                )
            
            if isUnlocked {
                achievementIcon
                    .font(.system(size: size.iconSize * 0.5))
                    .foregroundColor(.white)
            } else {
                Image(systemName: "lock.fill")
                    .font(.system(size: size.iconSize * 0.4))
                    .foregroundColor(Colors.textTertiary)
            }
            
            if isUnlocked && achievement.isNew {
                newBadge
            }
        }
        .scaleEffect(isUnlocked ? 1.0 : 0.95)
        .opacity(isUnlocked ? 1.0 : 0.6)
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isUnlocked)
    }
    
    private var achievementIcon: some View {
        Group {
            if let iconUrl = achievement.iconUrl, !iconUrl.isEmpty {
                AsyncImage(url: URL(string: iconUrl)) { phase in
                    switch phase {
                    case .empty:
                        ProgressView()
                            .tint(.white)
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                    case .failure:
                        defaultIcon
                    @unknown default:
                        defaultIcon
                    }
                }
                .frame(width: size.iconSize * 0.6, height: size.iconSize * 0.6)
            } else {
                defaultIcon
            }
        }
    }
    
    private var defaultIcon: some View {
        Image(systemName: iconName)
            .font(.system(size: size.iconSize * 0.5))
            .foregroundColor(.white)
    }
    
    private var iconName: String {
        switch achievement.type {
        case .streak:
            return "flame.fill"
        case .sessions:
            return "checkmark.circle.fill"
        case .minutes:
            return "clock.fill"
        case .stressReduction:
            return "heart.fill"
        case .beforeMeetings:
            return "calendar.badge.checkmark"
        case .consistency:
            return "star.fill"
        case .milestone:
            return "trophy.fill"
        default:
            return "star.fill"
        }
    }
    
    private var badgeBackground: LinearGradient {
        if isUnlocked {
            return LinearGradient(
                gradient: Gradient(colors: gradientColors),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        } else {
            return LinearGradient(
                gradient: Gradient(colors: [Colors.backgroundSecondary, Colors.backgroundTertiary]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
    
    private var gradientColors: [Color] {
        switch achievement.tier {
        case .bronze:
            return [Color(red: 0.8, green: 0.5, blue: 0.2), Color(red: 0.6, green: 0.3, blue: 0.1)]
        case .silver:
            return [Color(red: 0.75, green: 0.75, blue: 0.75), Color(red: 0.5, green: 0.5, blue: 0.5)]
        case .gold:
            return [Color(red: 1.0, green: 0.84, blue: 0.0), Color(red: 0.85, green: 0.65, blue: 0.13)]
        case .platinum:
            return [Color(red: 0.9, green: 0.9, blue: 1.0), Color(red: 0.6, green: 0.6, blue: 0.8)]
        case .diamond:
            return [Color(red: 0.7, green: 0.9, blue: 1.0), Color(red: 0.4, green: 0.6, blue: 0.8)]
        default:
            return [Colors.primary, Colors.secondary]
        }
    }
    
    private var badgeBorder: LinearGradient {
        if isUnlocked {
            return LinearGradient(
                gradient: Gradient(colors: [.white.opacity(0.5), .white.opacity(0.1)]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        } else {
            return LinearGradient(
                gradient: Gradient(colors: [Colors.border, Colors.border]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
    
    private var newBadge: some View {
        VStack {
            HStack {
                Spacer()
                Text("NEW")
                    .font(.system(size: 8, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Colors.accent)
                    .cornerRadius(8)
                    .offset(x: 8, y: -8)
            }
            Spacer()
        }
        .frame(width: size.iconSize, height: size.iconSize)
    }
}

extension AchievementBadge {
    enum BadgeSize {
        case small
        case medium
        case large
        
        var iconSize: CGFloat {
            switch self {
            case .small: return 48
            case .medium: return 64
            case .large: return 96
            }
        }
        
        var maxWidth: CGFloat {
            switch self {
            case .small: return 80
            case .medium: return 120
            case .large: return 160
            }
        }
        
        var titleFont: Font {
            switch self {
            case .small: return Typography.caption
            case .medium: return Typography.body
            case .large: return Typography.subtitle
            }
        }
        
        var descriptionFont: Font {
            switch self {
            case .small: return Typography.caption
            case .medium: return Typography.caption
            case .large: return Typography.body
            }
        }
    }
}

struct AchievementBadgeGrid: View {
    let achievements: [Achievement]
    let unlockedAchievementIds: Set<UUID>
    let columns: Int
    let spacing: CGFloat
    
    init(
        achievements: [Achievement],
        unlockedAchievementIds: Set<UUID>,
        columns: Int = 3,
        spacing: CGFloat = Spacing.md
    ) {
        self.achievements = achievements
        self.unlockedAchievementIds = unlockedAchievementIds
        self.columns = columns
        self.spacing = spacing
    }
    
    private var gridColumns: [GridItem] {
        Array(repeating: GridItem(.flexible(), spacing: spacing), count: columns)
    }
    
    var body: some View {
        LazyVGrid(columns: gridColumns, spacing: spacing) {
            ForEach(achievements) { achievement in
                AchievementBadge(
                    achievement: achievement,
                    isUnlocked: unlockedAchievementIds.contains(achievement.id),
                    size: .medium,
                    showDescription: true
                )
            }
        }
    }
}

struct AchievementUnlockAnimation: View {
    let achievement: Achievement
    @State private var scale: CGFloat = 0.3
    @State private var opacity: Double = 0
    @State private var rotation: Double = -180
    @State private var particlesOpacity: Double = 1
    @Binding var isPresented: Bool
    
    var body: some View {
        ZStack {
            Color.black.opacity(0.7)
                .ignoresSafeArea()
                .onTapGesture {
                    dismiss()
                }
            
            VStack(spacing: Spacing.lg) {
                ZStack {
                    ForEach(0..<12) { index in
                        Circle()
                            .fill(Colors.primary.opacity(0.6))
                            .frame(width: 8, height: 8)
                            .offset(y: -80)
                            .rotationEffect(.degrees(Double(index) * 30))
                            .opacity(particlesOpacity)
                    }
                    
                    AchievementBadge(
                        achievement: achievement,
                        isUnlocked: true,
                        size: .large,
                        showDescription: false
                    )
                    .scaleEffect(scale)
                    .rotationEffect(.degrees(rotation))
                }
                
                VStack(spacing: Spacing.xs) {
                    Text("Achievement Unlocked!")
                        .font(Typography.title)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    Text(achievement.name)
                        .font(Typography.subtitle)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                    
                    Text(achievement.description)
                        .font(Typography.body)
                        .foregroundColor(.white.opacity(0.8))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, Spacing.xl)
                }
                .opacity(opacity)
                
                Button(action: dismiss) {
                    Text("Continue")
                        .font(Typography.body)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Spacing.md)
                        .background(Colors.primary)
                        .cornerRadius(12)
                }
                .padding(.horizontal, Spacing.xl)
                .opacity(opacity)
            }
        }
        .onAppear {
            animateUnlock()
        }
    }
    
    private func animateUnlock() {
        withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) {
            scale = 1.0
            rotation = 0
        }
        
        withAnimation(.easeIn(duration: 0.3).delay(0.2)) {
            opacity = 1
        }
        
        withAnimation(.easeOut(duration: 0.8).delay(0.3)) {
            particlesOpacity = 0
        }
    }
    
    private func dismiss() {
        withAnimation(.easeOut(duration: 0.2)) {
            opacity = 0
            scale = 0.8
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            isPresented = false
        }
    }
}

#Preview("Unlocked Badge") {
    AchievementBadge(
        achievement: Achievement(
            id: UUID(),
            name: "First Steps",
            description: "Complete your first meditation session",
            iconUrl: nil,
            type: .sessions,
            tier: .bronze,
            unlockCondition: ["sessions": 1],
            isNew: true
        ),
        isUnlocked: true,
        size: .medium,
        showDescription: true
    )
    .padding()
}

#Preview("Locked Badge") {
    AchievementBadge(
        achievement: Achievement(
            id: UUID(),
            name: "Meditation Master",
            description: "Complete 100 meditation sessions",
            iconUrl: nil,
            type: .sessions,
            tier: .gold,
            unlockCondition: ["sessions": 100],
            isNew: false
        ),
        isUnlocked: false,
        size: .medium,
        showDescription: true
    )
    .padding()
}

#Preview("Badge Grid") {
    ScrollView {
        AchievementBadgeGrid(
            achievements: [
                Achievement(id: UUID(), name: "First Steps", description: "Complete your first meditation", iconUrl: nil, type: .sessions, tier: .bronze, unlockCondition: ["sessions": 1], isNew: true),
                Achievement(id: UUID(), name: "Week Warrior", description: "7 day streak", iconUrl: nil, type: .streak, tier: .silver, unlockCondition: ["streak": 7], isNew: false),
                Achievement(id: UUID(), name: "Zen Master", description: "100 sessions completed", iconUrl: nil, type: .sessions, tier: .gold, unlockCondition: ["sessions": 100], isNew: false),
                Achievement(id: UUID(), name: "Calm Before Storm", description: "10 sessions before meetings", iconUrl: nil, type: .beforeMeetings, tier: .silver, unlockCondition: ["beforeMeetings": 10], isNew: false),
                Achievement(id: UUID(), name: "Time Master", description: "1000 minutes meditated", iconUrl: nil, type: .minutes, tier: .platinum, unlockCondition: ["minutes": 1000], isNew: false),
                Achievement(id: UUID(), name: "Stress Buster", description: "Reduce stress by 50%", iconUrl: nil, type: .stressReduction, tier: .diamond, unlockCondition: ["reduction": 50], isNew: false)
            ],
            unlockedAchievementIds: [UUID(), UUID()],
            columns: 3,
            spacing: Spacing.md
        )
        .padding()
    }
}