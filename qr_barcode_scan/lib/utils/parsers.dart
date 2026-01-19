import 'package:qr_barcode_scan/models/history_item.dart';

class ParsedResult {
  ParsedResult({
    required this.type,
    required this.raw,
    this.data = const {},
  });

  final PayloadType type;
  final String raw;
  final Map<String, String> data;
}

ParsedResult parsePayload(String value) {
  final trimmed = value.trim();

  final url = _parseUrl(trimmed);
  if (url != null) {
    return ParsedResult(type: PayloadType.url, raw: trimmed, data: {'url': url});
  }

  final wifi = _parseWifi(trimmed);
  if (wifi.isNotEmpty) {
    return ParsedResult(type: PayloadType.wifi, raw: trimmed, data: wifi);
  }

  final email = _parseEmail(trimmed);
  if (email.isNotEmpty) {
    return ParsedResult(type: PayloadType.email, raw: trimmed, data: email);
  }

  return ParsedResult(type: PayloadType.text, raw: trimmed);
}

String? _parseUrl(String value) {
  final uri = Uri.tryParse(value);
  if (uri == null) return null;
  if (uri.hasScheme && (uri.scheme == 'http' || uri.scheme == 'https')) {
    return uri.toString();
  }
  return null;
}

Map<String, String> _parseWifi(String value) {
  if (!value.startsWith('WIFI:')) return {};
  final cleaned = value.substring(5);
  final parts = cleaned.split(';');
  final data = <String, String>{};
  for (final part in parts) {
    if (part.startsWith('S:')) {
      data['ssid'] = part.substring(2);
    } else if (part.startsWith('P:')) {
      data['password'] = part.substring(2);
    } else if (part.startsWith('T:')) {
      data['type'] = part.substring(2);
    } else if (part.startsWith('H:')) {
      data['hidden'] = part.substring(2);
    }
  }
  return data;
}

Map<String, String> _parseEmail(String value) {
  if (value.startsWith('mailto:')) {
    final uri = Uri.tryParse(value);
    if (uri == null) return {};
    return {
      'to': uri.path,
      'subject': uri.queryParameters['subject'] ?? '',
      'body': uri.queryParameters['body'] ?? '',
    };
  }
  if (value.startsWith('MATMSG:')) {
    final data = <String, String>{};
    final cleaned = value.replaceFirst('MATMSG:', '');
    final parts = cleaned.split(';');
    for (final part in parts) {
      if (part.startsWith('TO:')) {
        data['to'] = part.substring(3);
      } else if (part.startsWith('SUB:')) {
        data['subject'] = part.substring(4);
      } else if (part.startsWith('BODY:')) {
        data['body'] = part.substring(5);
      }
    }
    return data;
  }
  return {};
}
