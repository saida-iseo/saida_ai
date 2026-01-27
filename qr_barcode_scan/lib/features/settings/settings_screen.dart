import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
    final systemBrightness = MediaQuery.platformBrightnessOf(context);
    final effectiveTheme = settings.themeMode == AppThemeMode.system
        ? (systemBrightness == Brightness.dark
            ? AppThemeMode.dark
            : AppThemeMode.light)
        : settings.themeMode;
    final titleStyle = Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 14, fontWeight: FontWeight.w600);
    final subtitleStyle = Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 12);
    final detailSubtitleStyle = Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 10);
    const tilePadding = EdgeInsets.symmetric(horizontal: 12, vertical: 6);

    return ListView(
      padding: EdgeInsets.fromLTRB(20, 10, 20, 20 + bottomInset),
      children: [
        Text('설정', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        Padding(
          padding: tilePadding,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('테마', style: titleStyle),
              const SizedBox(height: 6),
              Text('라이트/다크 전환', style: subtitleStyle),
              const SizedBox(height: 8),
              SegmentedButton<AppThemeMode>(
                showSelectedIcon: false,
                segments: const [
                  ButtonSegment(value: AppThemeMode.light, label: Text('라이트')),
                  ButtonSegment(value: AppThemeMode.dark, label: Text('다크')),
                ],
                selected: {effectiveTheme},
                onSelectionChanged: (value) {
                  ref.read(settingsProvider.notifier).setThemeMode(value.first);
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        _SectionTitle(title: '기본 설정'),
        _SectionCard(
          children: [
            _SwitchTile(
              title: '진동',
              value: settings.vibrate,
              onChanged: (_) => ref.read(settingsProvider.notifier).toggleVibrate(),
              titleStyle: titleStyle,
              subtitleStyle: subtitleStyle,
            ),
            const _CardDivider(),
            _SwitchTile(
              title: '소리',
              value: settings.sound,
              onChanged: (_) => ref.read(settingsProvider.notifier).toggleSound(),
              titleStyle: titleStyle,
              subtitleStyle: subtitleStyle,
            ),
            const _CardDivider(),
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
              titleStyle: titleStyle,
              subtitleStyle: detailSubtitleStyle,
            ),
          ],
        ),
        _SectionTitle(title: '정보'),
        _SectionCard(
          children: [
            ListTile(
              contentPadding: tilePadding,
              dense: true,
              visualDensity: VisualDensity.compact,
              minVerticalPadding: 0,
              title: Text('언어', style: titleStyle),
              subtitle: Text('한국어', style: subtitleStyle),
            ),
            const _CardDivider(),
            ListTile(
              contentPadding: tilePadding,
              dense: true,
              visualDensity: VisualDensity.compact,
              minVerticalPadding: 0,
              title: Text('문의하기', style: titleStyle),
              trailing: const Icon(Icons.chevron_right),
              onTap: () async {
                final uri = Uri(
                  scheme: 'mailto',
                  path: 'stiseo00@gmail.com',
                  queryParameters: {
                    'subject': 'SAIDA QR SCANNER 문의',
                  },
                );
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              },
            ),
            const _CardDivider(),
            ListTile(
              contentPadding: tilePadding,
              dense: true,
              visualDensity: VisualDensity.compact,
              minVerticalPadding: 0,
              title: Text('앱 공유', style: titleStyle),
              trailing: const Icon(Icons.share),
              onTap: () => Share.share('QR-Barcode scan 앱을 공유해보세요!'),
            ),
            const _CardDivider(),
            ListTile(
              contentPadding: tilePadding,
              dense: true,
              visualDensity: VisualDensity.compact,
              minVerticalPadding: 0,
              title: Text('개인정보 보호정책', style: titleStyle),
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
            const _CardDivider(),
            ListTile(
              contentPadding: tilePadding,
              dense: true,
              visualDensity: VisualDensity.compact,
              minVerticalPadding: 0,
              title: Text('서비스 약관', style: titleStyle),
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
            const _CardDivider(),
            ListTile(
              contentPadding: tilePadding,
              dense: true,
              visualDensity: VisualDensity.compact,
              minVerticalPadding: 0,
              title: Text('앱 평가', style: titleStyle),
              trailing: const Icon(Icons.star_rate),
              onTap: () => _showPlaceholder(context),
            ),
          ],
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
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold, fontSize: 12),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: children,
      ),
    );
  }
}

class _CardDivider extends StatelessWidget {
  const _CardDivider();

  @override
  Widget build(BuildContext context) {
    return Divider(
      height: 1,
      thickness: 1,
      indent: 12,
      endIndent: 12,
      color: Theme.of(context).colorScheme.outlineVariant,
    );
  }
}

class _SwitchTile extends StatelessWidget {
  const _SwitchTile({
    required this.title,
    required this.value,
    required this.onChanged,
    this.subtitle,
    this.titleStyle,
    this.subtitleStyle,
  });

  final String title;
  final bool value;
  final ValueChanged<bool> onChanged;
  final String? subtitle;
  final TextStyle? titleStyle;
  final TextStyle? subtitleStyle;

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      dense: true,
      visualDensity: VisualDensity.compact,
      title: Text(title, style: titleStyle),
      subtitle: subtitle == null
          ? null
          : Text(
              subtitle!,
              style: subtitleStyle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
      value: value,
      onChanged: onChanged,
    );
  }
}
