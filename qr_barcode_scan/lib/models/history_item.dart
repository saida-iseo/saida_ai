import 'package:flutter/material.dart';

enum HistorySource { scan, generate }

enum PayloadType { url, text, wifi, email, unknown }

class HistoryItem {
  HistoryItem({
    required this.id,
    required this.source,
    required this.type,
    required this.value,
    required this.createdAt,
    this.meta,
  });

  final String id;
  final HistorySource source;
  final PayloadType type;
  final String value;
  final DateTime createdAt;
  final Map<String, dynamic>? meta;

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'source': source.name,
      'type': type.name,
      'value': value,
      'createdAt': createdAt.toIso8601String(),
      'meta': meta,
    };
  }

  factory HistoryItem.fromMap(Map<dynamic, dynamic> map) {
    return HistoryItem(
      id: map['id'] as String,
      source: HistorySource.values.firstWhere(
        (value) => value.name == map['source'],
        orElse: () => HistorySource.scan,
      ),
      type: PayloadType.values.firstWhere(
        (value) => value.name == map['type'],
        orElse: () => PayloadType.unknown,
      ),
      value: map['value'] as String,
      createdAt: DateTime.tryParse(map['createdAt'] as String? ?? '') ?? DateTime.now(),
      meta: (map['meta'] as Map?)?.cast<String, dynamic>(),
    );
  }

  IconData get icon {
    switch (type) {
      case PayloadType.url:
        return Icons.link;
      case PayloadType.wifi:
        return Icons.wifi;
      case PayloadType.email:
        return Icons.email;
      case PayloadType.text:
        return Icons.text_snippet;
      case PayloadType.unknown:
        return Icons.qr_code_rounded;
    }
  }

  String get label {
    switch (type) {
      case PayloadType.url:
        return 'URL';
      case PayloadType.wifi:
        return 'Wi-Fi';
      case PayloadType.email:
        return 'EMAIL';
      case PayloadType.text:
        return 'TEXT';
      case PayloadType.unknown:
        return 'UNKNOWN';
    }
  }
}
