import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:qr_barcode_scan/models/history_item.dart';
import 'package:qr_barcode_scan/storage/local_storage.dart';
import 'package:qr_barcode_scan/ui/widgets/result_sheet.dart';
import 'package:qr_barcode_scan/ui/widgets/scan_overlay.dart';
import 'package:qr_barcode_scan/utils/link_handler.dart';
import 'package:qr_barcode_scan/utils/parsers.dart';
import 'package:qr_barcode_scan/utils/url_safety.dart';

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
  bool _isBarcodeMode = false;

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

  Future<void> _handleBarcode(BarcodeCapture capture, {String? imagePath}) async {
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
    final meta = <String, dynamic>{...parsed.data};
    if (imagePath != null) {
      meta['imagePath'] = imagePath;
    }
    await LocalStorage.addHistory(
      HistoryItem(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        source: HistorySource.scan,
        type: parsed.type,
        value: parsed.raw,
        createdAt: now,
        meta: meta,
      ),
    );

    _isSheetOpen = true;
    await _controller.stop();

    if (!mounted) return;
    if (parsed.type == PayloadType.url && settings.autoOpenUrl) {
      await _openUrlWithSafety(context, parsed.data['url'] ?? parsed.raw);
    }

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ResultSheet(
        result: parsed,
        onOpenUrl: () async {
          await _openUrlWithSafety(context, parsed.data['url'] ?? parsed.raw);
          if (mounted) Navigator.pop(context);
        },
      ),
    );

    if (!mounted) return;
    _isSheetOpen = false;
    await _controller.start();
  }

  Future<void> _pickFromGallery() async {
    if (_isSheetOpen) return;
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.gallery);
    if (image == null) return;

    final capture = await _controller.analyzeImage(image.path);
    if (capture == null || capture.barcodes.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('이미지에서 QR/바코드를 찾을 수 없습니다.')),
      );
      return;
    }
    await _handleBarcode(capture, imagePath: image.path);
  }

  Future<void> _openUrlWithSafety(BuildContext context, String url) async {
    final safety = evaluateUrlSafety(url);
    if (safety.requiresConfirm) {
      final proceed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('안전 경고'),
          content: Text(
            [
              '링크를 열기 전에 확인해주세요.',
              if (safety.reasons.isNotEmpty) safety.reasons.join('\n'),
              '악성 코드/피싱 위험이 있을 수 있습니다.',
            ].join('\n\n'),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('취소')),
            TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('열기')),
          ],
        ),
      );
      if (proceed != true) return;
    }
    await launchUrlPreferApp(url);
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

    return Stack(
      children: [
        Positioned.fill(
          child: _permissionGranted
              ? MobileScanner(
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
              : _PermissionPrompt(onRetry: _requestCameraPermission),
        ),
        if (_permissionGranted) ScanOverlay(isBarcode: _isBarcodeMode),
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.4),
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: Text(
                          settings.autoFocus ? '자동 인식 중' : '자동 초점 꺼짐',
                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ),
                      const Spacer(),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '이 곳에 QR을 가까이 대보세요',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.85),
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        if (_permissionGranted)
          Positioned(
            left: 16,
            right: 16,
            bottom: 16,
            child: SafeArea(
              top: false,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.55),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Colors.white.withOpacity(0.1)),
                ),
                child: Row(
                  children: [
                    _ScanControlButton(
                      icon: Icons.photo_library_outlined,
                      label: '앨범',
                      onTap: _pickFromGallery,
                    ),
                    _ScanControlButton(
                      icon: _isBarcodeMode ? Icons.view_week : Icons.qr_code_2,
                      label: _isBarcodeMode ? '바코드' : 'QR',
                      onTap: () => setState(() => _isBarcodeMode = !_isBarcodeMode),
                    ),
                    _ScanControlButton(
                      icon: _controller.torchEnabled ? Icons.flash_on : Icons.flash_off,
                      label: '플래시',
                      onTap: () async {
                        await _controller.toggleTorch();
                        setState(() {});
                      },
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _ScanControlButton extends StatelessWidget {
  const _ScanControlButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: Colors.white),
              const SizedBox(height: 4),
              Text(
                label,
                style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
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
            Icon(Icons.lock, size: 48, color: colorScheme.primary),
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
