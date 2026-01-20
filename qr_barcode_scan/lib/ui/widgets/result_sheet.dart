import 'package:barcode_widget/barcode_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_barcode_scan/models/history_item.dart';
import 'package:qr_barcode_scan/utils/parsers.dart';
import 'package:qr_barcode_scan/utils/url_safety.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

class ResultSheet extends StatelessWidget {
  const ResultSheet({
    super.key,
    required this.result,
    required this.onOpenUrl,
  });

  final ParsedResult result;
  final VoidCallback onOpenUrl;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final bottomInset = MediaQuery.of(context).padding.bottom;

    return Container(
      padding: EdgeInsets.fromLTRB(24, 12, 24, 24 + bottomInset),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 44,
              height: 4,
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: colorScheme.outlineVariant,
                borderRadius: BorderRadius.circular(100),
              ),
            ),
          ),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: colorScheme.primary.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  result.type.name.toUpperCase(),
                  style: TextStyle(
                    color: colorScheme.primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ),
              const Spacer(),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildContent(context),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: _buildActions(context),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    switch (result.type) {
      case PayloadType.url:
        final url = result.data['url'] ?? result.raw;
        final domain = extractDomain(url) ?? url;
        final safety = evaluateUrlSafety(url);
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              domain,
              style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
            _SafetyBadge(level: safety.level),
            if (safety.reasons.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                safety.reasons.join(' · '),
                style: textTheme.bodySmall?.copyWith(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7)),
              ),
            ],
            const SizedBox(height: 6),
            Text(
              url,
              style: textTheme.bodySmall?.copyWith(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7)),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        );
      case PayloadType.text:
        return Text(result.raw, style: textTheme.titleMedium);
      case PayloadType.wifi:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('SSID: ${result.data['ssid'] ?? '-'}', style: textTheme.titleMedium),
            const SizedBox(height: 8),
            Text('암호: ${result.data['password'] ?? '-'}'),
            const SizedBox(height: 8),
            Text('보안: ${result.data['type'] ?? 'WPA'}'),
          ],
        );
      case PayloadType.email:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('받는 사람: ${result.data['to'] ?? '-'}', style: textTheme.titleMedium),
            const SizedBox(height: 6),
            Text('제목: ${result.data['subject'] ?? '-'}'),
            const SizedBox(height: 6),
            Text('내용: ${result.data['body'] ?? '-'}'),
          ],
        );
      case PayloadType.pdf:
      case PayloadType.image:
      case PayloadType.video:
      case PayloadType.social:
      case PayloadType.playlist:
        final label = result.data['label'] ?? result.type.name.toUpperCase();
        final url = result.data['url'] ?? result.raw;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              url,
              style: textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        );
      case PayloadType.vcard:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(result.data['name'] ?? 'Vcard Plus', style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            if ((result.data['org'] ?? '').isNotEmpty) Text('회사: ${result.data['org']}'),
            if ((result.data['phone'] ?? '').isNotEmpty) Text('전화: ${result.data['phone']}'),
            if ((result.data['email'] ?? '').isNotEmpty) Text('이메일: ${result.data['email']}'),
          ],
        );
      case PayloadType.barcode:
        final format = result.data['format'] ?? '';
        final formatLabel = result.data['formatLabel'] ?? '바코드';
        final barcode = _barcodeFromFormat(format);
        final isValid = barcode.isValid(result.raw);
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(formatLabel, style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceVariant,
                borderRadius: BorderRadius.circular(20),
              ),
              child: isValid
                  ? BarcodeWidget(
                      barcode: barcode,
                      data: result.raw,
                      drawText: false,
                      height: 120,
                    )
                  : Center(
                      child: Text(
                        '바코드 미리보기를 생성할 수 없습니다.',
                        style: textTheme.bodySmall,
                      ),
                    ),
            ),
            const SizedBox(height: 12),
            Text('코드: ${result.raw}', style: textTheme.bodyMedium),
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(Icons.local_offer, size: 16, color: Theme.of(context).colorScheme.primary),
                const SizedBox(width: 6),
                Text(
                  '가격 정보는 제휴 데이터가 필요합니다.',
                  style: textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.65),
                  ),
                ),
              ],
            ),
          ],
        );
      case PayloadType.unknown:
        return Text(result.raw, style: textTheme.titleMedium);
    }
  }

  List<Widget> _buildActions(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final actions = <Widget>[
      _ActionButton(
        label: '복사',
        icon: Icons.copy,
        onTap: () async {
          await Clipboard.setData(ClipboardData(text: result.raw));
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('클립보드에 복사했습니다.')),
          );
        },
      ),
    ];

    if (result.type == PayloadType.url ||
        result.type == PayloadType.pdf ||
        result.type == PayloadType.image ||
        result.type == PayloadType.video ||
        result.type == PayloadType.social ||
        result.type == PayloadType.playlist) {
      actions.add(
        _ActionButton(
          label: '열기',
          icon: Icons.open_in_browser,
          color: colorScheme.primary,
          onTap: onOpenUrl,
        ),
      );
    }

    actions.add(
      _ActionButton(
        label: '공유',
        icon: Icons.share,
        onTap: () => Share.share(result.raw),
      ),
    );

    if (result.type == PayloadType.email && result.data['to'] != null) {
      actions.insert(
        1,
        _ActionButton(
          label: '메일',
          icon: Icons.email,
          color: colorScheme.primary,
          onTap: () async {
            final uri = Uri(
              scheme: 'mailto',
              path: result.data['to'] ?? '',
              queryParameters: {
                if ((result.data['subject'] ?? '').isNotEmpty) 'subject': result.data['subject'],
                if ((result.data['body'] ?? '').isNotEmpty) 'body': result.data['body'],
              },
            );
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          },
        ),
      );
    }

    return actions;
  }
}

Barcode _barcodeFromFormat(String format) {
  switch (format) {
    case 'ean13':
      return Barcode.ean13();
    case 'ean8':
      return Barcode.ean8();
    case 'upcA':
      return Barcode.upcA();
    case 'upcE':
      return Barcode.upcE();
    case 'code128':
      return Barcode.code128();
    case 'code39':
      return Barcode.code39();
    case 'code93':
      return Barcode.code93();
    case 'itf':
      return Barcode.itf();
    case 'codabar':
      return Barcode.codabar();
    case 'dataMatrix':
      return Barcode.dataMatrix();
    case 'pdf417':
      return Barcode.pdf417();
    case 'aztec':
      return Barcode.aztec();
    default:
      return Barcode.code128();
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.label,
    required this.icon,
    required this.onTap,
    this.color,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final effectiveColor = color ?? colorScheme.primary;

    return ElevatedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 18),
      style: ElevatedButton.styleFrom(
        backgroundColor: effectiveColor,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
      label: Text(
        label,
        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
      ),
    );
  }
}

class _SafetyBadge extends StatelessWidget {
  const _SafetyBadge({required this.level});

  final UrlSafetyLevel level;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    String label;
    Color color;
    switch (level) {
      case UrlSafetyLevel.safe:
        label = '안전';
        color = colorScheme.primary;
        break;
      case UrlSafetyLevel.caution:
        label = '주의';
        color = Colors.orange;
        break;
      case UrlSafetyLevel.danger:
        label = '위험';
        color = Colors.redAccent;
        break;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        '안전도: $label',
        style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }
}
