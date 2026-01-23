import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:qr_barcode_scan/models/history_item.dart';
import 'package:qr_barcode_scan/storage/local_storage.dart';
import 'package:qr_barcode_scan/ui/widgets/result_sheet.dart';
import 'package:qr_barcode_scan/utils/link_handler.dart';
import 'package:qr_barcode_scan/utils/parsers.dart';
import 'package:qr_barcode_scan/utils/url_safety.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  int _filterIndex = 0;
  bool _selectMode = false;
  final Set<String> _selectedIds = {};

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder(
      valueListenable: LocalStorage.historyBox.listenable(),
      builder: (context, box, child) {
        final items = LocalStorage.getHistory();
        final filtered = items.where((item) {
          if (_filterIndex == 1) return item.isFavorite;
          if (_filterIndex == 2) return item.source == HistorySource.scan;
          if (_filterIndex == 3) return item.source == HistorySource.generate;
          return true;
        }).toList();

        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    '기록',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      fontSize: 20,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                  const Spacer(),
                  if (!_selectMode) ...[
                    OutlinedButton(
                      onPressed: items.isEmpty ? null : _enterSelectMode,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Theme.of(context).colorScheme.primary,
                        side: BorderSide(
                          color: Theme.of(
                            context,
                          ).colorScheme.primary.withOpacity(0.5),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('선택 삭제'),
                    ),
                    const SizedBox(width: 8),
                    OutlinedButton(
                      onPressed: items.isEmpty
                          ? null
                          : () => _confirmClear(context, items),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Theme.of(context).colorScheme.primary,
                        side: BorderSide(
                          color: Theme.of(
                            context,
                          ).colorScheme.primary.withOpacity(0.5),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('전체 삭제'),
                    ),
                  ] else ...[
                    TextButton(
                      onPressed: _exitSelectMode,
                      child: const Text('취소'),
                    ),
                    const SizedBox(width: 6),
                    ElevatedButton(
                      onPressed: _selectedIds.isEmpty
                          ? null
                          : () => _confirmDeleteSelected(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Theme.of(context).colorScheme.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text('삭제 (${_selectedIds.length})'),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  _FilterChip(
                    label: '전체',
                    selected: _filterIndex == 0,
                    onTap: () => setState(() => _filterIndex = 0),
                  ),
                  _FilterChip(
                    label: '즐겨찾기',
                    selected: _filterIndex == 1,
                    onTap: () => setState(() => _filterIndex = 1),
                  ),
                  _FilterChip(
                    label: '스캔',
                    selected: _filterIndex == 2,
                    onTap: () => setState(() => _filterIndex = 2),
                  ),
                  _FilterChip(
                    label: '생성',
                    selected: _filterIndex == 3,
                    onTap: () => setState(() => _filterIndex = 3),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Expanded(
                child: filtered.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '기록이 없습니다.',
                              style: Theme.of(context).textTheme.bodyMedium
                                  ?.copyWith(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: Theme.of(
                                      context,
                                    ).colorScheme.onSurface,
                                  ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '최근 항목을 눌러 복사/열기 가능합니다.',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(
                                    fontSize: 12,
                                    color: Theme.of(
                                      context,
                                    ).colorScheme.onSurface.withOpacity(0.7),
                                  ),
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        itemCount: filtered.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final item = filtered[index];
                          return _HistoryTile(
                            item: item,
                            selectionMode: _selectMode,
                            selected: _selectedIds.contains(item.id),
                            onTap: _selectMode
                                ? () => _toggleSelected(item)
                                : null,
                            onLongPress: _selectMode
                                ? null
                                : () => _enterSelectMode(selectItem: item),
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _confirmClear(
    BuildContext context,
    List<HistoryItem> items,
  ) async {
    final messenger = ScaffoldMessenger.of(context);
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('전체 삭제'),
        content: const Text('모든 기록을 삭제할까요? 되돌릴 수 없습니다.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('취소'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('삭제'),
          ),
        ],
      ),
    );
    if (result != true) return;
    await LocalStorage.clearHistory();
    if (!context.mounted) return;
    messenger.showSnackBar(
      SnackBar(
        content: const Text('기록을 삭제했습니다.'),
        action: SnackBarAction(
          label: '되돌리기',
          onPressed: () async {
            for (final item in items) {
              await LocalStorage.addHistory(item);
            }
          },
        ),
      ),
    );
  }

  void _enterSelectMode({HistoryItem? selectItem}) {
    setState(() {
      _selectMode = true;
      _selectedIds.clear();
      if (selectItem != null) {
        _selectedIds.add(selectItem.id);
      }
    });
  }

  void _exitSelectMode() {
    setState(() {
      _selectMode = false;
      _selectedIds.clear();
    });
  }

  void _toggleSelected(HistoryItem item) {
    setState(() {
      if (_selectedIds.contains(item.id)) {
        _selectedIds.remove(item.id);
      } else {
        _selectedIds.add(item.id);
      }
    });
  }

  Future<void> _confirmDeleteSelected(BuildContext context) async {
    if (_selectedIds.isEmpty) return;
    final messenger = ScaffoldMessenger.of(context);
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('선택 삭제'),
        content: Text('선택한 기록 ${_selectedIds.length}개를 삭제할까요?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('취소'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('삭제'),
          ),
        ],
      ),
    );
    if (result != true) return;
    final ids = List<String>.from(_selectedIds);
    for (final id in ids) {
      await LocalStorage.removeHistory(id);
    }
    if (!context.mounted) return;
    messenger.showSnackBar(
      SnackBar(content: Text('${ids.length}개 기록을 삭제했습니다.')),
    );
    _exitSelectMode();
  }
}

class _HistoryTile extends StatelessWidget {
  const _HistoryTile({
    required this.item,
    this.selectionMode = false,
    this.selected = false,
    this.onTap,
    this.onLongPress,
  });

  final HistoryItem item;
  final bool selectionMode;
  final bool selected;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  @override
  Widget build(BuildContext context) {
    final date = item.createdAt;
    final colorScheme = Theme.of(context).colorScheme;
    final info = _buildInfo(item);
    return GestureDetector(
      onTap: onTap ?? () => _showDetail(context, item),
      onLongPress: onLongPress,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected
              ? colorScheme.primary.withOpacity(0.08)
              : Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: selected
                ? colorScheme.primary.withOpacity(0.6)
                : Theme.of(context).colorScheme.outlineVariant,
          ),
        ),
        child: Row(
          children: [
            _HistoryThumb(item: item),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          info.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                            color: colorScheme.onSurface,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: colorScheme.primary.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          item.label,
                          style: TextStyle(
                            color: colorScheme.primary,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    info.subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontSize: 12,
                      color: colorScheme.onSurface.withOpacity(0.7),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${date.year}.${date.month}.${date.day} · ${item.source == HistorySource.scan ? '스캔' : '생성'}',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      fontSize: 11,
                      color: colorScheme.onSurface.withOpacity(0.55),
                    ),
                  ),
                ],
              ),
            ),
            if (selectionMode)
              Icon(
                selected ? Icons.check_circle : Icons.radio_button_unchecked,
                color: selected
                    ? colorScheme.primary
                    : colorScheme.onSurface.withOpacity(0.4),
              )
            else ...[
              IconButton(
                onPressed: () => _toggleFavorite(context, item),
                icon: Icon(
                  item.isFavorite
                      ? Icons.star_rounded
                      : Icons.star_border_rounded,
                ),
                color: item.isFavorite
                    ? Colors.amber
                    : colorScheme.onSurface.withOpacity(0.6),
                tooltip: item.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가',
              ),
              PopupMenuButton<_HistoryAction>(
                onSelected: (action) => _handleAction(context, item, action),
                icon: const Icon(Icons.more_horiz),
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: _HistoryAction.copy,
                    child: Text('복사'),
                  ),
                  if (_canOpenUrl(item))
                    const PopupMenuItem(
                      value: _HistoryAction.open,
                      child: Text('열기'),
                    ),
                  const PopupMenuItem(
                    value: _HistoryAction.share,
                    child: Text('공유'),
                  ),
                  const PopupMenuDivider(),
                  const PopupMenuItem(
                    value: _HistoryAction.delete,
                    child: Text('삭제'),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _toggleFavorite(BuildContext context, HistoryItem item) async {
    final updated = item.copyWith(isFavorite: !item.isFavorite);
    await LocalStorage.addHistory(updated);
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(updated.isFavorite ? '즐겨찾기에 추가했습니다.' : '즐겨찾기를 해제했습니다.'),
      ),
    );
  }

  Future<void> _showDetail(BuildContext context, HistoryItem item) async {
    final parsed = item.type == PayloadType.barcode
        ? ParsedResult(
            type: PayloadType.barcode,
            raw: item.value,
            data: {
              if (item.meta?['format'] != null)
                'format': item.meta?['format'].toString() ?? '',
              if (item.meta?['formatLabel'] != null)
                'formatLabel': item.meta?['formatLabel'].toString() ?? '',
            },
          )
        : item.type == PayloadType.pdf ||
              item.type == PayloadType.image ||
              item.type == PayloadType.video ||
              item.type == PayloadType.social ||
              item.type == PayloadType.playlist ||
              item.type == PayloadType.vcard
        ? ParsedResult(
            type: item.type,
            raw: item.value,
            data: {
              if (item.meta?['url'] != null)
                'url': item.meta?['url'].toString() ?? '',
              if (item.meta?['label'] != null)
                'label': item.meta?['label'].toString() ?? '',
              if (item.meta?['name'] != null)
                'name': item.meta?['name'].toString() ?? '',
              if (item.meta?['org'] != null)
                'org': item.meta?['org'].toString() ?? '',
              if (item.meta?['phone'] != null)
                'phone': item.meta?['phone'].toString() ?? '',
              if (item.meta?['email'] != null)
                'email': item.meta?['email'].toString() ?? '',
            },
          )
        : parsePayload(item.value);
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ResultSheet(
        result: parsed,
        onOpenUrl: () async {
          await _openUrlWithSafety(context, parsed.data['url'] ?? parsed.raw);
          if (context.mounted) Navigator.pop(context);
        },
      ),
    );
  }

  _HistoryInfo _buildInfo(HistoryItem item) {
    switch (item.type) {
      case PayloadType.url:
        final url = item.meta?['url'] ?? item.value;
        final domain = extractDomain(url) ?? url;
        return _HistoryInfo(title: domain, subtitle: url);
      case PayloadType.wifi:
        final ssid = item.meta?['ssid'] ?? '와이파이';
        return _HistoryInfo(title: ssid, subtitle: '와이파이 연결 정보');
      case PayloadType.email:
        final to = item.meta?['to'] ?? '이메일';
        final subject = item.meta?['subject'];
        return _HistoryInfo(
          title: to,
          subtitle: subject?.isNotEmpty == true ? subject : '이메일 QR',
        );
      case PayloadType.text:
        return _HistoryInfo(title: item.value, subtitle: '텍스트');
      case PayloadType.pdf:
      case PayloadType.image:
      case PayloadType.video:
      case PayloadType.social:
      case PayloadType.playlist:
        final label = item.meta?['label'] ?? item.label;
        final url = item.meta?['url'] ?? item.value;
        return _HistoryInfo(title: label.toString(), subtitle: url.toString());
      case PayloadType.vcard:
        final name = item.meta?['name'] ?? 'Vcard Plus';
        final org = item.meta?['org'] ?? '';
        return _HistoryInfo(
          title: name.toString(),
          subtitle: org.toString().isEmpty ? '디지털 명함' : org.toString(),
        );
      case PayloadType.barcode:
        final format =
            item.meta?['formatLabel'] ?? item.meta?['format'] ?? '바코드';
        return _HistoryInfo(title: item.value, subtitle: format.toString());
      case PayloadType.unknown:
        return _HistoryInfo(title: item.value, subtitle: '알 수 없는 형식');
    }
  }

  Future<void> _handleAction(
    BuildContext context,
    HistoryItem item,
    _HistoryAction action,
  ) async {
    switch (action) {
      case _HistoryAction.copy:
        await Clipboard.setData(ClipboardData(text: item.value));
        if (!context.mounted) return;
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('복사했습니다.')));
        break;
      case _HistoryAction.open:
        await _openUrlWithSafety(context, _extractUrl(item));
        break;
      case _HistoryAction.share:
        await Share.share(item.value);
        break;
      case _HistoryAction.delete:
        await LocalStorage.removeHistory(item.id);
        if (!context.mounted) return;
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('삭제했습니다.')));
        break;
    }
  }
}

bool _canOpenUrl(HistoryItem item) {
  return item.type == PayloadType.url ||
      item.type == PayloadType.pdf ||
      item.type == PayloadType.image ||
      item.type == PayloadType.video ||
      item.type == PayloadType.social ||
      item.type == PayloadType.playlist;
}

String _extractUrl(HistoryItem item) {
  return item.meta?['url']?.toString() ?? item.value;
}

Future<void> _openUrlWithSafety(BuildContext context, String url) async {
  final uri = Uri.tryParse(url);
  if (uri == null || !(uri.scheme == 'http' || uri.scheme == 'https')) {
    if (context.mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('지원하지 않는 링크 형식입니다.')));
    }
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
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('취소'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('열기'),
          ),
        ],
      ),
    );
    if (proceed != true) return;
  }
  await launchUrlPreferApp(url);
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
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
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: selected
                ? colorScheme.primary.withOpacity(0.16)
                : colorScheme.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected
                  ? colorScheme.primary
                  : colorScheme.outlineVariant,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: selected
                  ? colorScheme.primary
                  : colorScheme.onSurface.withOpacity(0.75),
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }
}

class _HistoryThumb extends StatelessWidget {
  const _HistoryThumb({required this.item});

  final HistoryItem item;

  @override
  Widget build(BuildContext context) {
    final imagePath = item.meta?['imagePath'] as String?;
    final colorScheme = Theme.of(context).colorScheme;
    final size = 52.0;

    if (imagePath != null && File(imagePath).existsSync()) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Image.file(
          File(imagePath),
          width: size,
          height: size,
          fit: BoxFit.cover,
        ),
      );
    }

    return Container(
      width: size,
      height: size,
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: QrImageView(
        data: item.value,
        gapless: false,
        foregroundColor: colorScheme.onSurface,
      ),
    );
  }
}

class _HistoryInfo {
  const _HistoryInfo({required this.title, required this.subtitle});

  final String title;
  final String subtitle;
}

enum _HistoryAction { copy, open, share, delete }
