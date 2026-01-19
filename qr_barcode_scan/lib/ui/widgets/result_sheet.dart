import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_barcode_scan/models/history_item.dart';
import 'package:qr_barcode_scan/utils/parsers.dart';
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

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
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
        return Text(result.data['url'] ?? result.raw, style: textTheme.titleMedium);
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
            SnackBar(content: Text('클립보드에 복사했습니다.')),
          );
        },
      ),
      _ActionButton(
        label: '공유',
        icon: Icons.share,
        onTap: () => Share.share(result.raw),
      ),
    ];

    if (result.type == PayloadType.url) {
      actions.insert(
        0,
        _ActionButton(
          label: '열기',
          icon: Icons.open_in_browser,
          color: colorScheme.primary,
          onTap: onOpenUrl,
        ),
      );
    }

    if (result.type == PayloadType.email && result.data['to'] != null) {
      actions.insert(
        0,
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
