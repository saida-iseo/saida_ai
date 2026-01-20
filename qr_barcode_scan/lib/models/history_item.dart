import 'package:flutter/material.dart';

enum HistorySource { scan, generate }

enum PayloadType { url, text, pdf, image, video, social, playlist, vcard, wifi, email, barcode, unknown }

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
      case PayloadType.pdf:
        return Icons.picture_as_pdf;
      case PayloadType.image:
        return Icons.image;
      case PayloadType.video:
        return Icons.smart_display;
      case PayloadType.social:
        return Icons.people_alt;
      case PayloadType.playlist:
        return Icons.playlist_play;
      case PayloadType.vcard:
        return Icons.badge;
      case PayloadType.barcode:
        return Icons.view_week;
      case PayloadType.unknown:
        return Icons.qr_code_rounded;
    }
  }

  String get label {
    switch (type) {
      case PayloadType.url:
        return 'URL';
      case PayloadType.wifi:
        return '와이파이';
      case PayloadType.email:
        return '이메일';
      case PayloadType.text:
        return '텍스트';
      case PayloadType.pdf:
        return 'PDF';
      case PayloadType.image:
        return '이미지';
      case PayloadType.video:
        return '비디오';
      case PayloadType.social:
        return '소셜';
      case PayloadType.playlist:
        return '재생목록';
      case PayloadType.vcard:
        return 'Vcard Plus';
      case PayloadType.barcode:
        return '바코드';
      case PayloadType.unknown:
        return '알 수 없음';
    }
  }
}
