import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:qr_barcode_scan/app/app_theme.dart';
import 'package:qr_barcode_scan/app/bottom_nav.dart';
import 'package:qr_barcode_scan/app/splash_screen.dart';
import 'package:qr_barcode_scan/storage/local_storage.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
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
      home: const _SplashGate(),
    );
  }
}

class _SplashGate extends StatefulWidget {
  const _SplashGate();

  @override
  State<_SplashGate> createState() => _SplashGateState();
}

class _SplashGateState extends State<_SplashGate> {
  bool _done = false;

  @override
  Widget build(BuildContext context) {
    if (_done) {
      return const BottomNavScaffold();
    }
    return SplashScreen(onFinish: () => setState(() => _done = true));
  }
}
