import 'package:flutter/material.dart';

enum QrType {
  website,
  pdf,
  vcard,
  image,
  facebook,
  instagram,
  whatsapp,
  appRedirect,
  wifi,
  video,
}

class QrTypeMeta {
  const QrTypeMeta({
    required this.type,
    required this.name,
    required this.description,
    required this.icon,
  });

  final QrType type;
  final String name;
  final String description;
  final IconData icon;
}

const List<QrTypeMeta> qrTypes = [
  QrTypeMeta(
    type: QrType.website,
    name: '웹사이트',
    description: '링크 하나로 바로 이동',
    icon: Icons.public_rounded,
  ),
  QrTypeMeta(
    type: QrType.pdf,
    name: 'PDF',
    description: '문서 링크/업로드',
    icon: Icons.picture_as_pdf,
  ),
  QrTypeMeta(
    type: QrType.vcard,
    name: 'vCard',
    description: '전자명함 공유',
    icon: Icons.badge_outlined,
  ),
  QrTypeMeta(
    type: QrType.image,
    name: '이미지',
    description: '포스터/이미지 링크',
    icon: Icons.image_outlined,
  ),
  QrTypeMeta(
    type: QrType.facebook,
    name: 'Facebook',
    description: '페이지/포스트 연결',
    icon: Icons.facebook,
  ),
  QrTypeMeta(
    type: QrType.instagram,
    name: 'Instagram',
    description: '@username 프로필',
    icon: Icons.camera_alt_outlined,
  ),
  QrTypeMeta(
    type: QrType.whatsapp,
    name: 'WhatsApp',
    description: '채팅 링크 만들기',
    icon: Icons.chat_rounded,
  ),
  QrTypeMeta(
    type: QrType.appRedirect,
    name: '앱 설치',
    description: '스토어로 연결',
    icon: Icons.apps_rounded,
  ),
  QrTypeMeta(
    type: QrType.wifi,
    name: '와이파이',
    description: 'SSID/비밀번호 공유',
    icon: Icons.wifi_rounded,
  ),
  QrTypeMeta(
    type: QrType.video,
    name: '동영상',
    description: '업로드 또는 URL',
    icon: Icons.smart_display_rounded,
  ),
];

QrTypeMeta metaOf(QrType type) => qrTypes.firstWhere((m) => m.type == type);
