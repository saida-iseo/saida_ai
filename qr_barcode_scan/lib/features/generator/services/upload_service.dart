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
    final uri = _cloudinaryUriForPath(file.path);
    final mimeType = lookupMimeType(file.path) ?? 'application/octet-stream';
    final mediaType = MediaType.parse(mimeType);
    final request = http.MultipartRequest('POST', uri)
      ..fields['upload_preset'] = BackendConfig.uploadPreset
      ..files.add(
        await http.MultipartFile.fromPath(
          'file',
          file.path,
          contentType: mediaType,
        ),
      );
    if (BackendConfig.uploadFolder.isNotEmpty) {
      request.fields['folder'] = BackendConfig.uploadFolder;
    }
    return _sendRequest(request);
  }

  Future<String> uploadBytes(Uint8List bytes, String filename) async {
    final uri = _cloudinaryUriForPath(filename);
    final mimeType = lookupMimeType(filename) ?? 'application/octet-stream';
    final mediaType = MediaType.parse(mimeType);
    final request = http.MultipartRequest('POST', uri)
      ..fields['upload_preset'] = BackendConfig.uploadPreset
      ..files.add(
        http.MultipartFile.fromBytes(
          'file',
          bytes,
          filename: filename,
          contentType: mediaType,
        ),
      );
    if (BackendConfig.uploadFolder.isNotEmpty) {
      request.fields['folder'] = BackendConfig.uploadFolder;
    }
    return _sendRequest(request);
  }

  Uri _cloudinaryUriForPath(String path) {
    final type = _resourceTypeForPath(path);
    return Uri.parse(
      'https://api.cloudinary.com/v1_1/${BackendConfig.cloudName}/$type/upload',
    );
  }

  String _resourceTypeForPath(String path) {
    final lower = path.toLowerCase();
    if (lower.endsWith('.pdf')) return 'raw';
    if (lower.endsWith('.png') ||
        lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.webp') ||
        lower.endsWith('.gif') ||
        lower.endsWith('.bmp')) {
      return 'image';
    }
    return 'auto';
  }

  Future<String> _sendRequest(http.MultipartRequest request) async {
    final streamed = await _client.send(request);
    final response = await http.Response.fromStream(streamed);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      final body = response.body.trim();
      try {
        final decoded = jsonDecode(body);
        if (decoded is Map) {
          final secure = decoded['secure_url'];
          if (secure is String && secure.startsWith('http')) return secure;
          final direct = decoded['url'];
          if (direct is String && direct.startsWith('http')) return direct;
        }
      } catch (_) {
        // Ignore JSON parse errors and fall through.
      }
    }
    throw Exception('업로드에 실패했습니다. (${response.statusCode})');
  }
}
