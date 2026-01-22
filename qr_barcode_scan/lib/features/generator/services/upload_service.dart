import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:mime/mime.dart';
import 'package:http_parser/http_parser.dart';
import 'package:qr_barcode_scan/app/backend_config.dart';

class UploadService {
  UploadService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<String> uploadFile(File file) async {
    final uri = Uri.parse('${BackendConfig.baseUrl}${BackendConfig.uploadEndpoint}');
    final mimeType = lookupMimeType(file.path) ?? 'application/octet-stream';
    final mediaType = MediaType.parse(mimeType);
    final request = http.MultipartRequest('POST', uri)
      ..files.add(await http.MultipartFile.fromPath('file', file.path, contentType: mediaType));
    final streamed = await _client.send(request);
    final response = await http.Response.fromStream(streamed);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      final url = response.body.trim();
      if (url.startsWith('http')) return url;
    }
    throw Exception('업로드에 실패했습니다. (${response.statusCode})');
  }
}
