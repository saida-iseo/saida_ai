import 'package:flutter/material.dart';

enum QrPattern { classic, round, dots, roundedCorners, pixel }

class QrDesign {
  QrDesign({
    required this.foreground,
    required this.background,
    required this.pattern,
  });

  final Color foreground;
  final Color background;
  final QrPattern pattern;

  QrDesign copyWith({
    Color? foreground,
    Color? background,
    QrPattern? pattern,
  }) {
    return QrDesign(
      foreground: foreground ?? this.foreground,
      background: background ?? this.background,
      pattern: pattern ?? this.pattern,
    );
  }
}

const List<Color> kPresetColors = [
  Color(0xFF000000),
  Color(0xFFEF4444),
  Color(0xFFF97316),
  Color(0xFFFACC15),
  Color(0xFF22C55E),
  Color(0xFF3B82F6),
  Color(0xFF0EA5E9),
  Color(0xFFA855F7),
  Color(0xFFFFFFFF),
];
