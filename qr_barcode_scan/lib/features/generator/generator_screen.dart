import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:qr_barcode_scan/models/history_item.dart';
import 'package:qr_barcode_scan/storage/local_storage.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:image_gallery_saver/image_gallery_saver.dart';
import 'package:permission_handler/permission_handler.dart';

enum GeneratorType { url, text, pdf, image, vcard, video, social, playlist, wifi, email }

class GeneratorScreen extends ConsumerStatefulWidget {
  const GeneratorScreen({super.key});

  @override
  ConsumerState<GeneratorScreen> createState() => _GeneratorScreenState();
}

class _GeneratorScreenState extends ConsumerState<GeneratorScreen> {
  final GlobalKey _qrKey = GlobalKey();
  GeneratorType _type = GeneratorType.url;
  String _payload = '';
  QrDataModuleShape _moduleShape = QrDataModuleShape.square;
  QrEyeShape _eyeShape = QrEyeShape.square;
  Color _qrForegroundColor = Colors.black;
  Color _qrBackgroundColor = Colors.white;
  bool _useGradient = false;
  int _errorCorrection = QrErrorCorrectLevel.M;
  late final PageController _typeController;
  double _typePage = 0;
  final List<_GeneratorCategory> _categories = [
    _GeneratorCategory(
      type: GeneratorType.url,
      label: '웹페이지',
      description: '링크 하나로 브랜드 페이지, 이벤트, 예약 페이지를 공유하세요.',
      icon: Icons.public,
      badgeColor: Color(0xFFE0F2FE),
    ),
    _GeneratorCategory(
      type: GeneratorType.text,
      label: '텍스트',
      description: '공지나 짧은 메시지를 한 번의 스캔으로 전달하세요.',
      icon: Icons.text_snippet_outlined,
      badgeColor: Color(0xFFFFF7ED),
    ),
    _GeneratorCategory(
      type: GeneratorType.pdf,
      label: 'PDF',
      description: '가이드, 메뉴얼, 브로셔 PDF를 빠르게 열어보게 하세요.',
      icon: Icons.picture_as_pdf_outlined,
      badgeColor: Color(0xFFFFE4E6),
    ),
    _GeneratorCategory(
      type: GeneratorType.image,
      label: '이미지',
      description: '포스터, 포트폴리오, 제품 이미지를 즉시 공유하세요.',
      icon: Icons.image_outlined,
      badgeColor: Color(0xFFFEF9C3),
    ),
    _GeneratorCategory(
      type: GeneratorType.vcard,
      label: 'Vcard Plus',
      description: '연락처를 디지털 명함으로 만들어 바로 저장되게 하세요.',
      icon: Icons.badge_outlined,
      badgeColor: Color(0xFFD1FAE5),
    ),
    _GeneratorCategory(
      type: GeneratorType.video,
      label: '비디오',
      description: '튜토리얼·홍보 영상 링크를 빠르게 공유하세요.',
      icon: Icons.smart_display_outlined,
      badgeColor: Color(0xFFE0F2FE),
    ),
    _GeneratorCategory(
      type: GeneratorType.social,
      label: '소셜',
      description: '프로필·채널 링크를 스캔 한 번으로 연결하세요.',
      icon: Icons.people_alt_outlined,
      badgeColor: Color(0xFFD1FAE5),
    ),
    _GeneratorCategory(
      type: GeneratorType.playlist,
      label: '재생목록',
      description: '플레이리스트를 공유해 바로 재생되게 하세요.',
      icon: Icons.playlist_play,
      badgeColor: Color(0xFFFEF9C3),
    ),
    _GeneratorCategory(
      type: GeneratorType.wifi,
      label: '와이파이',
      description: 'SSID와 비밀번호를 한 번의 스캔으로 연결되게 하세요.',
      icon: Icons.wifi,
      badgeColor: Color(0xFFE0F2FE),
    ),
    _GeneratorCategory(
      type: GeneratorType.email,
      label: '이메일',
      description: '받는 사람·제목·본문까지 입력해 바로 작성하세요.',
      icon: Icons.mail_outline,
      badgeColor: Color(0xFFFFE4E6),
    ),
  ];

  final TextEditingController _urlCtrl = TextEditingController();
  final TextEditingController _textCtrl = TextEditingController();
  final TextEditingController _vNameCtrl = TextEditingController();
  final TextEditingController _vOrgCtrl = TextEditingController();
  final TextEditingController _vPhoneCtrl = TextEditingController();
  final TextEditingController _vEmailCtrl = TextEditingController();
  final TextEditingController _vUrlCtrl = TextEditingController();
  final TextEditingController _vNoteCtrl = TextEditingController();
  final TextEditingController _wifiSsidCtrl = TextEditingController();
  final TextEditingController _wifiPassCtrl = TextEditingController();
  final TextEditingController _emailToCtrl = TextEditingController();
  final TextEditingController _emailSubCtrl = TextEditingController();
  final TextEditingController _emailBodyCtrl = TextEditingController();
  String _wifiSecurity = 'WPA';

  @override
  void initState() {
    super.initState();
    final initialIndex = _categories.indexWhere((item) => item.type == _type);
    final initialPage = 1000 + (initialIndex < 0 ? 0 : initialIndex);
    _typeController = PageController(viewportFraction: 0.32, initialPage: initialPage);
    _typePage = initialPage.toDouble();
    _typeController.addListener(() {
      if (!_typeController.hasClients) return;
      setState(() {
        _typePage = _typeController.page ?? _typeController.initialPage.toDouble();
      });
    });
  }

  @override
  void dispose() {
    _typeController.dispose();
    _urlCtrl.dispose();
    _textCtrl.dispose();
    _vNameCtrl.dispose();
    _vOrgCtrl.dispose();
    _vPhoneCtrl.dispose();
    _vEmailCtrl.dispose();
    _vUrlCtrl.dispose();
    _vNoteCtrl.dispose();
    _wifiSsidCtrl.dispose();
    _wifiPassCtrl.dispose();
    _emailToCtrl.dispose();
    _emailSubCtrl.dispose();
    _emailBodyCtrl.dispose();
    super.dispose();
  }

  void _buildPayload() {
    String payload = '';
    switch (_type) {
      case GeneratorType.url:
        payload = _urlCtrl.text.trim();
        break;
      case GeneratorType.text:
        payload = _textCtrl.text.trim();
        break;
      case GeneratorType.pdf:
      case GeneratorType.image:
      case GeneratorType.video:
      case GeneratorType.social:
      case GeneratorType.playlist:
        payload = _urlCtrl.text.trim();
        break;
      case GeneratorType.vcard:
        payload = _buildVCard();
        break;
      case GeneratorType.wifi:
        final ssid = _wifiSsidCtrl.text.trim();
        final pass = _wifiPassCtrl.text.trim();
        payload = 'WIFI:T:$_wifiSecurity;S:$ssid;P:$pass;;';
        break;
      case GeneratorType.email:
        final to = _emailToCtrl.text.trim();
        final subject = _emailSubCtrl.text.trim();
        final body = _emailBodyCtrl.text.trim();
        payload = 'MATMSG:TO:$to;SUB:$subject;BODY:$body;;';
        break;
    }
    setState(() {
      _payload = payload;
    });

    if (payload.isNotEmpty) {
      final type = _payloadTypeForGenerator();
      LocalStorage.addHistory(
        HistoryItem(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          source: HistorySource.generate,
          type: type,
          value: payload,
          createdAt: DateTime.now(),
          meta: _buildGeneratorMeta(payload),
        ),
      );
    }
  }

  PayloadType _payloadTypeForGenerator() {
    switch (_type) {
      case GeneratorType.url:
        return PayloadType.url;
      case GeneratorType.text:
        return PayloadType.text;
      case GeneratorType.pdf:
        return PayloadType.pdf;
      case GeneratorType.image:
        return PayloadType.image;
      case GeneratorType.video:
        return PayloadType.video;
      case GeneratorType.social:
        return PayloadType.social;
      case GeneratorType.playlist:
        return PayloadType.playlist;
      case GeneratorType.vcard:
        return PayloadType.vcard;
      case GeneratorType.wifi:
        return PayloadType.wifi;
      case GeneratorType.email:
        return PayloadType.email;
    }
  }

  Map<String, dynamic> _buildGeneratorMeta(String payload) {
    switch (_type) {
      case GeneratorType.url:
        return {'url': payload, 'label': '웹페이지'};
      case GeneratorType.pdf:
        return {'url': payload, 'label': 'PDF'};
      case GeneratorType.image:
        return {'url': payload, 'label': '이미지'};
      case GeneratorType.video:
        return {'url': payload, 'label': '비디오'};
      case GeneratorType.social:
        return {'url': payload, 'label': '소셜'};
      case GeneratorType.playlist:
        return {'url': payload, 'label': '재생목록'};
      case GeneratorType.text:
        return {'label': '텍스트'};
      case GeneratorType.vcard:
        return {
          'label': 'Vcard Plus',
          'name': _vNameCtrl.text.trim(),
          'org': _vOrgCtrl.text.trim(),
          'phone': _vPhoneCtrl.text.trim(),
          'email': _vEmailCtrl.text.trim(),
          'url': _vUrlCtrl.text.trim(),
        };
      case GeneratorType.wifi:
        return {'label': '와이파이'};
      case GeneratorType.email:
        return {'label': '이메일'};
    }
  }

  String _buildVCard() {
    final name = _vNameCtrl.text.trim();
    final org = _vOrgCtrl.text.trim();
    final phone = _vPhoneCtrl.text.trim();
    final email = _vEmailCtrl.text.trim();
    final url = _vUrlCtrl.text.trim();
    final note = _vNoteCtrl.text.trim();

    final buffer = StringBuffer('BEGIN:VCARD\nVERSION:3.0\n');
    if (name.isNotEmpty) {
      buffer.writeln('N:$name;;;;');
      buffer.writeln('FN:$name');
    }
    if (org.isNotEmpty) buffer.writeln('ORG:$org');
    if (phone.isNotEmpty) buffer.writeln('TEL;TYPE=CELL:$phone');
    if (email.isNotEmpty) buffer.writeln('EMAIL:$email');
    if (url.isNotEmpty) buffer.writeln('URL:$url');
    if (note.isNotEmpty) buffer.writeln('NOTE:$note');
    buffer.write('END:VCARD');
    return buffer.toString();
  }

  void _onGeneratePressed(BuildContext context) {
    FocusScope.of(context).unfocus();
    if (_type == GeneratorType.url ||
        _type == GeneratorType.pdf ||
        _type == GeneratorType.image ||
        _type == GeneratorType.video ||
        _type == GeneratorType.social ||
        _type == GeneratorType.playlist) {
      if (_urlCtrl.text.trim().isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('링크를 입력해 주세요.')),
        );
        return;
      }
    }
    if (_type == GeneratorType.text && _textCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('텍스트를 입력해 주세요.')),
      );
      return;
    }
    if (_type == GeneratorType.vcard &&
        _vNameCtrl.text.trim().isEmpty &&
        _vPhoneCtrl.text.trim().isEmpty &&
        _vEmailCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('이름, 전화번호, 이메일 중 하나는 입력해 주세요.')),
      );
      return;
    }
    _buildPayload();
  }

  Future<Uint8List?> _captureQrPng() async {
    final boundary = _qrKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
    if (boundary == null) return null;
    final image = await boundary.toImage(pixelRatio: 3);
    final data = await image.toByteData(format: ui.ImageByteFormat.png);
    return data?.buffer.asUint8List();
  }

  Future<void> _shareQr() async {
    final bytes = await _captureQrPng();
    if (bytes == null) return;
    final tempDir = await getTemporaryDirectory();
    final file = File('${tempDir.path}/qr_code.png');
    await file.writeAsBytes(bytes);
    await Share.shareXFiles([XFile(file.path)], text: 'QR Code');
  }

  Future<void> _saveQr() async {
    final bytes = await _captureQrPng();
    if (bytes == null) return;
    if (Platform.isIOS) {
      await Permission.photos.request();
    } else {
      await Permission.storage.request();
    }
    await ImageGallerySaver.saveImage(bytes, quality: 100, name: 'qr_code');
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('갤러리에 저장했습니다.')),
    );
  }

  Future<void> _copyPayload() async {
    await Clipboard.setData(ClipboardData(text: _payload));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('원문 텍스트를 복사했습니다.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final dataStyle = QrDataModuleStyle(
      dataModuleShape: _moduleShape,
      color: _qrForegroundColor,
    );
    final eyeStyle = QrEyeStyle(
      eyeShape: _eyeShape,
      color: _qrForegroundColor,
    );

    return Stack(
      children: [
        SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'QR 생성',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              Text('필요한 타입을 선택하고 내용을 입력하세요.', style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: 16),
              SizedBox(
                height: 84,
                child: PageView.builder(
                  controller: _typeController,
                  itemCount: 10000,
                  physics: const BouncingScrollPhysics(),
                  onPageChanged: (index) {
                    final selected = _categories[index % _categories.length];
                    setState(() {
                      _type = selected.type;
                      _payload = '';
                    });
                  },
                  itemBuilder: (context, index) {
                    final item = _categories[index % _categories.length];
                    final distance = (index - _typePage).abs();
                    final scale = (1.08 - (distance * 0.08)).clamp(0.92, 1.08);
                    final opacity = (1 - (distance * 0.15)).clamp(0.75, 1.0);
                    final selected = item.type == _type;

                    return Opacity(
                      opacity: opacity,
                      child: Transform.scale(
                        scale: scale,
                        child: _TypeCard(
                          item: item,
                          selected: selected,
                          onTap: () {
                            _typeController.animateToPage(
                              index,
                              duration: const Duration(milliseconds: 220),
                              curve: Curves.easeOutBack,
                            );
                            setState(() {
                              _type = item.type;
                              _payload = '';
                            });
                          },
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 16),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: Container(
                  key: ValueKey(_type),
                  child: _buildTypeIntro(context),
                ),
              ),
              const SizedBox(height: 16),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: Container(
                  key: ValueKey(_type),
                  child: _buildInputSection(),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => _onGeneratePressed(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: colorScheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                    elevation: 6,
                    shadowColor: colorScheme.primary.withOpacity(0.4),
                  ),
                  child: const Text('QR 생성'),
                ),
              ),
              const SizedBox(height: 20),
              _buildPreviewEditor(dataStyle, eyeStyle),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _payload.isEmpty ? null : _saveQr,
                      icon: const Icon(Icons.save_alt),
                      label: const Text('저장'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: colorScheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _payload.isEmpty ? null : _shareQr,
                      icon: const Icon(Icons.share),
                      label: const Text('공유'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: TextButton.icon(
                  onPressed: _payload.isEmpty ? null : _copyPayload,
                  icon: const Icon(Icons.copy),
                  label: const Text('원문 텍스트 복사'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildInputSection() {
    switch (_type) {
      case GeneratorType.url:
      case GeneratorType.pdf:
      case GeneratorType.image:
      case GeneratorType.video:
      case GeneratorType.social:
      case GeneratorType.playlist:
        return _InputCard(
          title: _urlTitleForType(),
          child: TextField(
            controller: _urlCtrl,
            decoration: InputDecoration(hintText: _urlHintForType()),
          ),
        );
      case GeneratorType.text:
        return _InputCard(
          title: '텍스트 입력',
          child: TextField(
            controller: _textCtrl,
            maxLines: 4,
            decoration: const InputDecoration(hintText: '한 줄 메시지나 공지 내용을 입력하세요.'),
          ),
        );
      case GeneratorType.vcard:
        return _InputCard(
          title: 'Vcard Plus 정보 입력',
          child: Column(
            children: [
              TextField(controller: _vNameCtrl, decoration: const InputDecoration(hintText: '이름')),
              const SizedBox(height: 12),
              TextField(controller: _vOrgCtrl, decoration: const InputDecoration(hintText: '회사/조직')),
              const SizedBox(height: 12),
              TextField(controller: _vPhoneCtrl, decoration: const InputDecoration(hintText: '전화번호')),
              const SizedBox(height: 12),
              TextField(controller: _vEmailCtrl, decoration: const InputDecoration(hintText: '이메일')),
              const SizedBox(height: 12),
              TextField(controller: _vUrlCtrl, decoration: const InputDecoration(hintText: '웹사이트 URL')),
              const SizedBox(height: 12),
              TextField(
                controller: _vNoteCtrl,
                maxLines: 3,
                decoration: const InputDecoration(hintText: '메모/소개'),
              ),
            ],
          ),
        );
      case GeneratorType.wifi:
        return _InputCard(
          title: '와이파이 정보 입력',
          child: Column(
            children: [
              TextField(controller: _wifiSsidCtrl, decoration: const InputDecoration(hintText: 'SSID')),
              const SizedBox(height: 12),
              TextField(controller: _wifiPassCtrl, decoration: const InputDecoration(hintText: '암호')),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _wifiSecurity,
                items: const [
                  DropdownMenuItem(value: 'WPA', child: Text('WPA/WPA2')),
                  DropdownMenuItem(value: 'WEP', child: Text('WEP')),
                  DropdownMenuItem(value: 'nopass', child: Text('없음')),
                ],
                onChanged: (value) => setState(() => _wifiSecurity = value ?? 'WPA'),
              ),
            ],
          ),
        );
      case GeneratorType.email:
        return _InputCard(
          title: '이메일 정보 입력',
          child: Column(
            children: [
              TextField(controller: _emailToCtrl, decoration: const InputDecoration(hintText: '받는 사람')),
              const SizedBox(height: 12),
              TextField(controller: _emailSubCtrl, decoration: const InputDecoration(hintText: '제목')),
              const SizedBox(height: 12),
              TextField(controller: _emailBodyCtrl, decoration: const InputDecoration(hintText: '본문')),
            ],
          ),
        );
    }
  }

  String _urlTitleForType() {
    switch (_type) {
      case GeneratorType.url:
        return '웹페이지 링크 입력';
      case GeneratorType.pdf:
        return 'PDF 링크 입력';
      case GeneratorType.image:
        return '이미지 링크 입력';
      case GeneratorType.video:
        return '비디오 링크 입력';
      case GeneratorType.social:
        return '소셜 링크 입력';
      case GeneratorType.playlist:
        return '재생목록 링크 입력';
      default:
        return '링크 입력';
    }
  }

  String _urlHintForType() {
    switch (_type) {
      case GeneratorType.url:
        return 'https://example.com';
      case GeneratorType.pdf:
        return 'https://example.com/guide.pdf';
      case GeneratorType.image:
        return 'https://example.com/poster.png';
      case GeneratorType.video:
        return 'https://example.com/video';
      case GeneratorType.social:
        return 'https://social.com/username';
      case GeneratorType.playlist:
        return 'https://music.com/playlist';
      default:
        return 'https://example.com';
    }
  }

  Widget _buildTypeIntro(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final current = _categories.firstWhere((item) => item.type == _type);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colorScheme.outlineVariant),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          _IconBadge(icon: current.icon, color: current.badgeColor, selected: true),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  current.label,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  current.description,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: const Color(0xFF475569)),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPreviewEditor(QrDataModuleStyle dataStyle, QrEyeStyle eyeStyle) {
    final colorScheme = Theme.of(context).colorScheme;
    final palette = [
      const Color(0xFF2563EB),
      const Color(0xFF0F172A),
      const Color(0xFF475569),
      const Color(0xFFD1FAE5),
      const Color(0xFFFFE4E6),
      const Color(0xFFFEF9C3),
      const Color(0xFFE0F2FE),
      const Color(0xFFFFF7ED),
    ];
    final contrast = _contrastRatio(_qrForegroundColor, _qrBackgroundColor);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colorScheme.outlineVariant),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 18,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RepaintBoundary(
            key: _qrKey,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _useGradient
                    ? Colors.transparent
                    : _qrBackgroundColor,
                borderRadius: BorderRadius.circular(16),
                gradient: _useGradient
                    ? LinearGradient(
                        colors: [
                          _qrBackgroundColor,
                          _qrBackgroundColor.withOpacity(0.7),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: _payload.isEmpty
                  ? SizedBox(
                      height: 140,
                      width: 140,
                      child: Center(
                        child: Text('입력 후 생성', style: TextStyle(color: Colors.grey[600])),
                      ),
                    )
                  : QrImageView(
                      data: _payload,
                      size: 140,
                      backgroundColor: _qrBackgroundColor,
                      dataModuleStyle: dataStyle,
                      eyeStyle: eyeStyle,
                      errorCorrectionLevel: _errorCorrection,
                    ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('컬러 편집', style: Theme.of(context).textTheme.labelMedium),
                const SizedBox(height: 10),
                _buildColorRow(
                  title: '전경색',
                  selected: _qrForegroundColor,
                  palette: palette,
                  onSelect: (color) => setState(() => _qrForegroundColor = color),
                  onCustom: () => _openColorPicker(
                    initial: _qrForegroundColor,
                    onChanged: (color) => setState(() => _qrForegroundColor = color),
                  ),
                ),
                const SizedBox(height: 12),
                _buildColorRow(
                  title: '배경색',
                  selected: _qrBackgroundColor,
                  palette: palette,
                  onSelect: (color) => setState(() => _qrBackgroundColor = color),
                  onCustom: () => _openColorPicker(
                    initial: _qrBackgroundColor,
                    onChanged: (color) => setState(() => _qrBackgroundColor = color),
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Text('그라데이션', style: Theme.of(context).textTheme.labelSmall),
                    const SizedBox(width: 8),
                    Switch.adaptive(
                      value: _useGradient,
                      onChanged: (value) => setState(() => _useGradient = value),
                      activeColor: colorScheme.primary,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ],
                ),
                if (contrast < 3.0) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDBEAFE),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: colorScheme.primary.withOpacity(0.2)),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.warning_amber_rounded, size: 16, color: colorScheme.primary),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            '명암 대비가 낮습니다. 자동 보정이 필요할 수 있어요.',
                            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                  color: colorScheme.primary,
                                ),
                          ),
                        ),
                        TextButton(
                          onPressed: _applyAutoContrast,
                          child: const Text('자동 보정'),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                Text('QR 디자인', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),
                Text('패턴', style: Theme.of(context).textTheme.labelSmall),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  children: [
                    ChoiceChip(
                      label: const Text('클래식'),
                      selected: _moduleShape == QrDataModuleShape.square,
                      onSelected: (_) => setState(() {
                        _moduleShape = QrDataModuleShape.square;
                        _eyeShape = QrEyeShape.square;
                      }),
                    ),
                    ChoiceChip(
                      label: const Text('라운드'),
                      selected: _moduleShape == QrDataModuleShape.circle,
                      onSelected: (_) => setState(() {
                        _moduleShape = QrDataModuleShape.circle;
                        _eyeShape = QrEyeShape.circle;
                      }),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Text('오류 수정 레벨', style: Theme.of(context).textTheme.labelSmall),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  children: [
                    ChoiceChip(
                      label: const Text('L'),
                      selected: _errorCorrection == QrErrorCorrectLevel.L,
                      onSelected: (_) => setState(() => _errorCorrection = QrErrorCorrectLevel.L),
                    ),
                    ChoiceChip(
                      label: const Text('M'),
                      selected: _errorCorrection == QrErrorCorrectLevel.M,
                      onSelected: (_) => setState(() => _errorCorrection = QrErrorCorrectLevel.M),
                    ),
                    ChoiceChip(
                      label: const Text('Q'),
                      selected: _errorCorrection == QrErrorCorrectLevel.Q,
                      onSelected: (_) => setState(() => _errorCorrection = QrErrorCorrectLevel.Q),
                    ),
                    ChoiceChip(
                      label: const Text('H'),
                      selected: _errorCorrection == QrErrorCorrectLevel.H,
                      onSelected: (_) => setState(() => _errorCorrection = QrErrorCorrectLevel.H),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildColorRow({
    required String title,
    required Color selected,
    required List<Color> palette,
    required ValueChanged<Color> onSelect,
    required VoidCallback onCustom,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.labelSmall),
        const SizedBox(height: 6),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            ...palette.map((color) {
              final isSelected = selected.value == color.value;
              return GestureDetector(
                onTap: () => onSelect(color),
                child: Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isSelected ? Colors.white : Colors.black.withOpacity(0.12),
                      width: isSelected ? 3 : 1,
                    ),
                    boxShadow: [
                      if (isSelected)
                        BoxShadow(
                          color: color.withOpacity(0.35),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                    ],
                  ),
                ),
              );
            }),
            OutlinedButton(
              onPressed: onCustom,
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('커스텀'),
            ),
          ],
        ),
      ],
    );
  }

  Future<void> _openColorPicker({
    required Color initial,
    required ValueChanged<Color> onChanged,
  }) async {
    double r = initial.red.toDouble();
    double g = initial.green.toDouble();
    double b = initial.blue.toDouble();

    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('커스텀 컬러'),
        content: StatefulBuilder(
          builder: (context, setStateDialog) {
            final current = Color.fromARGB(255, r.round(), g.round(), b.round());
            return Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  height: 60,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: current,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                  ),
                ),
                const SizedBox(height: 12),
                _ColorSlider(
                  label: 'R',
                  value: r,
                  color: Colors.redAccent,
                  onChanged: (value) => setStateDialog(() => r = value),
                ),
                _ColorSlider(
                  label: 'G',
                  value: g,
                  color: Colors.greenAccent,
                  onChanged: (value) => setStateDialog(() => g = value),
                ),
                _ColorSlider(
                  label: 'B',
                  value: b,
                  color: Colors.blueAccent,
                  onChanged: (value) => setStateDialog(() => b = value),
                ),
              ],
            );
          },
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('취소')),
          TextButton(
            onPressed: () {
              onChanged(Color.fromARGB(255, r.round(), g.round(), b.round()));
              Navigator.pop(context);
            },
            child: const Text('적용'),
          ),
        ],
      ),
    );
  }

  double _contrastRatio(Color foreground, Color background) {
    final fg = foreground.computeLuminance();
    final bg = background.computeLuminance();
    final lighter = fg > bg ? fg : bg;
    final darker = fg > bg ? bg : fg;
    return (lighter + 0.05) / (darker + 0.05);
  }

  void _applyAutoContrast() {
    setState(() {
      _qrForegroundColor = const Color(0xFF0F172A);
      _qrBackgroundColor = Colors.white;
      _useGradient = false;
    });
  }

}

class _ColorSlider extends StatelessWidget {
  const _ColorSlider({
    required this.label,
    required this.value,
    required this.color,
    required this.onChanged,
  });

  final String label;
  final double value;
  final Color color;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(width: 18, child: Text(label)),
        Expanded(
          child: Slider(
            value: value,
            min: 0,
            max: 255,
            divisions: 255,
            activeColor: color,
            onChanged: onChanged,
          ),
        ),
      ],
    );
  }
}

class _InputCard extends StatelessWidget {
  const _InputCard({
    required this.title,
    required this.child,
  });

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: colorScheme.outlineVariant),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _TypeCard extends StatelessWidget {
  const _TypeCard({
    required this.item,
    required this.selected,
    required this.onTap,
  });

  final _GeneratorCategory item;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final borderColor = selected ? colorScheme.primary : colorScheme.outlineVariant;
    final background = selected ? colorScheme.primary.withOpacity(0.08) : colorScheme.surface;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _IconBadge(icon: item.icon, color: item.badgeColor, selected: selected),
            const SizedBox(height: 6),
            Text(
              item.label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: colorScheme.onSurface,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _IconBadge extends StatelessWidget {
  const _IconBadge({
    required this.icon,
    required this.color,
    required this.selected,
  });

  final IconData icon;
  final Color color;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: selected ? colorScheme.primary : colorScheme.outlineVariant,
          width: 1,
        ),
      ),
      child: Icon(icon, size: 18, color: colorScheme.primary),
    );
  }
}

class _GeneratorCategory {
  const _GeneratorCategory({
    required this.type,
    required this.label,
    required this.description,
    required this.icon,
    required this.badgeColor,
  });

  final GeneratorType type;
  final String label;
  final String description;
  final IconData icon;
  final Color badgeColor;
}
