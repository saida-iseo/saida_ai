import 'package:flutter/material.dart';
import 'package:qr_barcode_scan/features/generator/models/qr_type.dart';

typedef QrTypeSelected = void Function(QrType type);

Future<void> showQrTypePicker(BuildContext context, QrTypeSelected onSelected) {
  final spacing = 12.0;
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) {
      final colorScheme = Theme.of(context).colorScheme;
      return SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Container(
            decoration: BoxDecoration(
              color: colorScheme.surface,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: colorScheme.outlineVariant),
            ),
            child: SizedBox(
              height: MediaQuery.of(context).size.height * 0.75,
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 14, 8, 4),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            'QR 유형 선택',
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.w700),
                          ),
                        ),
                        IconButton(
                          tooltip: '닫기',
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(Icons.close_rounded),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          final crossAxisCount = 3;
                          final cardWidth =
                              (constraints.maxWidth -
                                  spacing * (crossAxisCount - 1)) /
                              crossAxisCount;
                          return GridView.count(
                            crossAxisCount: crossAxisCount,
                            physics: const BouncingScrollPhysics(),
                            mainAxisSpacing: spacing,
                            crossAxisSpacing: spacing,
                            childAspectRatio: cardWidth / (cardWidth + 26),
                            children: qrTypes
                                .map(
                                  (meta) => _QrTypeCard(
                                    meta: meta,
                                    onTap: () {
                                      Navigator.pop(context);
                                      onSelected(meta.type);
                                    },
                                  ),
                                )
                                .toList(),
                          );
                        },
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    },
  );
}

class _QrTypeCard extends StatelessWidget {
  const _QrTypeCard({required this.meta, required this.onTap});

  final QrTypeMeta meta;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Ink(
        decoration: BoxDecoration(
          color: scheme.surfaceContainerHighest.withOpacity(0.7),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: scheme.outlineVariant),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: scheme.primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(meta.icon, color: scheme.primary, size: 26),
            ),
            const SizedBox(height: 8),
            Text(
              meta.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
            ),
            const SizedBox(height: 4),
            Text(
              meta.description,
              maxLines: 2,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 11,
                color: scheme.onSurface.withOpacity(0.65),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
