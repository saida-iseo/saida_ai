import 'package:flutter/material.dart';
import 'package:qr_barcode_scan/features/generator/models/qr_type.dart';
import 'package:qr_barcode_scan/features/generator/qr_form_screen.dart';

class GeneratorScreen extends StatelessWidget {
  const GeneratorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const spacing = 12.0;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'QR 생성',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    const crossAxisCount = 3;
                    const childAspectRatio = 0.82; // 약간 더 여유 있는 높이
                    return GridView.count(
                      crossAxisCount: crossAxisCount,
                      physics: const BouncingScrollPhysics(),
                      mainAxisSpacing: spacing,
                      crossAxisSpacing: spacing,
                      childAspectRatio: childAspectRatio,
                      children: qrTypes
                          .map(
                            (meta) => _InlineQrTypeCard(
                              meta: meta,
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => QrFormScreen(type: meta.type)),
                              ),
                            ),
                          )
                          .toList(),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InlineQrTypeCard extends StatelessWidget {
  const _InlineQrTypeCard({required this.meta, required this.onTap});

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
          color: scheme.surfaceVariant.withOpacity(0.7),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: scheme.outlineVariant),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 9),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: scheme.primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(meta.icon, color: scheme.primary, size: 24),
            ),
            const SizedBox(height: 6),
            SizedBox(
              height: 18,
              child: Center(
                child: Text(
                  meta.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
            const SizedBox(height: 3),
            SizedBox(
              height: 22,
              child: Center(
                child: Text(
                  meta.description,
                  maxLines: 2,
                  softWrap: true,
                  textAlign: TextAlign.center,
                  overflow: TextOverflow.clip,
                  style: TextStyle(fontSize: 8, color: scheme.onSurface.withOpacity(0.65)),
                ),
              ),
            ),
            const Spacer(),
          ],
        ),
      ),
    );
  }
}
