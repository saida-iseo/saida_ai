import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:qr_barcode_scan/features/generator/generator_screen.dart';
import 'package:qr_barcode_scan/features/history/history_screen.dart';
import 'package:qr_barcode_scan/features/scanner/scanner_screen.dart';
import 'package:qr_barcode_scan/features/settings/settings_screen.dart';
import 'package:qr_barcode_scan/storage/local_storage.dart';
import 'package:qr_barcode_scan/ui/widgets/ad_placeholder.dart';

final navIndexProvider = StateProvider<int>((ref) => 0);

class BottomNavScaffold extends ConsumerStatefulWidget {
  const BottomNavScaffold({super.key});

  @override
  ConsumerState<BottomNavScaffold> createState() => _BottomNavScaffoldState();
}

class _BottomNavScaffoldState extends ConsumerState<BottomNavScaffold> {
  @override
  void initState() {
    super.initState();
    _requestNotificationOnce();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _showSafetyNoticeIfNeeded();
    });
  }

  Future<void> _requestNotificationOnce() async {
    if (LocalStorage.onboardingDone) return;
    await Permission.notification.request();
    await LocalStorage.setOnboardingDone();
  }

  Future<void> _showSafetyNoticeIfNeeded() async {
    if (LocalStorage.safetyNoticeDone) return;
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('안전 안내'),
        content: const Text(
          'QR은 출처 확인 후 열어주세요.\n\n'
          '이 앱은 위험 스킴을 차단하고, 도메인을 표시하며, 단축 URL은 리다이렉트 확인이 필요하다는 경고를 제공합니다.\n'
          '그래도 경고를 무시하고 “열기”를 선택한 경우, 또는 외부 사이트/앱의 행위로 인한 피해는 앱 기능과의 직접 인과관계가 약할 수 있습니다.\n\n'
          '의심되는 링크는 열지 말고 즉시 닫아주세요.',
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
            if (index >= 2) const AdPlaceholder(),
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
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
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
    final color = selected ? colorScheme.primary : colorScheme.onSurface.withOpacity(0.7);

    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          padding: const EdgeInsets.symmetric(vertical: 8),
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
                height: 36,
                width: 36,
                decoration: BoxDecoration(
                  color: colorScheme.surfaceVariant,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(height: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
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
