import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive/hive.dart';
import 'package:qr_barcode_scan/models/history_item.dart';

class LocalStorage {
  static const String historyBoxName = 'history';
  static const String settingsBoxName = 'settings';

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

  static bool get onboardingDone => _settingsBox.get('onboarding')?['done'] == true;

  static Future<void> setOnboardingDone() async {
    await _settingsBox.put('onboarding', {'done': true});
  }

  static bool get safetyNoticeDone => _settingsBox.get('safetyNotice')?['done'] == true;

  static Future<void> setSafetyNoticeDone() async {
    await _settingsBox.put('safetyNotice', {'done': true});
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
      autoOpenUrl: map['autoOpenUrl'] as bool? ?? true,
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
