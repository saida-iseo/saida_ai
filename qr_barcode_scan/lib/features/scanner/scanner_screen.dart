import 'dart:math' as math;

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
    final format = barcode?.format;
    if (!_isBarcodeMode && format != BarcodeFormat.qrCode) return;
    if (_isBarcodeMode && format == BarcodeFormat.qrCode) return;

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

    final parsed = _parseForMode(value, format);
    final meta = <String, dynamic>{...parsed.data};
    if (format != null) {
      meta['format'] = format.name;
    }
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
    var autoOpenUrl = settings.autoOpenUrl;
    final isOpenableUrl = parsed.type == PayloadType.url || parsed.type == PayloadType.pdf;
    if (isOpenableUrl && !LocalStorage.firstScanNoticeDone) {
      final nextAutoOpen = await _showFirstScanNotice(
        context,
        parsed.data['url'] ?? parsed.raw,
        settings.autoOpenUrl,
      );
      if (nextAutoOpen != null) {
        await ref.read(settingsProvider.notifier).setAutoOpenUrl(nextAutoOpen);
        autoOpenUrl = nextAutoOpen;
      }
      await LocalStorage.setFirstScanNoticeDone();
    }
    if (isOpenableUrl && autoOpenUrl) {
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

  ParsedResult _parseForMode(String value, BarcodeFormat? format) {
    if (format != null && format != BarcodeFormat.qrCode) {
      return ParsedResult(
        type: PayloadType.barcode,
        raw: value,
        data: {
          'format': format.name,
          'formatLabel': _barcodeFormatLabel(format),
        },
      );
    }
    return parsePayload(value);
  }

  String _barcodeFormatLabel(BarcodeFormat format) {
    switch (format) {
      case BarcodeFormat.ean13:
        return 'EAN-13';
      case BarcodeFormat.ean8:
        return 'EAN-8';
      case BarcodeFormat.upcA:
        return 'UPC-A';
      case BarcodeFormat.upcE:
        return 'UPC-E';
      case BarcodeFormat.code128:
        return 'Code 128';
      case BarcodeFormat.code39:
        return 'Code 39';
      case BarcodeFormat.code93:
        return 'Code 93';
      case BarcodeFormat.itf:
        return 'ITF';
      case BarcodeFormat.codabar:
        return 'Codabar';
      case BarcodeFormat.dataMatrix:
        return 'Data Matrix';
      case BarcodeFormat.pdf417:
        return 'PDF417';
      case BarcodeFormat.aztec:
        return 'Aztec';
      default:
        return format.name.toUpperCase();
    }
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
    final settings = ref.read(settingsProvider);
    final uri = Uri.tryParse(url);
    if (uri == null || !(uri.scheme == 'http' || uri.scheme == 'https')) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('지원하지 않는 링크 형식입니다.')),
      );
      return;
    }
    if (!settings.safetyCheck) {
      await launchUrlPreferApp(url);
      return;
    }
    final safety = evaluateUrlSafety(url);
    if (safety.requiresConfirm) {
      final proceed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('안전 경고'),
          content: Text(
            [
              '링크를 열기 전에 확인해주세요.',
              '도메인: ${extractDomain(url) ?? uri.host}',
              if (safety.reasons.isNotEmpty) safety.reasons.join('\n'),
              '악성 코드/피싱 위험이 있을 수 있습니다.',
              '경고를 무시하고 “열기”를 선택한 경우 책임은 사용자에게 있습니다.',
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

  Future<bool?> _showFirstScanNotice(
    BuildContext context,
    String url,
    bool initialAutoOpen,
  ) async {
    final uri = Uri.tryParse(url);
    if (uri == null) return null;
    final isHttps = uri.scheme == 'https';
    final domain = extractDomain(url) ?? uri.host;
    final safety = evaluateUrlSafety(url);
    bool autoOpen = initialAutoOpen;

    return showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return AlertDialog(
              title: const Text('링크 확인'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('도메인: $domain'),
                  const SizedBox(height: 4),
                  Text('HTTPS: ${isHttps ? '사용' : '미사용'}'),
                  const SizedBox(height: 8),
                  Text(
                    safety.reasons.isEmpty ? '의심 신호 없음' : safety.reasons.join('\n'),
                    style: TextStyle(
                      color: safety.reasons.isEmpty
                          ? Theme.of(context).colorScheme.onSurface.withOpacity(0.7)
                          : Theme.of(context).colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Checkbox(
                        value: autoOpen,
                        onChanged: (value) => setStateDialog(() => autoOpen = value ?? false),
                      ),
                      const SizedBox(width: 6),
                      const Expanded(child: Text('다음부터 자동 열기')),
                    ],
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, autoOpen),
                  child: const Text('확인'),
                ),
              ],
            );
          },
        );
      },
    );
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
              ? LayoutBuilder(
                  builder: (context, constraints) {
                    final safe = MediaQuery.of(context).padding;
                    final textScale = MediaQuery.textScaleFactorOf(context);
                    final compact = constraints.maxHeight < 680;
                    final titleHeight = compact ? 28.0 : 32.0;
                    final topPadding = safe.top + 12;
                    final topGap = 12.0;
                    final toggleHeight = compact ? 36.0 : 40.0;
                    final barMinHeight = compact ? 52.0 : 56.0;
                    final barGrowth = (textScale - 1).clamp(0.0, 0.8) * 12.0;
                    final barReservedHeight = barMinHeight + barGrowth;
                    final barGap = compact ? 12.0 : 16.0;
                    final extraBottomGap = compact ? 8.0 : 12.0;
                    final bottomInset = safe.bottom + extraBottomGap;
                    final topReserved = topPadding + titleHeight + topGap;
                    final bottomReserved = toggleHeight + barGap + barReservedHeight + bottomInset;
                    final availableHeight = (constraints.maxHeight - topReserved - bottomReserved)
                        .clamp(0.0, constraints.maxHeight);
                    final scanSize = math.min(constraints.maxWidth * 0.74, availableHeight);
                    final scanWindow = Rect.fromLTWH(
                      (constraints.maxWidth - scanSize) / 2,
                      topReserved + (availableHeight - scanSize) / 2,
                      scanSize,
                      scanSize,
                    );
                    final toggleBottom = bottomInset + barReservedHeight + barGap;

                    return Stack(
                      fit: StackFit.expand,
                      children: [
                        MobileScanner(
                          controller: _controller,
                          fit: BoxFit.cover,
                          scanWindow: scanWindow,
                          onDetect: _handleBarcode,
                          errorBuilder: (context, error, child) {
                            return Center(
                              child: Text(
                                '카메라 오류가 발생했습니다.',
                                style: TextStyle(color: Colors.white.withOpacity(0.9)),
                              ),
                            );
                          },
                        ),
                        ScanOverlay(
                          scanWindow: scanWindow,
                          label: '이 곳에 QR 코드를 위치시켜주세요',
                        ),
                        Positioned(
                          left: 16,
                          right: 16,
                          top: topPadding,
                          child: Text(
                            'QR 스캔',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: compact ? 22 : 24,
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Positioned(
                          left: 16,
                          right: 16,
                          bottom: toggleBottom,
                          child: SizedBox(
                            height: toggleHeight,
                            child: _SettingToggleRow(
                              label: 'URL/PDF 자동 열기',
                              enabled: settings.autoOpenUrl,
                              onChanged: (_) => ref.read(settingsProvider.notifier).toggleAutoOpenUrl(),
                              textStyle: TextStyle(
                                color: Colors.white.withOpacity(0.85),
                                fontSize: compact ? 12 : 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          left: 16,
                          right: 16,
                          bottom: extraBottomGap,
                          child: SafeArea(
                            top: false,
                            child: Container(
                              constraints: BoxConstraints(minHeight: barMinHeight),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.5),
                                borderRadius: BorderRadius.circular(22),
                              ),
                              child: Row(
                                children: [
                                  _ScanControlButton(
                                    icon: Icons.photo_library_outlined,
                                    label: '앨범',
                                    fontSize: compact ? 12 : 13,
                                    verticalPadding: compact ? 6 : 8,
                                    onTap: _pickFromGallery,
                                  ),
                                  _ScanControlButton(
                                    icon: _controller.torchEnabled ? Icons.flash_on : Icons.flash_off,
                                    label: '플래시',
                                    fontSize: compact ? 12 : 13,
                                    verticalPadding: compact ? 6 : 8,
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
                  },
                )
              : _PermissionPrompt(onRetry: _requestCameraPermission),
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
    this.fontSize = 13,
    this.verticalPadding = 8,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final double fontSize;
  final double verticalPadding;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: verticalPadding),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: Colors.white),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(color: Colors.white, fontSize: fontSize, fontWeight: FontWeight.w600),
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

class _ModeSegmented extends StatelessWidget {
  const _ModeSegmented({
    required this.isBarcode,
    required this.onChanged,
  });

  final bool isBarcode;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final inactive = Colors.white.withOpacity(0.5);
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.45),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.12)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _ModePill(
            label: 'QR',
            selected: !isBarcode,
            onTap: () => onChanged(false),
          ),
          const SizedBox(width: 6),
          _ModePill(
            label: '바코드',
            selected: isBarcode,
            onTap: () => onChanged(true),
          ),
        ],
      ),
    );
  }
}

class _ModePill extends StatelessWidget {
  const _ModePill({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 140),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? colorScheme.primary : Colors.white.withOpacity(0.7),
            fontWeight: FontWeight.w700,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}

class _SettingToggleRow extends StatelessWidget {
  const _SettingToggleRow({
    required this.label,
    required this.enabled,
    required this.onChanged,
    required this.textStyle,
  });

  final String label;
  final bool enabled;
  final ValueChanged<bool> onChanged;
  final TextStyle textStyle;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(label, style: textStyle, maxLines: 1, overflow: TextOverflow.ellipsis),
        const SizedBox(width: 8),
        Switch.adaptive(
          value: enabled,
          onChanged: onChanged,
          activeColor: Theme.of(context).colorScheme.primary,
          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
        ),
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
