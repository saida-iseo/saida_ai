import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:qr_barcode_scan/features/generator/models/qr_design.dart';

class QrPreviewCard extends StatelessWidget {
  const QrPreviewCard({
    super.key,
    required this.payload,
    required this.design,
  });

  final String payload;
  final QrDesign design;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final dataStyle = QrDataModuleStyle(
      dataModuleShape: _shape(design.pattern),
      color: design.foreground,
    );
    final eyeStyle = QrEyeStyle(
      eyeShape: _eye(design.pattern),
      color: design.foreground,
    );

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: scheme.outlineVariant),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Text('미리보기', style: TextStyle(fontWeight: FontWeight.w700)),
              const Spacer(),
              Text(
                payload.isEmpty ? '입력 필요' : '입력 완료됨',
                style: TextStyle(fontSize: 11, color: scheme.primary),
              ),
            ],
          ),
          const SizedBox(height: 10),
          AspectRatio(
            aspectRatio: 1,
            child: Container(
              decoration: BoxDecoration(
                color: design.background,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: scheme.outlineVariant),
              ),
              child: payload.isEmpty
                  ? Center(
                      child: Text(
                        '입력 완료 후 생성',
                        style: TextStyle(color: scheme.onSurface.withOpacity(0.55)),
                      ),
                    )
                  : QrImageView(
                      data: payload,
                      backgroundColor: design.background,
                      dataModuleStyle: dataStyle,
                      eyeStyle: eyeStyle,
                    ),
            ),
          ),
        ],
      ),
    );
  }

  QrDataModuleShape _shape(QrPattern pattern) {
    switch (pattern) {
      case QrPattern.classic:
      case QrPattern.pixel:
        return QrDataModuleShape.square;
      case QrPattern.round:
      case QrPattern.dots:
      case QrPattern.roundedCorners:
        return QrDataModuleShape.circle;
    }
  }

  QrEyeShape _eye(QrPattern pattern) {
    switch (pattern) {
      case QrPattern.classic:
      case QrPattern.pixel:
        return QrEyeShape.square;
      case QrPattern.round:
      case QrPattern.dots:
      case QrPattern.roundedCorners:
        return QrEyeShape.circle;
    }
  }
}
