import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:qr_barcode_scan/models/history_item.dart';
import 'package:qr_barcode_scan/storage/local_storage.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  int _filterIndex = 0;

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder(
      valueListenable: LocalStorage.historyBox.listenable(),
      builder: (context, box, child) {
        final items = LocalStorage.getHistory();
        final filtered = items.where((item) {
          if (_filterIndex == 1) return item.source == HistorySource.scan;
          if (_filterIndex == 2) return item.source == HistorySource.generate;
          return true;
        }).toList();

        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('기록', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Row(
                children: [
                  _FilterChip(
                    label: '전체',
                    selected: _filterIndex == 0,
                    onTap: () => setState(() => _filterIndex = 0),
                  ),
                  _FilterChip(
                    label: '스캔',
                    selected: _filterIndex == 1,
                    onTap: () => setState(() => _filterIndex = 1),
                  ),
                  _FilterChip(
                    label: '생성',
                    selected: _filterIndex == 2,
                    onTap: () => setState(() => _filterIndex = 2),
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: items.isEmpty
                        ? null
                        : () async {
                            await LocalStorage.clearHistory();
                          },
                    child: const Text('전체 삭제'),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Expanded(
                child: filtered.isEmpty
                    ? Center(
                        child: Text('기록이 없습니다.', style: Theme.of(context).textTheme.bodyMedium),
                      )
                    : ListView.separated(
                        itemCount: filtered.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final item = filtered[index];
                          return _HistoryTile(item: item);
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _HistoryTile extends StatelessWidget {
  const _HistoryTile({required this.item});

  final HistoryItem item;

  @override
  Widget build(BuildContext context) {
    final date = item.createdAt;
    return GestureDetector(
      onTap: () => _showDetail(context, item),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.15),
              child: Icon(item.icon, color: Theme.of(context).colorScheme.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.value, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Text('${item.label} · ${date.year}.${date.month}.${date.day}', style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
            IconButton(
              onPressed: () => LocalStorage.removeHistory(item.id),
              icon: const Icon(Icons.delete_outline),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showDetail(BuildContext context, HistoryItem item) async {
    await showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(item.label, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Text(item.value, style: Theme.of(context).textTheme.bodyLarge),
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                ElevatedButton.icon(
                  onPressed: () => Share.share(item.value),
                  icon: const Icon(Icons.share),
                  label: const Text('공유'),
                ),
                OutlinedButton.icon(
                  onPressed: item.type != PayloadType.url
                      ? null
                      : () async {
                          final uri = Uri.tryParse(item.value);
                          if (uri != null) {
                            await launchUrl(uri, mode: LaunchMode.externalApplication);
                          }
                        },
                  icon: const Icon(Icons.open_in_browser),
                  label: const Text('열기'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
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
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
      ),
    );
  }
}
