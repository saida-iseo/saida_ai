import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:mime/mime.dart';
import 'package:http_parser/http_parser.dart';
import 'package:qr_barcode_scan/app/backend_config.dart';

class UploadService {
  UploadService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<String> uploadFile(File file) async {
    _ensureConfigured();
    final uri = Uri.parse('${BackendConfig.baseUrl}${BackendConfig.uploadEndpoint}');
    final mimeType = lookupMimeType(file.path) ?? 'application/octet-stream';
    final mediaType = MediaType.parse(mimeType);
    final request = http.MultipartRequest('POST', uri)
      ..files.add(await http.MultipartFile.fromPath('file', file.path, contentType: mediaType));
    return _sendRequest(request);
  }

  Future<String> uploadBytes(Uint8List bytes, String filename) async {
    _ensureConfigured();
    final uri = Uri.parse('${BackendConfig.baseUrl}${BackendConfig.uploadEndpoint}');
    final mimeType = lookupMimeType(filename) ?? 'application/octet-stream';
    final mediaType = MediaType.parse(mimeType);
    final request = http.MultipartRequest('POST', uri)
      ..files.add(http.MultipartFile.fromBytes('file', bytes, filename: filename, contentType: mediaType));
    return _sendRequest(request);
  }

  void _ensureConfigured() {
    if (BackendConfig.baseUrl.contains('your-backend')) {
      throw Exception('업로드 서버 주소를 설정해 주세요.');
    }
  }

  Future<String> _sendRequest(http.MultipartRequest request) async {
    final streamed = await _client.send(request);
    final response = await http.Response.fromStream(streamed);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      final body = response.body.trim();
      if (body.startsWith('http')) return body;
      try {
        final decoded = jsonDecode(body);
        if (decoded is Map) {
          final direct = decoded['url'];
          if (direct is String && direct.startsWith('http')) return direct;
          final data = decoded['data'];
          if (data is Map) {
            final nested = data['url'];
            if (nested is String && nested.startsWith('http')) return nested;
          }
        }
      } catch (_) {
        // Ignore JSON parse errors and fall through.
      }
    }
    throw Exception('업로드에 실패했습니다. (${response.statusCode})');
  }
}
