import 'dart:async';
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
enum GradientDirection { diagonal, vertical, horizontal }

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
  GradientDirection _gradientDirection = GradientDirection.diagonal;
  double _gradientIntensity = 0.65;
  late final PageController _typeController;
  double _typePage = 0;
  Timer? _typeAutoScrollTimer;
  bool _isTypeUserScrolling = false;
  Timer? _typeUserScrollReleaseTimer;
  Timer? _typeAutoScrollPauseTimer;
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
    _startTypeAutoScroll();
  }

  @override
  void dispose() {
    _typeAutoScrollTimer?.cancel();
    _typeUserScrollReleaseTimer?.cancel();
    _typeAutoScrollPauseTimer?.cancel();
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

  void _startTypeAutoScroll() {
    _typeAutoScrollTimer?.cancel();
    _typeAutoScrollTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!_typeController.hasClients || _isTypeUserScrolling) return;
      final current = _typeController.page ?? _typeController.initialPage.toDouble();
      final next = current - 1;
      _typeController.animateToPage(
        next.round(),
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeOut,
      );
    });
  }

  void _pauseAutoScroll([Duration duration = const Duration(seconds: 3)]) {
    _isTypeUserScrolling = true;
    _typeAutoScrollPauseTimer?.cancel();
    _typeAutoScrollPauseTimer = Timer(duration, () => _isTypeUserScrolling = false);
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
    final palette = _generatorPalette(context);
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
        LayoutBuilder(
          builder: (context, constraints) {
            return Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              child: SizedBox(
                height: constraints.maxHeight,
                child: _buildPreviewEditor(dataStyle, eyeStyle, palette),
              ),
            );
          },
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

  Widget _buildPreviewEditor(
    QrDataModuleStyle dataStyle,
    QrEyeStyle eyeStyle,
    _GeneratorPalette palette,
  ) {
    final colorPalette = [
      const Color(0xFF2563EB),
      const Color(0xFF0F172A),
      const Color(0xFF475569),
      const Color(0xFFD1FAE5),
      const Color(0xFFFFE4E6),
      const Color(0xFFFEF9C3),
      const Color(0xFFE0F2FE),
      const Color(0xFFFFF7ED),
    ];
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: palette.border),
        boxShadow: [
          BoxShadow(
            color: palette.shadow,
            blurRadius: 18,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final isWide = constraints.maxWidth >= 860;
          final topHeight = (constraints.maxHeight * 0.23).clamp(140.0, 180.0);
          final bottomHeight = 58.0;
          final spacing = 8.0;
          final available = constraints.maxHeight - topHeight - bottomHeight - (spacing * 3);
          final rowHeight = (available / 2).clamp(120.0, 200.0);
          final previewMax = (rowHeight * 0.8).clamp(120.0, 190.0);

          return Column(
            children: [
              SizedBox(
                height: topHeight,
                child: _buildTopControls(palette),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: rowHeight,
                child: Row(
                  children: [
                    Expanded(
                      child: _buildSectionCard(
                        palette: palette,
                        title: '미리보기',
                        child: _buildPreviewCard(
                          dataStyle,
                          eyeStyle,
                          palette,
                          previewMax,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildSectionCard(
                        palette: palette,
                        title: '컬러 편집',
                        child: _buildColorSection(
                          palette: palette,
                          colors: colorPalette,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: rowHeight,
                child: Row(
                  children: [
                    Expanded(
                      child: _buildSectionCard(
                        palette: palette,
                        title: '그라데이션',
                        child: _buildGradientSection(palette),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildSectionCard(
                        palette: palette,
                        title: 'QR 디자인',
                        child: _buildDesignSection(palette),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: bottomHeight,
                child: _buildSaveShareRow(palette),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildTopControls(_GeneratorPalette palette) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 56,
          child: NotificationListener<ScrollNotification>(
            onNotification: (notification) {
              if (notification is ScrollStartNotification) {
                _isTypeUserScrolling = true;
                _typeUserScrollReleaseTimer?.cancel();
              } else if (notification is ScrollUpdateNotification) {
                _isTypeUserScrolling = true;
                _typeUserScrollReleaseTimer?.cancel();
              } else if (notification is ScrollEndNotification) {
                _typeUserScrollReleaseTimer?.cancel();
                _typeUserScrollReleaseTimer = Timer(
                  const Duration(milliseconds: 200),
                  () => _isTypeUserScrolling = false,
                );
              }
              return false;
            },
            child: PageView.builder(
              controller: _typeController,
              itemCount: 10000,
              reverse: false,
              physics: const BouncingScrollPhysics(),
              onPageChanged: (index) {
                if (!_isTypeUserScrolling) return;
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
                        _pauseAutoScroll();
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
        ),
        const SizedBox(height: 8),
        Expanded(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final isCompact = constraints.maxWidth < 420;
              if (isCompact) {
                return Column(
                  children: [
                    Expanded(child: _buildInputCard(palette)),
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => _onGeneratePressed(context),
                        style: _primaryActionStyle(palette),
                        child: const Text('QR 생성'),
                      ),
                    ),
                  ],
                );
              }
              return Row(
                children: [
                  Expanded(child: _buildInputCard(palette)),
                  const SizedBox(width: 12),
                  SizedBox(
                    width: 108,
                    child: ElevatedButton(
                      onPressed: () => _onGeneratePressed(context),
                      style: _primaryActionStyle(palette),
                      child: const Text('QR 생성'),
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildInputCard(_GeneratorPalette palette) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: palette.surfaceAlt,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: palette.border),
      ),
      child: _buildCompactInputSection(palette),
    );
  }

  Widget _buildCompactInputSection(_GeneratorPalette palette) {
    final decoration = _compactInputDecoration();
    switch (_type) {
      case GeneratorType.url:
      case GeneratorType.pdf:
      case GeneratorType.image:
      case GeneratorType.video:
      case GeneratorType.social:
      case GeneratorType.playlist:
        return TextField(
          controller: _urlCtrl,
          decoration: decoration.copyWith(hintText: _urlHintForType()),
        );
      case GeneratorType.text:
        return TextField(
          controller: _textCtrl,
          maxLines: 2,
          decoration: decoration.copyWith(hintText: '내용을 입력하세요.'),
        );
      case GeneratorType.vcard:
        return LayoutBuilder(
          builder: (context, constraints) {
            final isCompact = constraints.maxWidth < 420;
            return isCompact
                ? Column(
                    children: [
                      TextField(
                        controller: _vNameCtrl,
                        decoration: decoration.copyWith(hintText: '이름'),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _vPhoneCtrl,
                        decoration: decoration.copyWith(hintText: '전화번호'),
                      ),
                      const SizedBox(height: 8),
                      Align(
                        alignment: Alignment.centerRight,
                        child: OutlinedButton(
                          onPressed: () => _openDetailSheet(context),
                          style: _secondaryActionStyle(palette),
                          child: const Text('상세'),
                        ),
                      ),
                    ],
                  )
                : Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _vNameCtrl,
                          decoration: decoration.copyWith(hintText: '이름'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _vPhoneCtrl,
                          decoration: decoration.copyWith(hintText: '전화번호'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton(
                        onPressed: () => _openDetailSheet(context),
                        style: _secondaryActionStyle(palette),
                        child: const Text('상세'),
                      ),
                    ],
                  );
          },
        );
      case GeneratorType.wifi:
        return LayoutBuilder(
          builder: (context, constraints) {
            final isCompact = constraints.maxWidth < 420;
            return isCompact
                ? Column(
                    children: [
                      TextField(
                        controller: _wifiSsidCtrl,
                        decoration: decoration.copyWith(hintText: 'SSID'),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _wifiPassCtrl,
                        decoration: decoration.copyWith(hintText: '암호'),
                      ),
                      const SizedBox(height: 8),
                      Align(
                        alignment: Alignment.centerRight,
                        child: OutlinedButton(
                          onPressed: () => _openDetailSheet(context),
                          style: _secondaryActionStyle(palette),
                          child: const Text('상세'),
                        ),
                      ),
                    ],
                  )
                : Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _wifiSsidCtrl,
                          decoration: decoration.copyWith(hintText: 'SSID'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _wifiPassCtrl,
                          decoration: decoration.copyWith(hintText: '암호'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton(
                        onPressed: () => _openDetailSheet(context),
                        style: _secondaryActionStyle(palette),
                        child: const Text('상세'),
                      ),
                    ],
                  );
          },
        );
      case GeneratorType.email:
        return LayoutBuilder(
          builder: (context, constraints) {
            final isCompact = constraints.maxWidth < 420;
            return isCompact
                ? Column(
                    children: [
                      TextField(
                        controller: _emailToCtrl,
                        decoration: decoration.copyWith(hintText: '받는 사람'),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _emailSubCtrl,
                        decoration: decoration.copyWith(hintText: '제목'),
                      ),
                      const SizedBox(height: 8),
                      Align(
                        alignment: Alignment.centerRight,
                        child: OutlinedButton(
                          onPressed: () => _openDetailSheet(context),
                          style: _secondaryActionStyle(palette),
                          child: const Text('상세'),
                        ),
                      ),
                    ],
                  )
                : Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _emailToCtrl,
                          decoration: decoration.copyWith(hintText: '받는 사람'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _emailSubCtrl,
                          decoration: decoration.copyWith(hintText: '제목'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton(
                        onPressed: () => _openDetailSheet(context),
                        style: _secondaryActionStyle(palette),
                        child: const Text('상세'),
                      ),
                    ],
                  );
          },
        );
    }
  }

  InputDecoration _compactInputDecoration() {
    return const InputDecoration(
      isDense: true,
      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      border: OutlineInputBorder(borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(borderSide: BorderSide.none),
      focusedBorder: OutlineInputBorder(borderSide: BorderSide.none),
    );
  }

  Widget _buildSectionCard({
    required _GeneratorPalette palette,
    required String title,
    required Widget child,
  }) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: palette.surfaceAlt,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: palette.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w500,
              color: palette.primaryText,
            ),
          ),
          const SizedBox(height: 4),
          Expanded(child: child),
        ],
      ),
    );
  }

  Widget _buildSaveShareRow(_GeneratorPalette palette) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: palette.surfaceAlt,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: palette.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: ElevatedButton.icon(
              onPressed: _payload.isEmpty ? null : _saveQr,
              icon: const Icon(Icons.save_alt),
              label: const Text('저장'),
              style: _primaryActionStyle(palette),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: OutlinedButton.icon(
              onPressed: _payload.isEmpty ? null : _shareQr,
              icon: const Icon(Icons.share),
              label: const Text('공유'),
              style: _secondaryActionStyle(palette),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPreviewCard(
    QrDataModuleStyle dataStyle,
    QrEyeStyle eyeStyle,
    _GeneratorPalette palette,
    double maxPreviewSize,
  ) {
    final gradient = _useGradient
        ? LinearGradient(
            colors: [
              _qrBackgroundColor,
              _qrBackgroundColor.withOpacity(_gradientIntensity),
            ],
            begin: _gradientBegin(),
            end: _gradientEnd(),
          )
        : null;

    return LayoutBuilder(
      builder: (context, constraints) {
        final upperBound = maxPreviewSize < 110.0 ? 110.0 : maxPreviewSize;
        final size = constraints.maxWidth.clamp(110.0, 200.0).clamp(110.0, upperBound);
        final qrBox = RepaintBoundary(
          key: _qrKey,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _useGradient ? Colors.transparent : _qrBackgroundColor,
              borderRadius: BorderRadius.circular(20),
              gradient: gradient,
              border: Border.all(color: palette.border),
              boxShadow: [
                BoxShadow(
                  color: palette.shadow,
                  blurRadius: 16,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: _payload.isEmpty
                ? SizedBox(
                    height: size,
                    width: size,
                    child: Center(
                      child: Text(
                        '입력 후 생성',
                        style: TextStyle(color: palette.mutedText, fontWeight: FontWeight.w500),
                      ),
                    ),
                  )
                : QrImageView(
                    data: _payload,
                    size: size,
                    backgroundColor: _useGradient ? Colors.transparent : _qrBackgroundColor,
                    dataModuleStyle: dataStyle,
                    eyeStyle: eyeStyle,
                  ),
          ),
        );

        return Center(child: qrBox);
      },
    );
  }

  Widget _buildColorSection({
    required _GeneratorPalette palette,
    required List<Color> colors,
  }) {
    final labelStyle = TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w500,
      color: palette.secondaryText,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildColorRow(
          title: 'QR 색상',
          selected: _qrForegroundColor,
          palette: colors,
          labelStyle: labelStyle,
          paletteTokens: palette,
          onSelect: (color) => setState(() => _qrForegroundColor = color),
          onCustom: () => _openColorPicker(
            initial: _qrForegroundColor,
            onChanged: (color) => setState(() => _qrForegroundColor = color),
          ),
        ),
        const SizedBox(height: 10),
        _buildColorRow(
          title: '배경색',
          selected: _qrBackgroundColor,
          palette: colors,
          labelStyle: labelStyle,
          paletteTokens: palette,
          onSelect: (color) => setState(() => _qrBackgroundColor = color),
          onCustom: () => _openColorPicker(
            initial: _qrBackgroundColor,
            onChanged: (color) => setState(() => _qrBackgroundColor = color),
          ),
        ),
      ],
    );
  }

  Widget _buildGradientSection(_GeneratorPalette palette) {
    final labelStyle = TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w500,
      color: palette.secondaryText,
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text('기본 OFF', style: labelStyle),
            const SizedBox(width: 8),
            Switch.adaptive(
              value: _useGradient,
              onChanged: (value) => setState(() => _useGradient = value),
              activeColor: palette.primary,
              activeTrackColor: palette.primary.withOpacity(0.3),
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            const Spacer(),
            IconButton(
              onPressed: _useGradient ? () => _openGradientSheet(context, palette) : null,
              icon: const Icon(Icons.tune, size: 18),
              tooltip: '그라데이션 옵션',
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDesignSection(_GeneratorPalette palette) {
    final labelStyle = TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w500,
      color: palette.secondaryText,
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('패턴', style: labelStyle),
        const SizedBox(height: 6),
        _buildSegmentedRow<QrDataModuleShape>(
          palette: palette,
          options: const [
            _SegmentOption(value: QrDataModuleShape.square, label: '클래식'),
            _SegmentOption(value: QrDataModuleShape.circle, label: '라운드'),
          ],
          selected: _moduleShape,
          onSelected: (value) => setState(() {
            _moduleShape = value;
            _eyeShape = value == QrDataModuleShape.circle ? QrEyeShape.circle : QrEyeShape.square;
          }),
        ),
      ],
    );
  }

  Widget _buildColorRow({
    required String title,
    required Color selected,
    required List<Color> palette,
    required TextStyle labelStyle,
    required _GeneratorPalette paletteTokens,
    required ValueChanged<Color> onSelect,
    required VoidCallback onCustom,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            SizedBox(
              width: 62,
              child: Text(title, style: labelStyle, maxLines: 1, overflow: TextOverflow.ellipsis),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    for (final color in palette)
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: _ColorDot(
                          color: color,
                          selected: selected.value == color.value,
                          palette: paletteTokens,
                          onTap: () => onSelect(color),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),
            OutlinedButton(
              onPressed: onCustom,
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ).copyWith(
                side: MaterialStateProperty.all(
                  BorderSide(color: paletteTokens.border),
                ),
                foregroundColor: MaterialStateProperty.all(paletteTokens.primaryText),
                backgroundColor: MaterialStateProperty.all(paletteTokens.surfaceAlt),
              ),
              child: const Text('커스텀'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSegmentedRow<T>({
    required _GeneratorPalette palette,
    required List<_SegmentOption<T>> options,
    required T selected,
    required ValueChanged<T> onSelected,
  }) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final option in options)
          _SegmentedButton<T>(
            option: option,
            selected: option.value == selected,
            palette: palette,
            onSelected: onSelected,
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

  Future<void> _openGradientSheet(BuildContext context, _GeneratorPalette palette) async {
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: palette.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('그라데이션 옵션', style: TextStyle(fontWeight: FontWeight.w600, color: palette.primaryText)),
              const SizedBox(height: 12),
              Text('방향', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: palette.secondaryText)),
              const SizedBox(height: 6),
              _buildSegmentedRow<GradientDirection>(
                palette: palette,
                options: const [
                  _SegmentOption(value: GradientDirection.diagonal, label: '대각선'),
                  _SegmentOption(value: GradientDirection.vertical, label: '수직'),
                  _SegmentOption(value: GradientDirection.horizontal, label: '수평'),
                ],
                selected: _gradientDirection,
                onSelected: (value) => setState(() => _gradientDirection = value),
              ),
              const SizedBox(height: 12),
              Text('강도', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: palette.secondaryText)),
              const SizedBox(height: 6),
              _buildSegmentedRow<double>(
                palette: palette,
                options: const [
                  _SegmentOption(value: 0.45, label: '소프트'),
                  _SegmentOption(value: 0.65, label: '기본'),
                  _SegmentOption(value: 0.82, label: '강한'),
                ],
                selected: _gradientIntensity,
                onSelected: (value) => setState(() => _gradientIntensity = value),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _openDetailSheet(BuildContext context) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: EdgeInsets.fromLTRB(20, 16, 20, 24 + MediaQuery.of(context).viewInsets.bottom),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '상세 입력',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 12),
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
                      onPressed: () => Navigator.pop(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Theme.of(context).colorScheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: const Text('닫기'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Alignment _gradientBegin() {
    switch (_gradientDirection) {
      case GradientDirection.vertical:
        return Alignment.topCenter;
      case GradientDirection.horizontal:
        return Alignment.centerLeft;
      case GradientDirection.diagonal:
        return Alignment.topLeft;
    }
  }

  Alignment _gradientEnd() {
    switch (_gradientDirection) {
      case GradientDirection.vertical:
        return Alignment.bottomCenter;
      case GradientDirection.horizontal:
        return Alignment.centerRight;
      case GradientDirection.diagonal:
        return Alignment.bottomRight;
    }
  }

  ButtonStyle _primaryActionStyle(_GeneratorPalette palette) {
    return ElevatedButton.styleFrom(
      padding: const EdgeInsets.symmetric(vertical: 14),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ).copyWith(
      backgroundColor: MaterialStateProperty.resolveWith(
        (states) => states.contains(MaterialState.disabled)
            ? palette.primary.withOpacity(0.4)
            : palette.primary,
      ),
      foregroundColor: MaterialStateProperty.resolveWith(
        (states) => states.contains(MaterialState.disabled)
            ? palette.primaryText.withOpacity(0.75)
            : Colors.white,
      ),
      elevation: MaterialStateProperty.resolveWith(
        (states) => states.contains(MaterialState.disabled) ? 0 : 2,
      ),
      shadowColor: MaterialStateProperty.all(palette.primary.withOpacity(0.4)),
    );
  }

  ButtonStyle _secondaryActionStyle(_GeneratorPalette palette) {
    return OutlinedButton.styleFrom(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 14),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ).copyWith(
      side: MaterialStateProperty.resolveWith(
        (states) => BorderSide(
          color: states.contains(MaterialState.disabled)
              ? palette.border.withOpacity(0.6)
              : palette.border,
        ),
      ),
      foregroundColor: MaterialStateProperty.resolveWith(
        (states) => states.contains(MaterialState.disabled)
            ? palette.secondaryText.withOpacity(0.7)
            : palette.primaryText,
      ),
      backgroundColor: MaterialStateProperty.resolveWith(
        (states) => states.contains(MaterialState.disabled)
            ? palette.surfaceAlt
            : palette.surfaceAlt.withOpacity(0.6),
      ),
    );
  }

  _GeneratorPalette _generatorPalette(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    if (Theme.of(context).brightness == Brightness.dark) {
      return const _GeneratorPalette(
        background: Color(0xFF0B1220),
        surface: Color(0xFF111B2E),
        surfaceAlt: Color(0xFF0F1A2D),
        primaryText: Color(0xFFEAF2FF),
        secondaryText: Color(0xFFA9B8D0),
        mutedText: Color(0xFF6B7C99),
        border: Color(0x14FFFFFF),
        primary: Color(0xFF2563EB),
        shadow: Color(0x33000000),
        warningBackground: Color(0x1F2563EB),
      );
    }
    return _GeneratorPalette(
      background: colorScheme.background,
      surface: colorScheme.surface,
      surfaceAlt: colorScheme.surfaceVariant,
      primaryText: colorScheme.onSurface,
      secondaryText: const Color(0xFF475569),
      mutedText: const Color(0xFF64748B),
      border: colorScheme.outlineVariant,
      primary: colorScheme.primary,
      shadow: Colors.black.withOpacity(0.08),
      warningBackground: const Color(0xFFDBEAFE),
    );
  }
}

class _SegmentOption<T> {
  const _SegmentOption({
    required this.value,
    required this.label,
  });

  final T value;
  final String label;
}

class _SegmentedButton<T> extends StatelessWidget {
  const _SegmentedButton({
    required this.option,
    required this.selected,
    required this.palette,
    required this.onSelected,
  });

  final _SegmentOption<T> option;
  final bool selected;
  final _GeneratorPalette palette;
  final ValueChanged<T> onSelected;

  @override
  Widget build(BuildContext context) {
    final background = selected ? palette.primary.withOpacity(0.2) : palette.surfaceAlt;
    final borderColor = selected ? palette.primary : palette.border;
    final textColor = selected ? Colors.white : palette.secondaryText;

    return InkWell(
      onTap: () => onSelected(option.value),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor),
        ),
        child: Text(
          option.label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: textColor,
          ),
        ),
      ),
    );
  }
}

class _ColorDot extends StatelessWidget {
  const _ColorDot({
    required this.color,
    required this.selected,
    required this.palette,
    required this.onTap,
  });

  final Color color;
  final bool selected;
  final _GeneratorPalette palette;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final checkColor = color.computeLuminance() > 0.6 ? Colors.black : Colors.white;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 30,
        height: 30,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          border: Border.all(
            color: selected ? palette.primary : palette.border,
            width: selected ? 2.5 : 1,
          ),
          boxShadow: [
            if (selected)
              BoxShadow(
                color: palette.primary.withOpacity(0.35),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
          ],
        ),
        child: selected
            ? Icon(Icons.check, size: 16, color: checkColor)
            : null,
      ),
    );
  }
}

class _GeneratorPalette {
  const _GeneratorPalette({
    required this.background,
    required this.surface,
    required this.surfaceAlt,
    required this.primaryText,
    required this.secondaryText,
    required this.mutedText,
    required this.border,
    required this.primary,
    required this.shadow,
    required this.warningBackground,
  });

  final Color background;
  final Color surface;
  final Color surfaceAlt;
  final Color primaryText;
  final Color secondaryText;
  final Color mutedText;
  final Color border;
  final Color primary;
  final Color shadow;
  final Color warningBackground;
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
        margin: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _IconBadge(icon: item.icon, color: item.badgeColor, selected: selected),
            const SizedBox(height: 4),
            Text(
              item.label,
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w500,
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
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: selected ? colorScheme.primary : colorScheme.outlineVariant,
          width: 1,
        ),
      ),
      child: Icon(icon, size: 14, color: colorScheme.primary),
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
