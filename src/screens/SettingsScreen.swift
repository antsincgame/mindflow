import SwiftUI
import HealthKit
import EventKit
import UserNotifications

struct SettingsScreen: View {
    @StateObject private var viewModel = SettingsViewModel()
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Voice Settings
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Голос инструктора")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        Button(action: {
                            viewModel.showVoiceLibrary = true
                        }) {
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(viewModel.selectedVoice?.name ?? "Выберите голос")
                                        .font(.body)
                                        .foregroundColor(.primary)
                                    
                                    if let voice = viewModel.selectedVoice {
                                        Text("\(voice.gender == "male" ? "Мужской" : "Женский") • \(voice.accent)")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                                
                                Spacer()
                                
                                Image(systemName: "chevron.right")
                                    .font(.body)
                                    .foregroundColor(.secondary)
                            }
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(12)
                        }
                    }
                    .padding(.horizontal)
                    
                    Divider()
                        .padding(.horizontal)
                    
                    // Session Interval
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Интервал между сессиями")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        VStack(spacing: 16) {
                            HStack {
                                Text("\(viewModel.sessionInterval) \(viewModel.sessionInterval == 1 ? "час" : viewModel.sessionInterval < 5 ? "часа" : "часов")")
                                    .font(.body)
                                    .foregroundColor(.primary)
                                
                                Spacer()
                            }
                            
                            Slider(
                                value: Binding(
                                    get: { Double(viewModel.sessionInterval) },
                                    set: { viewModel.sessionInterval = Int($0) }
                                ),
                                in: 1...8,
                                step: 1
                            )
                            .tint(Color("Primary"))
                            
                            HStack {
                                Text("1 час")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                
                                Spacer()
                                
                                Text("8 часов")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                        
                        Text("Минимальное время между рекомендациями медитации")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.horizontal)
                    
                    Divider()
                        .padding(.horizontal)
                    
                    // Notifications
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Уведомления")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        VStack(spacing: 0) {
                            Toggle(isOn: $viewModel.notificationsEnabled) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Push-уведомления")
                                        .font(.body)
                                        .foregroundColor(.primary)
                                    
                                    Text("Получать напоминания о медитации")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                            .tint(Color("Primary"))
                            .padding()
                            
                            Divider()
                                .padding(.leading)
                            
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Статус разрешения")
                                        .font(.body)
                                        .foregroundColor(.primary)
                                    
                                    Text(viewModel.notificationPermissionStatus)
                                        .font(.caption)
                                        .foregroundColor(viewModel.notificationPermissionGranted ? .green : .orange)
                                }
                                
                                Spacer()
                                
                                if !viewModel.notificationPermissionGranted {
                                    Button("Настроить") {
                                        viewModel.openAppSettings()
                                    }
                                    .font(.caption)
                                    .foregroundColor(Color("Primary"))
                                }
                            }
                            .padding()
                        }
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                    }
                    .padding(.horizontal)
                    
                    Divider()
                        .padding(.horizontal)
                    
                    // Permissions
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Разрешения")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        VStack(spacing: 0) {
                            PermissionRow(
                                icon: "heart.fill",
                                title: "HealthKit",
                                subtitle: "Мониторинг пульса и активности",
                                status: viewModel.healthKitPermissionStatus,
                                isGranted: viewModel.healthKitPermissionGranted,
                                action: {
                                    viewModel.requestHealthKitPermission()
                                }
                            )
                            
                            Divider()
                                .padding(.leading)
                            
                            PermissionRow(
                                icon: "calendar",
                                title: "Календарь",
                                subtitle: "Анализ событий для определения стресса",
                                status: viewModel.calendarPermissionStatus,
                                isGranted: viewModel.calendarPermissionGranted,
                                action: {
                                    viewModel.requestCalendarPermission()
                                }
                            )
                            
                            Divider()
                                .padding(.leading)
                            
                            PermissionRow(
                                icon: "mic.fill",
                                title: "Микрофон",
                                subtitle: "Персонализация голоса (опционально)",
                                status: viewModel.microphonePermissionStatus,
                                isGranted: viewModel.microphonePermissionGranted,
                                action: {
                                    viewModel.requestMicrophonePermission()
                                }
                            )
                        }
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                    }
                    .padding(.horizontal)
                    
                    Divider()
                        .padding(.horizontal)
                    
                    // Account
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Аккаунт")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        VStack(spacing: 0) {
                            Button(action: {
                                viewModel.showDeleteAccountAlert = true
                            }) {
                                HStack {
                                    Text("Удалить аккаунт")
                                        .font(.body)
                                        .foregroundColor(.red)
                                    
                                    Spacer()
                                }
                                .padding()
                            }
                            
                            Divider()
                                .padding(.leading)
                            
                            Button(action: {
                                viewModel.showLogoutAlert = true
                            }) {
                                HStack {
                                    Text("Выйти")
                                        .font(.body)
                                        .foregroundColor(.red)
                                    
                                    Spacer()
                                }
                                .padding()
                            }
                        }
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                    }
                    .padding(.horizontal)
                    
                    // App Info
                    VStack(spacing: 8) {
                        Text("MindFlow")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Text("Версия 1.0.0")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.top, 16)
                    .padding(.bottom, 32)
                }
                .padding(.top)
            }
            .navigationTitle("Настройки")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Готово") {
                        dismiss()
                    }
                    .foregroundColor(Color("Primary"))
                }
            }
            .sheet(isPresented: $viewModel.showVoiceLibrary) {
                VoiceLibraryScreen(selectedVoiceId: viewModel.selectedVoice?.id)
            }
            .alert("Удалить аккаунт", isPresented: $viewModel.showDeleteAccountAlert) {
                Button("Отмена", role: .cancel) { }
                Button("Удалить", role: .destructive) {
                    viewModel.deleteAccount()
                }
            } message: {
                Text("Вы уверены? Все данные будут безвозвратно удалены.")
            }
            .alert("Выйти", isPresented: $viewModel.showLogoutAlert) {
                Button("Отмена", role: .cancel) { }
                Button("Выйти", role: .destructive) {
                    viewModel.logout()
                }
            } message: {
                Text("Вы уверены, что хотите выйти?")
            }
            .alert("Ошибка", isPresented: $viewModel.showError) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(viewModel.errorMessage)
            }
            .overlay {
                if viewModel.isLoading {
                    ZStack {
                        Color.black.opacity(0.3)
                            .ignoresSafeArea()
                        
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            .scaleEffect(1.5)
                    }
                }
            }
        }
        .onAppear {
            viewModel.loadSettings()
        }
    }
}

struct PermissionRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let status: String
    let isGranted: Bool
    let action: () -> Void
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(Color("Primary"))
                .frame(width: 32)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.body)
                    .foregroundColor(.primary)
                
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text(status)
                    .font(.caption)
                    .foregroundColor(isGranted ? .green : .orange)
            }
            
            Spacer()
            
            if !isGranted {
                Button("Разрешить") {
                    action()
                }
                .font(.caption)
                .foregroundColor(Color("Primary"))
            } else {
                Image(systemName: "checkmark.circle.fill")
                    .font(.title3)
                    .foregroundColor(.green)
            }
        }
        .padding()
    }
}

@MainActor
class SettingsViewModel: ObservableObject {
    @Published var selectedVoice: Voice?
    @Published var sessionInterval: Int = 4
    @Published var notificationsEnabled: Bool = true
    
    @Published var notificationPermissionStatus: String = "Проверка..."
    @Published var notificationPermissionGranted: Bool = false
    
    @Published var healthKitPermissionStatus: String = "Проверка..."
    @Published var healthKitPermissionGranted: Bool = false
    
    @Published var calendarPermissionStatus: String = "Проверка..."
    @Published var calendarPermissionGranted: Bool = false
    
    @Published var microphonePermissionStatus: String = "Проверка..."
    @Published var microphonePermissionGranted: Bool = false
    
    @Published var showVoiceLibrary: Bool = false
    @Published var showDeleteAccountAlert: Bool = false
    @Published var showLogoutAlert: Bool = false
    @Published var showError: Bool = false
    @Published var errorMessage: String = ""
    @Published var isLoading: Bool = false
    
    private let supabaseService = SupabaseService.shared
    private let healthKitService = HealthKitService.shared
    private let notificationService = NotificationService.shared
    
    func loadSettings() {
        Task {
            await loadUserSettings()
            await checkPermissions()
        }
    }
    
    private func loadUserSettings() async {
        do {
            guard let userId = supabaseService.currentUserId else { return }
            
            let response = try await supabaseService.client
                .from("users")
                .select("selected_voice_id, session_interval_hours, notification_enabled")
                .eq("id", value: userId)
                .single()
                .execute()
            
            let data = response.data
            let decoder = JSONDecoder()
            let userData = try decoder.decode(UserSettings.self, from: data)
            
            sessionInterval = userData.sessionIntervalHours
            notificationsEnabled = userData.notificationEnabled
            
            if let voiceId = userData.selectedVoiceId {
                await loadVoice(id: voiceId)
            }
            
        } catch {
            Logger.shared.error("Failed to load settings: \(error)")
        }
    }
    
    private func loadVoice(id: UUID) async {
        do {
            let response = try await supabaseService.client
                .from("voices")
                .select()
                .eq("id", value: id.uuidString)
                .single()
                .execute()
            
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            selectedVoice = try decoder.decode(Voice.self, from: response.data)
            
        } catch {
            Logger.shared.error("Failed to load voice: \(error)")
        }
    }
    
    private func checkPermissions() async {
        await checkNotificationPermission()
        await checkHealthKitPermission()
        await checkCalendarPermission()
        await checkMicrophonePermission()
    }
    
    private func checkNotificationPermission() async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        
        switch settings.authorizationStatus {
        case .authorized:
            notificationPermissionStatus = "Разрешено"
            notificationPermissionGranted = true
        case .denied:
            notificationPermissionStatus = "Отклонено"
            notificationPermissionGranted = false
        case .notDetermined:
            notificationPermissionStatus = "Не запрошено"
            notificationPermissionGranted = false
        case .provisional:
            notificationPermissionStatus = "Временное разрешение"
            notificationPermissionGranted = true
        case .ephemeral:
            notificationPerm