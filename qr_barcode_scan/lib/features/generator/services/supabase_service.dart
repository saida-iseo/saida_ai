import 'dart:io';
import 'dart:typed_data';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:mime/mime.dart';

class SupabaseService {
  final SupabaseClient _client = Supabase.instance.client;

  /// Uploads a file to the 'qr-files' bucket and returns the public URL.
  Future<String> uploadFile(File file) async {
    final fileName = '${DateTime.now().millisecondsSinceEpoch}_${file.path.split('/').last}';
    final mimeType = lookupMimeType(file.path) ?? 'application/octet-stream';
    
    // 1. Upload the file to Supabase Storage
    await _client.storage.from('qr-files').upload(
          fileName,
          file,
          fileOptions: FileOptions(contentType: mimeType, upsert: true),
        );

    // 2. Get the public URL
    final String publicUrl = _client.storage.from('qr-files').getPublicUrl(fileName);
    
    return publicUrl;
  }

  /// Uploads raw bytes to the 'qr-files' bucket and returns the public URL.
  Future<String> uploadBytes(Uint8List bytes, String fileName) async {
    final mimeType = lookupMimeType(fileName) ?? 'application/octet-stream';
    
    // 1. Upload the bytes to Supabase Storage
    await _client.storage.from('qr-files').uploadBinary(
          fileName,
          bytes,
          fileOptions: FileOptions(contentType: mimeType, upsert: true),
        );

    // 2. Get the public URL
    final String publicUrl = _client.storage.from('qr-files').getPublicUrl(fileName);
    
    return publicUrl;
  }
}
