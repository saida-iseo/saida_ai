import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:qr_barcode_scan/features/generator/generator_screen.dart';
import 'package:qr_barcode_scan/features/generator/models/qr_type.dart';
import 'package:qr_barcode_scan/features/generator/qr_form_screen.dart';
import 'package:qr_barcode_scan/features/history/history_screen.dart';
import 'package:qr_barcode_scan/features/scanner/scanner_screen.dart';
import 'package:qr_barcode_scan/features/settings/settings_screen.dart';
import 'package:qr_barcode_scan/storage/local_storage.dart';
import 'package:qr_barcode_scan/ui/widgets/ad_banner.dart';
import 'package:qr_barcode_scan/utils/process_text_service.dart';

final navIndexProvider = StateProvider<int>((ref) => 0);

class BottomNavScaffold extends ConsumerStatefulWidget {
  const BottomNavScaffold({super.key});

  @override
  ConsumerState<BottomNavScaffold> createState() => _BottomNavScaffoldState();
}

class _BottomNavScaffoldState extends ConsumerState<BottomNavScaffold> {
  StreamSubscription<String>? _processTextSub;

  @override
  void initState() {
    super.initState();
    _initAds();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _requestInitialPermissions();
      _showSafetyNoticeIfNeeded();
      _listenProcessText();
    });
  }

  Future<void> _initAds() async {
    try {
      await MobileAds.instance.initialize();
    } catch (_) {
      // 광고 초기화 실패는 UX에 치명적이지 않으므로 무시합니다.
    }
  }

  Future<void> _showSafetyNoticeIfNeeded() async {
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('큐싱(크싱) 피해 예방 안내'),
        content: const SingleChildScrollView(
          child: Text(
            'QR코드를 이용한 큐싱(Qshing) 범죄가 증가하고 있습니다.\n'
            '출처가 불분명한 QR코드는 주의하세요.\n\n'
            '큐싱이란?\n'
            'QR코드 + 피싱의 합성어로, 악성 QR코드를 스캔하면 개인·금융정보 탈취, 원격 제어, 결제 피해가 발생할 수 있습니다.\n\n'
            '예방 수칙\n'
            '• 출처가 불분명한 QR코드는 스캔하지 않기\n'
            '• 스캔 후 열리는 URL이 정상인지 확인\n'
            '• 개인정보 입력을 요구하면 의심\n'
            '• 보안 앱 최신 상태 유지\n\n'
            '피해가 의심되면 즉시 비행기 모드 전환 후 백신으로 점검하고, 112/1332/118 등에 신고하세요.',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('확인'),
          ),
        ],
      ),
    );
    await LocalStorage.setSafetyNoticeDone();
  }

  void _listenProcessText() {
    ProcessTextService.getInitialText().then(_handleProcessText);
    _processTextSub?.cancel();
    _processTextSub = ProcessTextService.stream.listen(_handleProcessText);
  }

  void _handleProcessText(String? text) {
    if (text == null || text.trim().isEmpty) return;
    final url = _normalizeUrl(text);
    if (url == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('지원하지 않는 텍스트입니다.')));
      return;
    }
    ref.read(navIndexProvider.notifier).state = 1;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => QrFormScreen(
          type: QrType.website,
          initialText: url,
          autoApply: true,
        ),
      ),
    );
  }

  String? _normalizeUrl(String text) {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return null;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    if (trimmed.contains(' ') || !trimmed.contains('.')) return null;
    return 'https://$trimmed';
  }

  Future<void> _requestInitialPermissions() async {
    final cameraStatus = await Permission.camera.status;
    if (!cameraStatus.isGranted) {
      await Permission.camera.request();
    }
  }

  @override
  void dispose() {
    _processTextSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final index = ref.watch(navIndexProvider);

    final screens = [
      const ScannerScreen(),
      const GeneratorScreen(),
      const HistoryScreen(),
      const SettingsScreen(),
    ];

    return Scaffold(
      body: SafeArea(
        top: index != 0,
        bottom: false,
        child: Column(
          children: [
            Visibility(
              visible: index >= 1,
              maintainState: true,
              maintainAnimation: true,
              maintainSize: false,
              child: const AdBanner(),
            ),
            Expanded(child: screens[index]),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 24,
                offset: const Offset(0, -8),
              ),
            ],
          ),
          padding: const EdgeInsets.fromLTRB(16, 6, 16, 14),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _NavItem(
                label: '스캔',
                icon: Icons.center_focus_strong_rounded,
                selected: index == 0,
                onTap: () => ref.read(navIndexProvider.notifier).state = 0,
              ),
              _NavItem(
                label: '생성',
                icon: Icons.qr_code_2_rounded,
                selected: index == 1,
                onTap: () => ref.read(navIndexProvider.notifier).state = 1,
              ),
              _NavItem(
                label: '기록',
                icon: Icons.history,
                selected: index == 2,
                onTap: () => ref.read(navIndexProvider.notifier).state = 2,
              ),
              _NavItem(
                label: '설정',
                icon: Icons.settings,
                selected: index == 3,
                onTap: () => ref.read(navIndexProvider.notifier).state = 3,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final color = selected
        ? colorScheme.primary
        : colorScheme.onSurface.withOpacity(0.7);

    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          padding: const EdgeInsets.symmetric(vertical: 6),
          decoration: BoxDecoration(
            color: selected
                ? colorScheme.primary.withOpacity(0.12)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                height: 32,
                width: 32,
                decoration: BoxDecoration(
                  color: colorScheme.surfaceContainerHighest,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 18),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: selected ? FontWeight.bold : FontWeight.w500,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
