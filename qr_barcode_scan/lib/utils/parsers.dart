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

String? extractDomain(String url) {
  final uri = Uri.tryParse(url);
  if (uri == null) return null;
  if (uri.host.isNotEmpty) {
    return uri.host.replaceFirst('www.', '');
  }
  return null;
}

ParsedResult parsePayload(String value) {
  final trimmed = value.trim();

  final localImage = _parseLocalImage(trimmed);
  if (localImage != null) {
    return ParsedResult(type: PayloadType.image, raw: trimmed, data: {'path': localImage});
  }

  final localPdf = _parseLocalPdf(trimmed);
  if (localPdf != null) {
    return ParsedResult(type: PayloadType.pdf, raw: trimmed, data: {'path': localPdf, 'label': 'PDF'});
  }

  final url = _parseUrl(trimmed);
  if (url != null) {
    if (_isImageUrl(url)) {
      return ParsedResult(type: PayloadType.image, raw: trimmed, data: {'url': url, 'label': '이미지'});
    }
    if (_isPdfUrl(url)) {
      return ParsedResult(type: PayloadType.pdf, raw: trimmed, data: {'url': url, 'label': 'PDF'});
    }
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

String? _parseLocalImage(String value) {
  if (!value.startsWith('saqr:image:')) return null;
  final encoded = value.substring('saqr:image:'.length);
  if (encoded.isEmpty) return null;
  return Uri.decodeComponent(encoded);
}

String? _parseLocalPdf(String value) {
  if (!value.startsWith('saqr:pdf:')) return null;
  final encoded = value.substring('saqr:pdf:'.length);
  if (encoded.isEmpty) return null;
  return Uri.decodeComponent(encoded);
}

bool _isPdfUrl(String url) {
  final uri = Uri.tryParse(url);
  if (uri == null) return false;
  final path = uri.path.toLowerCase();
  if (path.endsWith('.pdf')) return true;
  return url.toLowerCase().contains('.pdf');
}

bool _isImageUrl(String url) {
  final uri = Uri.tryParse(url);
  if (uri == null) return false;
  final path = uri.path.toLowerCase();
  return path.endsWith('.png') ||
      path.endsWith('.jpg') ||
      path.endsWith('.jpeg') ||
      path.endsWith('.gif') ||
      path.endsWith('.webp') ||
      path.endsWith('.bmp') ||
      path.endsWith('.svg');
}

Map<String, String> _parseWifi(String value) {
  if (!value.startsWith('WIFI:')) return {};
  final cleaned = value.substring(5);
  final parts = _splitWifiParts(cleaned);
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

List<String> _splitWifiParts(String input) {
  final parts = <String>[];
  final buffer = StringBuffer();
  var escaped = false;
  for (final rune in input.runes) {
    final char = String.fromCharCode(rune);
    if (escaped) {
      buffer.write(char);
      escaped = false;
      continue;
    }
    if (char == '\\') {
      escaped = true;
      continue;
    }
    if (char == ';') {
      parts.add(buffer.toString());
      buffer.clear();
      continue;
    }
    buffer.write(char);
  }
  if (buffer.length > 0) {
    parts.add(buffer.toString());
  }
  return parts;
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
