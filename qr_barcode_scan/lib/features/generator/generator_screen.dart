import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:qr_barcode_scan/models/history_item.dart';
import 'package:qr_barcode_scan/storage/local_storage.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:image_gallery_saver/image_gallery_saver.dart';
import 'package:permission_handler/permission_handler.dart';

enum GeneratorType { url, wifi, email }

class GeneratorScreen extends ConsumerStatefulWidget {
  const GeneratorScreen({super.key});

  @override
  ConsumerState<GeneratorScreen> createState() => _GeneratorScreenState();
}

class _GeneratorScreenState extends ConsumerState<GeneratorScreen> {
  final GlobalKey _qrKey = GlobalKey();
  GeneratorType _type = GeneratorType.url;
  String _payload = '';

  final TextEditingController _urlCtrl = TextEditingController();
  final TextEditingController _wifiSsidCtrl = TextEditingController();
  final TextEditingController _wifiPassCtrl = TextEditingController();
  final TextEditingController _emailToCtrl = TextEditingController();
  final TextEditingController _emailSubCtrl = TextEditingController();
  final TextEditingController _emailBodyCtrl = TextEditingController();
  String _wifiSecurity = 'WPA';

  @override
  void dispose() {
    _urlCtrl.dispose();
    _wifiSsidCtrl.dispose();
    _wifiPassCtrl.dispose();
    _emailToCtrl.dispose();
    _emailSubCtrl.dispose();
    _emailBodyCtrl.dispose();
    super.dispose();
  }

  void _buildPayload() {
    String payload = '';
    switch (_type) {
      case GeneratorType.url:
        payload = _urlCtrl.text.trim();
        break;
      case GeneratorType.wifi:
        final ssid = _wifiSsidCtrl.text.trim();
        final pass = _wifiPassCtrl.text.trim();
        payload = 'WIFI:T:$_wifiSecurity;S:$ssid;P:$pass;;';
        break;
      case GeneratorType.email:
        final to = _emailToCtrl.text.trim();
        final subject = _emailSubCtrl.text.trim();
        final body = _emailBodyCtrl.text.trim();
        payload = 'MATMSG:TO:$to;SUB:$subject;BODY:$body;;';
        break;
    }
    setState(() {
      _payload = payload;
    });

    if (payload.isNotEmpty) {
      LocalStorage.addHistory(
        HistoryItem(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          source: HistorySource.generate,
          type: _type == GeneratorType.url
              ? PayloadType.url
              : _type == GeneratorType.wifi
                  ? PayloadType.wifi
                  : PayloadType.email,
          value: payload,
          createdAt: DateTime.now(),
          meta: {},
        ),
      );
    }
  }

  Future<Uint8List?> _captureQrPng() async {
    final boundary = _qrKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
    if (boundary == null) return null;
    final image = await boundary.toImage(pixelRatio: 3);
    final data = await image.toByteData(format: ui.ImageByteFormat.png);
    return data?.buffer.asUint8List();
  }

  Future<void> _shareQr() async {
    final bytes = await _captureQrPng();
    if (bytes == null) return;
    final tempDir = await getTemporaryDirectory();
    final file = File('${tempDir.path}/qr_code.png');
    await file.writeAsBytes(bytes);
    await Share.shareXFiles([XFile(file.path)], text: 'QR Code');
  }

  Future<void> _saveQr() async {
    final bytes = await _captureQrPng();
    if (bytes == null) return;
    if (Platform.isIOS) {
      await Permission.photos.request();
    } else {
      await Permission.storage.request();
    }
    await ImageGallerySaver.saveImage(bytes, quality: 100, name: 'qr_code');
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('갤러리에 저장했습니다.')),
    );
  }

  Future<void> _copyPayload() async {
    await Clipboard.setData(ClipboardData(text: _payload));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('원문 텍스트를 복사했습니다.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('귀하의 기기에서 QR 코드를 생성해 봅시다',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          _QuickCard(
            title: '웹사이트',
            description: 'URL을 입력하면 바로 QR로 생성합니다.',
            selected: _type == GeneratorType.url,
            onTap: () => setState(() => _type = GeneratorType.url),
          ),
          _QuickCard(
            title: 'Wi-Fi',
            description: 'SSID/암호를 넣어 Wi-Fi QR을 만듭니다.',
            selected: _type == GeneratorType.wifi,
            onTap: () => setState(() => _type = GeneratorType.wifi),
          ),
          _QuickCard(
            title: '이메일',
            description: '수신자/제목/본문을 QR로 생성합니다.',
            selected: _type == GeneratorType.email,
            onTap: () => setState(() => _type = GeneratorType.email),
          ),
          const SizedBox(height: 16),
          _buildInputSection(),
          const SizedBox(height: 24),
          Center(
            child: RepaintBoundary(
              key: _qrKey,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: _payload.isEmpty
                    ? SizedBox(
                        height: 220,
                        width: 220,
                        child: Center(
                          child: Text('입력 후 생성 버튼을 누르세요', style: TextStyle(color: Colors.grey[500])),
                        ),
                      )
                    : QrImageView(
                        data: _payload,
                        size: 220,
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.black,
                      ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _payload.isEmpty ? null : _saveQr,
                  icon: const Icon(Icons.save_alt),
                  label: const Text('저장'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: colorScheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _payload.isEmpty ? null : _shareQr,
                  icon: const Icon(Icons.share),
                  label: const Text('공유'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: TextButton.icon(
              onPressed: _payload.isEmpty ? null : _copyPayload,
              icon: const Icon(Icons.copy),
              label: const Text('원문 텍스트 복사'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputSection() {
    switch (_type) {
      case GeneratorType.url:
        return _InputCard(
          title: 'URL 입력',
          child: TextField(
            controller: _urlCtrl,
            decoration: const InputDecoration(hintText: 'https://example.com'),
          ),
          onGenerate: _buildPayload,
        );
      case GeneratorType.wifi:
        return _InputCard(
          title: 'Wi-Fi 정보 입력',
          child: Column(
            children: [
              TextField(controller: _wifiSsidCtrl, decoration: const InputDecoration(hintText: 'SSID')),
              const SizedBox(height: 12),
              TextField(controller: _wifiPassCtrl, decoration: const InputDecoration(hintText: '암호')),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _wifiSecurity,
                items: const [
                  DropdownMenuItem(value: 'WPA', child: Text('WPA/WPA2')),
                  DropdownMenuItem(value: 'WEP', child: Text('WEP')),
                  DropdownMenuItem(value: 'nopass', child: Text('없음')),
                ],
                onChanged: (value) => setState(() => _wifiSecurity = value ?? 'WPA'),
              ),
            ],
          ),
          onGenerate: _buildPayload,
        );
      case GeneratorType.email:
        return _InputCard(
          title: '이메일 정보 입력',
          child: Column(
            children: [
              TextField(controller: _emailToCtrl, decoration: const InputDecoration(hintText: '받는 사람')),
              const SizedBox(height: 12),
              TextField(controller: _emailSubCtrl, decoration: const InputDecoration(hintText: '제목')),
              const SizedBox(height: 12),
              TextField(controller: _emailBodyCtrl, decoration: const InputDecoration(hintText: '본문')),
            ],
          ),
          onGenerate: _buildPayload,
        );
    }
  }
}

class _QuickCard extends StatelessWidget {
  const _QuickCard({
    required this.title,
    required this.description,
    required this.selected,
    required this.onTap,
  });

  final String title;
  final String description;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected ? colorScheme.primary.withOpacity(0.12) : colorScheme.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: selected ? colorScheme.primary : colorScheme.outlineVariant),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Text(description, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}

class _InputCard extends StatelessWidget {
  const _InputCard({
    required this.title,
    required this.child,
    required this.onGenerate,
  });

  final String title;
  final Widget child;
  final VoidCallback onGenerate;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          child,
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerRight,
            child: ElevatedButton(
              onPressed: onGenerate,
              child: const Text('QR 생성'),
            ),
          ),
        ],
      ),
    );
  }
}
