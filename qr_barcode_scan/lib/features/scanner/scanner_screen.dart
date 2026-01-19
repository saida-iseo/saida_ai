import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:qr_barcode_scan/models/history_item.dart';
import 'package:qr_barcode_scan/storage/local_storage.dart';
import 'package:qr_barcode_scan/ui/widgets/result_sheet.dart';
import 'package:qr_barcode_scan/ui/widgets/scan_overlay.dart';
import 'package:qr_barcode_scan/utils/parsers.dart';
import 'package:url_launcher/url_launcher.dart';

class ScannerScreen extends ConsumerStatefulWidget {
  const ScannerScreen({super.key});

  @override
  ConsumerState<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends ConsumerState<ScannerScreen> {
  final MobileScannerController _controller = MobileScannerController(torchEnabled: false);
  String? _lastValue;
  DateTime? _lastScanTime;
  bool _isSheetOpen = false;
  bool _permissionGranted = false;

  @override
  void initState() {
    super.initState();
    _requestCameraPermission();
  }

  Future<void> _requestCameraPermission() async {
    final status = await Permission.camera.request();
    if (!mounted) return;
    setState(() {
      _permissionGranted = status.isGranted;
    });
  }

  Future<void> _handleBarcode(BarcodeCapture capture) async {
    if (_isSheetOpen) return;
    final barcode = capture.barcodes.firstOrNull;
    final value = barcode?.rawValue;
    if (value == null || value.isEmpty) return;

    final now = DateTime.now();
    if (_lastValue == value && _lastScanTime != null) {
      final diff = now.difference(_lastScanTime!);
      if (diff.inMilliseconds < 2000) return;
    }
    _lastValue = value;
    _lastScanTime = now;

    final settings = ref.read(settingsProvider);
    if (settings.vibrate) {
      HapticFeedback.lightImpact();
    }
    if (settings.sound) {
      SystemSound.play(SystemSoundType.click);
    }

    final parsed = parsePayload(value);
    await LocalStorage.addHistory(
      HistoryItem(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        source: HistorySource.scan,
        type: parsed.type,
        value: parsed.raw,
        createdAt: now,
        meta: parsed.data,
      ),
    );

    _isSheetOpen = true;
    await _controller.stop();

    if (!mounted) return;
    if (parsed.type == PayloadType.url && settings.autoOpenUrl) {
      final uri = Uri.tryParse(parsed.data['url'] ?? parsed.raw);
      if (uri != null) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    }

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ResultSheet(
        result: parsed,
        onOpenUrl: () async {
          final url = parsed.data['url'] ?? parsed.raw;
          final uri = Uri.tryParse(url);
          if (uri != null) {
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          }
          if (mounted) Navigator.pop(context);
        },
      ),
    );

    if (!mounted) return;
    _isSheetOpen = false;
    await _controller.start();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final settings = ref.watch(settingsProvider);
    // TODO: mobile_scanner의 자동 초점 직접 제어는 제한적이라 UI 상태만 반영합니다.

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  'QR 코드/바코드를 프레임 내에서 스캔하려면 정렬하세요',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
              IconButton(
                onPressed: () async {
                  await _controller.toggleTorch();
                  setState(() {});
                },
                icon: Icon(
                  _controller.torchEnabled ? Icons.flash_on : Icons.flash_off,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(28),
              color: Colors.black,
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(28),
              child: Stack(
                children: [
                  if (_permissionGranted)
                    MobileScanner(
                      controller: _controller,
                      fit: BoxFit.cover,
                      onDetect: _handleBarcode,
                      errorBuilder: (context, error, child) {
                        return Center(
                          child: Text(
                            '카메라 오류가 발생했습니다.',
                            style: TextStyle(color: Colors.white.withOpacity(0.9)),
                          ),
                        );
                      },
                    )
                  else
                    _PermissionPrompt(onRetry: _requestCameraPermission),
                  const ScanOverlay(),
                  Positioned(
                    bottom: 18,
                    left: 16,
                    right: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.center_focus_strong, color: Colors.white.withOpacity(0.9)),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              settings.autoFocus ? '자동 초점 활성화' : '자동 초점 비활성화',
                              style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _PermissionPrompt extends StatelessWidget {
  const _PermissionPrompt({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.lock_camera, size: 48, color: colorScheme.primary),
            const SizedBox(height: 12),
            Text(
              '카메라 권한이 필요합니다.',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              '설정에서 권한을 허용하거나 다시 시도하세요.',
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton(
                  onPressed: onRetry,
                  child: const Text('권한 다시 요청'),
                ),
                const SizedBox(width: 12),
                OutlinedButton(
                  onPressed: () => openAppSettings(),
                  child: const Text('설정 열기'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

extension _BarcodeListExtension on List<Barcode> {
  Barcode? get firstOrNull => isNotEmpty ? first : null;
}
