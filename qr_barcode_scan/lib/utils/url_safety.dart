import 'dart:core';

enum UrlSafetyLevel { safe, caution, danger }

class UrlSafetyResult {
  const UrlSafetyResult({
    required this.level,
    required this.reasons,
  });

  final UrlSafetyLevel level;
  final List<String> reasons;

  bool get requiresConfirm => level != UrlSafetyLevel.safe;
}

UrlSafetyResult evaluateUrlSafety(String url) {
  final reasons = <String>[];
  final uri = Uri.tryParse(url);
  if (uri == null || uri.host.isEmpty) {
    return const UrlSafetyResult(
      level: UrlSafetyLevel.danger,
      reasons: ['정상적인 URL 형식이 아닙니다.'],
    );
  }

  if (uri.scheme != 'https') {
    reasons.add('보안 연결(https)이 아닙니다.');
  }

  final host = uri.host.toLowerCase();
  if (RegExp(r'^(?:\d{1,3}\.){3}\d{1,3}$').hasMatch(host)) {
    reasons.add('도메인이 IP 주소입니다.');
  }

  if (host.contains('xn--')) {
    reasons.add('국제 도메인(퓨니코드)입니다.');
  }

  if (uri.toString().length > 120) {
    reasons.add('URL 길이가 매우 깁니다.');
  }

  const riskyTlds = ['zip', 'xyz', 'top', 'gq', 'tk', 'ml', 'cf', 'ga'];
  final tld = host.split('.').last;
  if (riskyTlds.contains(tld)) {
    reasons.add('주의가 필요한 최상위 도메인입니다.');
  }

  if (reasons.isEmpty) {
    return const UrlSafetyResult(level: UrlSafetyLevel.safe, reasons: []);
  }

  final level = reasons.length >= 3 ? UrlSafetyLevel.danger : UrlSafetyLevel.caution;
  return UrlSafetyResult(level: level, reasons: reasons);
}
