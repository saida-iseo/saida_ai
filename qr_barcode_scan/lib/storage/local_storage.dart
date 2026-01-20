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
}

class AppSettings {
  AppSettings({
    this.vibrate = true,
    this.sound = true,
    this.autoFocus = true,
    this.autoOpenUrl = false,
  });

  final bool vibrate;
  final bool sound;
  final bool autoFocus;
  final bool autoOpenUrl;

  AppSettings copyWith({
    bool? vibrate,
    bool? sound,
    bool? autoFocus,
    bool? autoOpenUrl,
  }) {
    return AppSettings(
      vibrate: vibrate ?? this.vibrate,
      sound: sound ?? this.sound,
      autoFocus: autoFocus ?? this.autoFocus,
      autoOpenUrl: autoOpenUrl ?? this.autoOpenUrl,
    );
  }

  factory AppSettings.fromMap(Map<dynamic, dynamic> map) {
    return AppSettings(
      vibrate: map['vibrate'] as bool? ?? true,
      sound: map['sound'] as bool? ?? true,
      autoFocus: map['autoFocus'] as bool? ?? true,
      autoOpenUrl: map['autoOpenUrl'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'vibrate': vibrate,
      'sound': sound,
      'autoFocus': autoFocus,
      'autoOpenUrl': autoOpenUrl,
    };
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
}

final settingsProvider = StateNotifierProvider<SettingsNotifier, AppSettings>(
  (ref) => SettingsNotifier(),
);
