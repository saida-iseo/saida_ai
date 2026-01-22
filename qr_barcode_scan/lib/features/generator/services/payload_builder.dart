import 'package:qr_barcode_scan/app/backend_config.dart';
import 'package:qr_barcode_scan/features/generator/models/qr_type.dart';

class PayloadBuildResult {
  const PayloadBuildResult({
    required this.payload,
    required this.displayMeta,
  });

  final String payload;
  final Map<String, dynamic> displayMeta;
}

class QrPayloadBuilder {
  static PayloadBuildResult? build(QrType type, Map<String, dynamic> data) {
    switch (type) {
      case QrType.website:
        final url = data['url'] as String? ?? '';
        if (url.isEmpty) return null;
        return PayloadBuildResult(payload: url, displayMeta: {'label': '웹사이트', 'url': url});
      case QrType.pdf:
        final url = data['url'] as String? ?? '';
        if (url.isEmpty) return null;
        return PayloadBuildResult(payload: url, displayMeta: {'label': 'PDF', 'url': url});
      case QrType.image:
        final url = data['url'] as String? ?? '';
        if (url.isEmpty) return null;
        return PayloadBuildResult(payload: url, displayMeta: {'label': '이미지', 'url': url});
      case QrType.video:
        final url = data['url'] as String? ?? '';
        if (url.isEmpty) return null;
        return PayloadBuildResult(payload: url, displayMeta: {'label': '동영상', 'url': url});
      case QrType.vcard:
        final name = data['name'] as String? ?? '';
        final phone = data['phone'] as String? ?? '';
        if (name.isEmpty || phone.isEmpty) return null;
        final org = data['org'] as String? ?? '';
        final title = data['title'] as String? ?? '';
        final email = data['email'] as String? ?? '';
        final website = data['website'] as String? ?? '';
        final address = data['address'] as String? ?? '';
        final buffer = StringBuffer('BEGIN:VCARD\nVERSION:3.0\n');
        buffer.writeln('N:$name;;;;');
        buffer.writeln('FN:$name');
        if (org.isNotEmpty) buffer.writeln('ORG:$org');
        if (title.isNotEmpty) buffer.writeln('TITLE:$title');
        if (phone.isNotEmpty) buffer.writeln('TEL;TYPE=CELL:$phone');
        if (email.isNotEmpty) buffer.writeln('EMAIL:$email');
        if (website.isNotEmpty) buffer.writeln('URL:$website');
        if (address.isNotEmpty) buffer.writeln('ADR;TYPE=WORK:;;$address;;;;');
        buffer.write('END:VCARD');
        return PayloadBuildResult(
          payload: buffer.toString(),
          displayMeta: {'label': 'vCard', 'name': name, 'phone': phone},
        );
      case QrType.facebook:
        final url = data['url'] as String? ?? '';
        final title = data['title'] as String? ?? '';
        if (url.isEmpty || title.isEmpty) return null;
        final description = data['description'] as String? ?? '';
        return PayloadBuildResult(
          payload: url,
          displayMeta: {'label': 'Facebook', 'title': title, 'description': description, 'url': url},
        );
      case QrType.instagram:
        final username = (data['username'] as String? ?? '').replaceAll('@', '').trim();
        if (username.isEmpty) return null;
        final url = 'https://www.instagram.com/$username/';
        return PayloadBuildResult(
          payload: url,
          displayMeta: {'label': 'Instagram', 'username': username, 'url': url},
        );
      case QrType.whatsapp:
        final phone = (data['phone'] as String? ?? '').replaceAll(' ', '');
        if (phone.length < 6) return null;
        final url = 'https://wa.me/$phone';
        return PayloadBuildResult(payload: url, displayMeta: {'label': 'WhatsApp', 'phone': phone});
      case QrType.appRedirect:
        final name = data['name'] as String? ?? '';
        final androidUrl = data['androidUrl'] as String? ?? '';
        final iosUrl = data['iosUrl'] as String? ?? '';
        if (name.isEmpty || (androidUrl.isEmpty && iosUrl.isEmpty)) return null;
        if (androidUrl.isNotEmpty && iosUrl.isNotEmpty) {
          final uri = Uri.parse(BackendConfig.baseUrl).replace(
            path: BackendConfig.appLandingPath,
            queryParameters: {
              'name': name,
              'androidUrl': androidUrl,
              'iosUrl': iosUrl,
              if ((data['description'] as String? ?? '').isNotEmpty) 'description': data['description'] as String,
            },
          );
          return PayloadBuildResult(
            payload: uri.toString(),
            displayMeta: {'label': '앱 설치', 'name': name, 'url': uri.toString()},
          );
        }
        final chosen = androidUrl.isNotEmpty ? androidUrl : iosUrl;
        return PayloadBuildResult(
          payload: chosen,
          displayMeta: {'label': '앱 설치', 'name': name, 'url': chosen},
        );
      case QrType.wifi:
        final ssid = data['ssid'] as String? ?? '';
        final security = data['security'] as String? ?? 'WPA';
        final password = data['password'] as String? ?? '';
        final hidden = data['hidden'] as bool? ?? false;
        if (ssid.isEmpty) return null;
        if (security != 'nopass' && password.isEmpty) return null;
        final buffer = StringBuffer('WIFI:T:$security;S:$ssid;');
        if (security != 'nopass') buffer.write('P:$password;');
        if (hidden) buffer.write('H:true;');
        buffer.write(';');
        return PayloadBuildResult(
          payload: buffer.toString(),
          displayMeta: {'label': '와이파이', 'ssid': ssid},
        );
    }
  }
}
