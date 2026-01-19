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
  }

  Future<void> _requestNotificationOnce() async {
    if (LocalStorage.onboardingDone) return;
    await Permission.notification.request();
    await LocalStorage.setOnboardingDone();
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
        child: Column(
          children: [
            const AdPlaceholder(),
            Expanded(child: screens[index]),
          ],
        ),
      ),
      bottomNavigationBar: Container(
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
              icon: Icons.qr_code_scanner,
              selected: index == 0,
              onTap: () => ref.read(navIndexProvider.notifier).state = 0,
            ),
            _NavItem(
              label: '생성',
              icon: Icons.add_box_rounded,
              selected: index == 1,
              isPrimary: true,
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
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
    this.isPrimary = false,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final bool isPrimary;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final color = selected ? colorScheme.primary : colorScheme.onSurface.withOpacity(0.6);

    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: selected && isPrimary ? colorScheme.primary.withOpacity(0.15) : Colors.transparent,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                height: isPrimary ? 44 : 36,
                width: isPrimary ? 44 : 36,
                decoration: BoxDecoration(
                  color: isPrimary ? colorScheme.primary : colorScheme.surfaceVariant,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: isPrimary ? Colors.white : color, size: isPrimary ? 22 : 20),
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
