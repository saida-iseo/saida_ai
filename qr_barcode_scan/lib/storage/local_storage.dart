import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive/hive.dart';
import 'package:qr_barcode_scan/models/history_item.dart';

class LocalStorage {
  static const String historyBoxName = 'history';
  static const String settingsBoxName = 'settings';
  static const String onboardingKey = 'onboarding';
  static const String currentOnboardingVersion = '1';
  static const String safetyNoticeKey = 'safetyNotice';

  static late Box<Map> _historyBox;
  static late Box<Map> _settingsBox;

  static Future<void> init() async {
    _historyBox = await Hive.openBox<Map>(historyBoxName);
    _settingsBox = await Hive.openBox<Map>(settingsBoxName);
  }

  static Box<Map> get historyBox => _historyBox;
  static Box<Map> get settingsBox => _settingsBox;

  static List<HistoryItem> getHistory() {
    return _historyBox.values
        .map((value) => HistoryItem.fromMap(value))
        .toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  }

  static Future<void> addHistory(HistoryItem item) async {
    await _historyBox.put(item.id, item.toMap());
  }

  static Future<void> removeHistory(String id) async {
    await _historyBox.delete(id);
  }

  static Future<void> clearHistory() async {
    await _historyBox.clear();
  }

  static AppSettings loadSettings() {
    final data = _settingsBox.get('app') ?? {};
    return AppSettings.fromMap(data);
  }

  static Future<void> saveSettings(AppSettings settings) async {
    await _settingsBox.put('app', settings.toMap());
  }

  static bool get onboardingDone => onboardingSeen;

  static Map<dynamic, dynamic> _onboardingMap() {
    final value = _settingsBox.get(onboardingKey);
    return value is Map ? value : <dynamic, dynamic>{};
  }

  static bool get onboardingSeen {
    final map = _onboardingMap();
    final done = map['done'] == true;
    final seen = map['seen'] == true || done;
    final version = map['version'] as String?;
    if (!seen) return false;
    if (version == null || version.isEmpty) return false;
    return version == currentOnboardingVersion;
  }

  static bool get shouldShowOnboarding {
    final map = _onboardingMap();
    final seen = map['seen'] == true || map['done'] == true;
    final version = map['version'] as String?;
    if (!seen) return true;
    if (version == null || version.isEmpty) return true;
    return version != currentOnboardingVersion;
  }

  static Future<void> setOnboardingDone() async {
    await setOnboardingSeen();
  }

  static Future<void> setOnboardingSeen() async {
    await _settingsBox.put(onboardingKey, {
      'version': currentOnboardingVersion,
      'seen': true,
      'done': true,
    });
  }

  static bool get safetyNoticeDone => _settingsBox.get('safetyNotice')?['done'] == true;
  static bool safetyNoticeAcknowledged = false;

  static Future<void> setSafetyNoticeDone() async {
    await _settingsBox.put(safetyNoticeKey, {'done': true});
  }

  static bool get shouldShowSafetyNotice {
    final map = _settingsBox.get(safetyNoticeKey);
    if (map is Map) {
      final value = map['snoozedAt'];
      if (value is int) {
        final now = DateTime.now().millisecondsSinceEpoch;
        const dayMs = 24 * 60 * 60 * 1000;
        if (now - value < dayMs) return false;
      }
    }
    return true;
  }

  static Future<void> snoozeSafetyNoticeFor24Hours() async {
    await _settingsBox.put(safetyNoticeKey, {
      'snoozedAt': DateTime.now().millisecondsSinceEpoch,
    });
  }

  static bool get firstScanNoticeDone => _settingsBox.get('firstScanNotice')?['done'] == true;

  static Future<void> setFirstScanNoticeDone() async {
    await _settingsBox.put('firstScanNotice', {'done': true});
  }
}

class AppSettings {
  AppSettings({
    this.vibrate = true,
    this.sound = true,
    this.autoFocus = true,
    this.autoOpenUrl = false,
    this.safetyCheck = true,
    this.themeMode = AppThemeMode.system,
  });

  final bool vibrate;
  final bool sound;
  final bool autoFocus;
  final bool autoOpenUrl;
  final bool safetyCheck;
  final AppThemeMode themeMode;

  AppSettings copyWith({
    bool? vibrate,
    bool? sound,
    bool? autoFocus,
    bool? autoOpenUrl,
    bool? safetyCheck,
    AppThemeMode? themeMode,
  }) {
    return AppSettings(
      vibrate: vibrate ?? this.vibrate,
      sound: sound ?? this.sound,
      autoFocus: autoFocus ?? this.autoFocus,
      autoOpenUrl: autoOpenUrl ?? this.autoOpenUrl,
      safetyCheck: safetyCheck ?? this.safetyCheck,
      themeMode: themeMode ?? this.themeMode,
    );
  }

  factory AppSettings.fromMap(Map<dynamic, dynamic> map) {
    return AppSettings(
      vibrate: map['vibrate'] as bool? ?? true,
      sound: map['sound'] as bool? ?? true,
      autoFocus: map['autoFocus'] as bool? ?? true,
      autoOpenUrl: map['autoOpenUrl'] as bool? ?? false,
      safetyCheck: map['safetyCheck'] as bool? ?? true,
      themeMode: AppThemeModeX.fromString(map['themeMode'] as String?),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'vibrate': vibrate,
      'sound': sound,
      'autoFocus': autoFocus,
      'autoOpenUrl': autoOpenUrl,
      'safetyCheck': safetyCheck,
      'themeMode': themeMode.name,
    };
  }
}

enum AppThemeMode { system, light, dark }

extension AppThemeModeX on AppThemeMode {
  static AppThemeMode fromString(String? value) {
    return AppThemeMode.values.firstWhere(
      (mode) => mode.name == value,
      orElse: () => AppThemeMode.system,
    );
  }
}

class SettingsNotifier extends StateNotifier<AppSettings> {
  SettingsNotifier() : super(LocalStorage.loadSettings());

  Future<void> update(AppSettings settings) async {
    state = settings;
    await LocalStorage.saveSettings(settings);
  }

  Future<void> toggleVibrate() async {
    await update(state.copyWith(vibrate: !state.vibrate));
  }

  Future<void> toggleSound() async {
    await update(state.copyWith(sound: !state.sound));
  }

  Future<void> toggleAutoFocus() async {
    await update(state.copyWith(autoFocus: !state.autoFocus));
  }

  Future<void> toggleAutoOpenUrl() async {
    await update(state.copyWith(autoOpenUrl: !state.autoOpenUrl));
  }

  Future<void> toggleSafetyCheck() async {
    await update(state.copyWith(safetyCheck: !state.safetyCheck));
  }

  Future<void> setAutoOpenUrl(bool value) async {
    await update(state.copyWith(autoOpenUrl: value));
  }

  Future<void> setThemeMode(AppThemeMode mode) async {
    await update(state.copyWith(themeMode: mode));
  }
}

final settingsProvider = StateNotifierProvider<SettingsNotifier, AppSettings>(
  (ref) => SettingsNotifier(),
);
