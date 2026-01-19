import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:qr_barcode_scan/app/app_theme.dart';
import 'package:qr_barcode_scan/app/bottom_nav.dart';
import 'package:qr_barcode_scan/storage/local_storage.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();
  await LocalStorage.init();

  runApp(const ProviderScope(child: QrBarcodeApp()));
}

class QrBarcodeApp extends StatelessWidget {
  const QrBarcodeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'QR-Barcode scan',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: ThemeMode.system,
      home: const BottomNavScaffold(),
    );
  }
}
