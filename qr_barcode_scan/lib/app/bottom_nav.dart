import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:qr_barcode_scan/app/nav_provider.dart';
import 'package:qr_barcode_scan/features/generator/generator_screen.dart';
import 'package:qr_barcode_scan/features/generator/models/qr_type.dart';
import 'package:qr_barcode_scan/features/generator/qr_form_screen.dart';
import 'package:qr_barcode_scan/features/history/history_screen.dart';
import 'package:qr_barcode_scan/features/onboarding/onboarding_screen.dart';
import 'package:qr_barcode_scan/features/scanner/scanner_screen.dart';
import 'package:qr_barcode_scan/features/settings/settings_screen.dart';
import 'package:qr_barcode_scan/storage/local_storage.dart';
import 'package:qr_barcode_scan/ui/widgets/ad_banner.dart';
import 'package:qr_barcode_scan/utils/process_text_service.dart';

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
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await _maybeShowOnboarding();
      if (!mounted) return;
      await _maybeShowSafetyNotice();
      if (!mounted) return;
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

  Future<void> _maybeShowOnboarding() async {
    if (!LocalStorage.shouldShowOnboarding) return;
    final action = await Navigator.of(context).push<OnboardingAction>(
      MaterialPageRoute(builder: (_) => const OnboardingScreen()),
    );
    if (!mounted) return;
    await LocalStorage.setOnboardingSeen();
    if (action == OnboardingAction.startScan) {
      ref.read(navIndexProvider.notifier).state = 0;
    }
  }

  Future<void> _maybeShowSafetyNotice() async {
    if (!LocalStorage.shouldShowSafetyNotice) return;
    final action = await showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('큐싱(크싱) 피해 예방 안내'),
        content: const SingleChildScrollView(
          child: Text(
            '출처가 불분명한 QR은 스캔하지 마세요.\n'
            '스캔 후 열리는 주소를 꼭 확인하세요.\n'
            '개인정보 입력을 요구하면 의심하세요.',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, 'snooze'),
            child: const Text('24시간 동안 닫기'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, 'dismiss'),
            child: const Text('닫기'),
          ),
        ],
      ),
    );
    if (action == 'snooze') {
      await LocalStorage.snoozeSafetyNoticeFor24Hours();
    }
    LocalStorage.safetyNoticeAcknowledged = true;
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
