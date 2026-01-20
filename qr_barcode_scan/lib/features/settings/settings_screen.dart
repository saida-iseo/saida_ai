import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:qr_barcode_scan/features/settings/legal_screen.dart';
import 'package:qr_barcode_scan/storage/local_storage.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);
    final bottomInset = MediaQuery.of(context).padding.bottom;

    return ListView(
      padding: EdgeInsets.fromLTRB(20, 12, 20, 24 + bottomInset),
      children: [
        Text('설정', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        _SectionTitle(title: '기본 설정'),
        _SwitchTile(
          title: '진동',
          value: settings.vibrate,
          onChanged: (_) => ref.read(settingsProvider.notifier).toggleVibrate(),
        ),
        _SwitchTile(
          title: '소리',
          value: settings.sound,
          onChanged: (_) => ref.read(settingsProvider.notifier).toggleSound(),
        ),
        _SwitchTile(
          title: '자동 초점',
          value: settings.autoFocus,
          onChanged: (_) => ref.read(settingsProvider.notifier).toggleAutoFocus(),
          subtitle: settings.autoFocus ? '현재 상태: 사용 중' : '현재 상태: 사용 안 함',
        ),
        _SwitchTile(
          title: 'URL 자동 열기',
          value: settings.autoOpenUrl,
          onChanged: (value) async {
            if (!value) {
              await ref.read(settingsProvider.notifier).toggleAutoOpenUrl();
              return;
            }
            final approved = await showDialog<bool>(
              context: context,
              builder: (context) => AlertDialog(
                title: const Text('URL 자동 열기'),
                content: const Text('링크를 자동으로 열면 피싱 위험이 있습니다. 항상 열기를 켤까요?'),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('취소')),
                  TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('항상 열기')),
                ],
              ),
            );
            if (approved == true) {
              await ref.read(settingsProvider.notifier).toggleAutoOpenUrl();
            }
          },
          subtitle: '기본 OFF · 필요할 때만 직접 열기를 권장합니다.',
        ),
        const SizedBox(height: 12),
        _SectionTitle(title: '권한'),
        ListTile(
          title: const Text('알림 권한 요청'),
          subtitle: const Text('탭하여 권한을 요청합니다.'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () async {
            await Permission.notification.request();
            if (!context.mounted) return;
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('알림 권한 요청을 완료했습니다.')),
            );
          },
        ),
        const SizedBox(height: 12),
        _SectionTitle(title: '정보'),
        ListTile(
          title: const Text('언어'),
          subtitle: const Text('한국어'),
        ),
        ListTile(
          title: const Text('문의하기'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () async {
            final uri = Uri(
              scheme: 'mailto',
              path: 'support@saida.ai',
              queryParameters: {
                'subject': 'SAIDA QR SCANNER 문의',
              },
            );
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          },
        ),
        ListTile(
          title: const Text('앱 공유'),
          trailing: const Icon(Icons.share),
          onTap: () => Share.share('QR-Barcode scan 앱을 공유해보세요!'),
        ),
        ListTile(
          title: const Text('개인정보 보호정책'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => const LegalScreen(
                title: '개인정보 보호정책',
                assetPath: 'assets/legal/privacy_ko.txt',
              ),
            ),
          ),
        ),
        ListTile(
          title: const Text('서비스 약관'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => const LegalScreen(
                title: '서비스 약관',
                assetPath: 'assets/legal/terms_ko.txt',
              ),
            ),
          ),
        ),
        ListTile(
          title: const Text('앱 평가'),
          trailing: const Icon(Icons.star_rate),
          onTap: () => _showPlaceholder(context),
        ),
      ],
    );
  }

  void _showPlaceholder(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('곧 제공될 예정입니다.')),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Text(title, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
    );
  }
}

class _SwitchTile extends StatelessWidget {
  const _SwitchTile({
    required this.title,
    required this.value,
    required this.onChanged,
    this.subtitle,
  });

  final String title;
  final bool value;
  final ValueChanged<bool> onChanged;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      title: Text(title),
      subtitle: subtitle == null ? null : Text(subtitle!),
      value: value,
      onChanged: onChanged,
    );
  }
}
