import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:qr_barcode_scan/features/generator/models/qr_design.dart';

class QrPreviewCard extends StatelessWidget {
  const QrPreviewCard({
    super.key,
    required this.payload,
    required this.design,
    this.emptyMessage = '입력 완료 후 생성',
  });

  final String payload;
  final QrDesign design;
  final String emptyMessage;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final dataStyle = QrDataModuleStyle(
      dataModuleShape: _dataShape(design.pattern),
      color: design.foreground,
    );
    final eyeStyle = QrEyeStyle(
      eyeShape: _eyeShape(design.pattern),
      color: design.foreground,
    );
    final gapless = _gapless(design.pattern);

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
              const Text('SAIDA QR', style: TextStyle(fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 10),
          LayoutBuilder(
            builder: (context, constraints) {
              final size = math.min(constraints.maxWidth, 220.0);
              return Center(
                child: SizedBox(
                  width: size,
                  height: size,
                  child: Container(
                    decoration: BoxDecoration(
                      color: design.background,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: scheme.outlineVariant),
                    ),
                    child: payload.isEmpty
                        ? Center(
                            child: Text(
                              emptyMessage,
                              style: const TextStyle(
                                color: Colors.black87,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          )
                        : QrImageView(
                            data: payload,
                            backgroundColor: design.background,
                            dataModuleStyle: dataStyle,
                            eyeStyle: eyeStyle,
                            gapless: gapless,
                          ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  QrDataModuleShape _dataShape(QrPattern pattern) {
    switch (pattern) {
      case QrPattern.classic:
      case QrPattern.pixel:
      case QrPattern.roundedCorners:
        return QrDataModuleShape.square;
      case QrPattern.round:
      case QrPattern.dots:
        return QrDataModuleShape.circle;
    }
  }

  QrEyeShape _eyeShape(QrPattern pattern) {
    switch (pattern) {
      case QrPattern.classic:
      case QrPattern.pixel:
      case QrPattern.dots:
        return QrEyeShape.square;
      case QrPattern.round:
      case QrPattern.roundedCorners:
        return QrEyeShape.circle;
    }
  }

  bool _gapless(QrPattern pattern) {
    switch (pattern) {
      case QrPattern.pixel:
        return false;
      default:
        return true;
    }
  }
}
