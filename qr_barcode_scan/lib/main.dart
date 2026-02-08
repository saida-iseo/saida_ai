import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:qr_barcode_scan/app/app_theme.dart';
import 'package:qr_barcode_scan/app/bottom_nav.dart';
import 'package:qr_barcode_scan/app/backend_config.dart';
import 'package:qr_barcode_scan/storage/local_storage.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Supabase.initialize(
    url: BackendConfig.supabaseUrl,
    anonKey: BackendConfig.supabaseAnonKey,
  );

  await Hive.initFlutter();
  await LocalStorage.init();

  runApp(const ProviderScope(child: QrBarcodeApp()));
}

class QrBarcodeApp extends ConsumerWidget {
  const QrBarcodeApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);
    final themeMode = switch (settings.themeMode) {
      AppThemeMode.light => ThemeMode.light,
      AppThemeMode.dark => ThemeMode.dark,
      AppThemeMode.system => ThemeMode.system,
    };

    return MaterialApp(
      title: 'QR-Barcode scan',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: themeMode,
      home: const BottomNavScaffold(),
    );
  }
}
