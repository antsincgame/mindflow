import SwiftUI
import Combine

struct ProgressScreen: View {
    @StateObject private var viewModel = ProgressViewModel()
    @State private var selectedTab: ProgressTab = .overview
    @State private var showAchievementDetail: Achievement?
    @State private var showSessionHistory = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color.background
                    .ignoresSafeArea()
                
                if viewModel.isLoading {
                    ProgressView()
                        .scaleEffect(1.5)
                } else {
                    ScrollView {
                        VStack(spacing: 24) {
                            // Tabs
                            tabSelector
                            
                            switch selectedTab {
                            case .overview:
                                overviewSection
                            case .achievements:
                                achievementsSection
                            case .history:
                                historySection
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 24)
                    }
                }
            }
            .navigationTitle("Прогресс")
            .navigationBarTitleDisplayMode(.large)
            .sheet(item: $showAchievementDetail) { achievement in
                AchievementDetailSheet(achievement: achievement)
            }
            .sheet(isPresented: $showSessionHistory) {
                SessionHistorySheet(sessions: viewModel.recentSessions)
            }
            .onAppear {
                viewModel.loadProgress()
            }
            .refreshable {
                await viewModel.refreshProgress()
            }
        }
    }
    
    private var tabSelector: some View {
        HStack(spacing: 12) {
            ForEach(ProgressTab.allCases, id: \.self) { tab in
                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        selectedTab = tab
                    }
                } label: {
                    Text(tab.title)
                        .font(.system(size: 15, weight: selectedTab == tab ? .semibold : .regular))
                        .foregroundColor(selectedTab == tab ? .white : .primary.opacity(0.6))
                        .padding(.horizontal, 20)
                        .padding(.vertical, 10)
                        .background(
                            Capsule()
                                .fill(selectedTab == tab ? Color.primary : Color.clear)
                        )
                }
            }
        }
        .padding(4)
        .background(
            Capsule()
                .fill(Color.primary.opacity(0.08))
        )
    }
    
    private var overviewSection: some View {
        VStack(spacing: 20) {
            // Current Streak Card
            currentStreakCard
            
            // Stats Grid
            statsGrid
            
            // Meeting Impact Card
            meetingImpactCard
            
            // Stress Reduction Chart
            stressReductionCard
            
            // Recent Sessions Preview
            recentSessionsPreview
        }
    }
    
    private var currentStreakCard: some View {
        VStack(spacing: 16) {
            HStack {
                Image(systemName: "flame.fill")
                    .font(.system(size: 24))
                    .foregroundColor(.orange)
                
                Text("Текущая серия")
                    .font(.system(size: 17, weight: .semibold))
                
                Spacer()
            }
            
            HStack(alignment: .bottom, spacing: 8) {
                Text("\(viewModel.progress?.currentStreak ?? 0)")
                    .font(.system(size: 56, weight: .bold))
                    .foregroundColor(.primary)
                
                Text("дней")
                    .font(.system(size: 20, weight: .medium))
                    .foregroundColor(.secondary)
                    .padding(.bottom, 8)
                
                Spacer()
            }
            
            if let longestStreak = viewModel.progress?.longestStreak, longestStreak > 0 {
                HStack {
                    Text("Лучшая серия:")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                    
                    Text("\(longestStreak) дней")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.primary)
                    
                    Spacer()
                }
            }
            
            // Streak Progress
            if let currentStreak = viewModel.progress?.currentStreak {
                let nextMilestone = getNextStreakMilestone(current: currentStreak)
                let progress = Double(currentStreak % nextMilestone) / Double(nextMilestone)
                
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("До следующего достижения")
                            .font(.system(size: 13))
                            .foregroundColor(.secondary)
                        
                        Spacer()
                        
                        Text("\(nextMilestone - (currentStreak % nextMilestone)) дней")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.orange)
                    }
                    
                    ProgressView(value: progress)
                        .tint(.orange)
                }
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.primary.opacity(0.04))
        )
    }
    
    private var statsGrid: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: 16) {
            StatCard(
                icon: "checkmark.circle.fill",
                value: "\(viewModel.progress?.totalSessions ?? 0)",
                label: "Сессий",
                color: .blue
            )
            
            StatCard(
                icon: "clock.fill",
                value: formatMinutes(viewModel.progress?.totalMinutes ?? 0),
                label: "Медитации",
                color: .purple
            )
            
            StatCard(
                icon: "calendar.badge.clock",
                value: "\(viewModel.progress?.sessionsBeforeMeetings ?? 0)",
                label: "Перед встречами",
                color: .green
            )
            
            StatCard(
                icon: "chart.line.downtrend.xyaxis",
                value: "\(Int((viewModel.progress?.stressReductionAvg ?? 0) * 100))%",
                label: "Снижение стресса",
                color: .orange
            )
        }
    }
    
    private var meetingImpactCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "person.2.fill")
                    .font(.system(size: 20))
                    .foregroundColor(.green)
                
                Text("Влияние на встречи")
                    .font(.system(size: 17, weight: .semibold))
                
                Spacer()
            }
            
            if let sessionsBeforeMeetings = viewModel.progress?.sessionsBeforeMeetings,
               let stressReduction = viewModel.progress?.stressReductionAvg,
               sessionsBeforeMeetings > 0 {
                
                VStack(alignment: .leading, spacing: 12) {
                    Text("Вы медитировали перед \(sessionsBeforeMeetings) встречами и были спокойнее на \(Int(stressReduction * 100))%")
                        .font(.system(size: 15))
                        .foregroundColor(.primary)
                        .lineSpacing(4)
                    
                    HStack(spacing: 12) {
                        MeetingImpactBadge(
                            icon: "brain.head.profile",
                            label: "Ясность",
                            value: "+\(Int(stressReduction * 80))%"
                        )
                        
                        MeetingImpactBadge(
                            icon: "heart.fill",
                            label: "Спокойствие",
                            value: "+\(Int(stressReduction * 100))%"
                        )
                        
                        MeetingImpactBadge(
                            icon: "bolt.fill",
                            label: "Энергия",
                            value: "+\(Int(stressReduction * 60))%"
                        )
                    }
                }
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Начните медитировать перед важными встречами")
                        .font(.system(size: 15))
                        .foregroundColor(.primary)
                    
                    Text("Мы покажем статистику, как медитация влияет на вашу продуктивность")
                        .font(.system(size: 13))
                        .foregroundColor(.secondary)
                        .lineSpacing(3)
                }
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.green.opacity(0.08))
        )
    }
    
    private var stressReductionCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "chart.line.downtrend.xyaxis")
                    .font(.system(size: 20))
                    .foregroundColor(.blue)
                
                Text("Динамика стресса")
                    .font(.system(size: 17, weight: .semibold))
                
                Spacer()
                
                Text("7 дней")
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)
            }
            
            if !viewModel.weeklyStressData.isEmpty {
                StressReductionChart(data: viewModel.weeklyStressData)
                    .frame(height: 180)
            } else {
                VStack(spacing: 8) {
                    Image(systemName: "chart.xyaxis.line")
                        .font(.system(size: 40))
                        .foregroundColor(.secondary.opacity(0.3))
                    
                    Text("Недостаточно данных")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                }
                .frame(height: 180)
                .frame(maxWidth: .infinity)
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.primary.opacity(0.04))
        )
    }
    
    private var recentSessionsPreview: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Последние сессии")
                    .font(.system(size: 17, weight: .semibold))
                
                Spacer()
                
                Button {
                    showSessionHistory = true
                } label: {
                    Text("Все")
                        .font(.system(size: 15))
                        .foregroundColor(.blue)
                }
            }
            
            if viewModel.recentSessions.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "moon.stars.fill")
                        .font(.system(size: 40))
                        .foregroundColor(.secondary.opacity(0.3))
                    
                    Text("Начните первую медитацию")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
            } else {
                VStack(spacing: 12) {
                    ForEach(viewModel.recentSessions.prefix(5)) { session in
                        SessionHistoryRow(session: session)
                    }
                }
            }
        }
    }
    
    private var achievementsSection: some View {
        VStack(spacing: 20) {
            // Progress Overview
            achievementProgressCard
            
            // Unlocked Achievements
            if !viewModel.unlockedAchievements.isEmpty {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Разблокировано (\(viewModel.unlockedAchievements.count))")
                        .font(.system(size: 17, weight: .semibold))
                    
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 16) {
                        ForEach(viewModel.unlockedAchievements) { achievement in
                            AchievementBadge(
                                achievement: achievement,
                                isUnlocked: true
                            )
                            .onTapGesture {
                                showAchievementDetail = achievement
                            }
                        }
                    }
                }
            }
            
            // Locked Achievements
            if !viewModel.lockedAchievements.isEmpty {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Заблокировано (\(viewModel.lockedAchievements.count))")
                        .font(.system(size: 17, weight: .semibold))
                    
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 16) {
                        ForEach(viewModel.lockedAchievements) { achievement in
                            AchievementBadge(
                                achievement: achievement,
                                isUnlocked: false
                            )
                            .onTapGesture {
                                showAchievementDetail = achievement
                            }
                        }
                    }
                }
            }
        }
    }
    
    private var achievementProgressCard: some View {
        VStack(spacing: 16) {
            HStack {
                Image(systemName: "trophy.fill")
                    .font(.system(size: 24))
                    .foregroundColor(.yellow)
                
                Text("Достижения")
                    .font(.system(size: 17, weight: .semibold))
                
                Spacer()
            }
            
            let totalAchievements = viewModel.unlockedAchievements.count + viewModel.lockedAchievements.count
            let progress = totalAchievements > 0 ? Double(viewModel.unlockedAchievements.count) / Double(totalAchievements) : 0
            
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("\(viewModel.unlockedAchievements.count) из \(totalAchievements)")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(.primary)
                    
                    Spacer()
                    
                    Text("\(Int(progress * 100))%")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.yellow)
                }
                
                ProgressView(value: progress)
                    .tint(.yellow)
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.yellow.opacity(0.08))
        )
    }
    
    private var historySection: some View {
        VStack(spacing: 16) {
            if viewModel.recentSessions.isEmpty {
                VStack(spacing: 16) {
                    Image(systemName: "moon.stars.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.secondary.opacity(