import 'package:url_launcher/url_launcher.dart';

Future<bool> launchUrlPreferApp(String url) async {
  final uri = Uri.tryParse(url);
  if (uri == null) return false;

  final host = uri.host.toLowerCase();
  if (host.contains('naver.com')) {
    final appUri = Uri.parse('naversearchapp://inappbrowser?url=${Uri.encodeComponent(uri.toString())}');
    if (await canLaunchUrl(appUri)) {
      await launchUrl(appUri, mode: LaunchMode.externalApplication);
      return true;
    }
  }

  return launchUrl(uri, mode: LaunchMode.externalApplication);
}
