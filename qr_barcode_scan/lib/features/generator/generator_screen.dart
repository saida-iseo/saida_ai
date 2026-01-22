import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
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
  static const List<Color> _presetColors = [
    Color(0xFF000000),
    Color(0xFFEF4444),
    Color(0xFFF97316),
    Color(0xFFFACC15),
    Color(0xFF22C55E),
    Color(0xFF3B82F6),
    Color(0xFF6366F1),
    Color(0xFFA855F7),
    Color(0xFFFFFFFF),
  ];
  final List<_GeneratorCategory> _categories = [
    _GeneratorCategory(
      type: GeneratorType.wifi,
      label: '와이파이',
      description: 'SSID와 비밀번호를 바로 연결되게 하세요.',
      icon: Icons.wifi,
      badgeColor: Color(0xFFD1FAE5),
    ),
    _GeneratorCategory(
      type: GeneratorType.url,
      label: '웹페이지',
      description: '링크 하나로 빠르게 공유하세요.',
      icon: Icons.public,
      badgeColor: Color(0xFFE0F2FE),
    ),
    _GeneratorCategory(
      type: GeneratorType.pdf,
      label: 'PDF',
      description: 'PDF 링크를 빠르게 열어보게 하세요.',
      icon: Icons.picture_as_pdf_outlined,
      badgeColor: Color(0xFFFFE4E6),
    ),
    _GeneratorCategory(
      type: GeneratorType.image,
      label: '이미지',
      description: '이미지 링크를 빠르게 공유하세요.',
      icon: Icons.image_outlined,
      badgeColor: Color(0xFFFEF9C3),
    ),
    _GeneratorCategory(
      type: GeneratorType.text,
      label: '텍스트',
      description: '공지나 짧은 메시지를 전달하세요.',
      icon: Icons.text_snippet_outlined,
      badgeColor: Color(0xFFDBEAFE),
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
  bool _wifiHidden = false;
  bool _wifiPassVisible = false;
  String? _pdfFileName;
  String? _pdfFilePath;

  @override
  void initState() {
    super.initState();
    final initialIndex = _categories.indexWhere((item) => item.type == _type);
    final initialPage = 1000 + (initialIndex < 0 ? 0 : initialIndex);
    _typeController = PageController(viewportFraction: 0.27, initialPage: initialPage);
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
        if (_type == GeneratorType.pdf && _pdfFilePath != null && _urlCtrl.text.trim().isEmpty) {
          payload = _pdfFilePath ?? '';
        } else {
          payload = _urlCtrl.text.trim();
        }
        break;
      case GeneratorType.vcard:
        payload = _buildVCard();
        break;
      case GeneratorType.wifi:
        final ssid = _wifiSsidCtrl.text.trim();
        final pass = _wifiPassCtrl.text.trim();
        final security = _wifiSecurity;
        final hidden = _wifiHidden ? 'H:true;' : '';
        if (security == 'nopass') {
          payload = 'WIFI:T:nopass;S:$ssid;$hidden;';
        } else {
          payload = 'WIFI:T:$security;S:$ssid;P:$pass;$hidden;';
        }
        payload = '$payload;';
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

  void _resetGeneratorState() {
    setState(() {
      _payload = '';
      _qrForegroundColor = Colors.black;
      _qrBackgroundColor = Colors.white;
      _useGradient = false;
      _gradientDirection = GradientDirection.diagonal;
      _gradientIntensity = 0.65;
      _moduleShape = QrDataModuleShape.square;
      _eyeShape = QrEyeShape.square;
      _wifiSecurity = 'WPA';
      _wifiHidden = false;
      _wifiPassVisible = false;
      _pdfFileName = null;
      _pdfFilePath = null;
    });
    _urlCtrl.clear();
    _textCtrl.clear();
    _vNameCtrl.clear();
    _vOrgCtrl.clear();
    _vPhoneCtrl.clear();
    _vEmailCtrl.clear();
    _vUrlCtrl.clear();
    _vNoteCtrl.clear();
    _wifiSsidCtrl.clear();
    _wifiPassCtrl.clear();
    _emailToCtrl.clear();
    _emailSubCtrl.clear();
    _emailBodyCtrl.clear();
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
        return {'url': payload, 'label': 'PDF', if (_pdfFileName != null) 'fileName': _pdfFileName};
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
        return {'label': '와이파이', 'security': _wifiSecurity, 'hidden': _wifiHidden};
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
    final validationMessage = _validationMessage();

    return SafeArea(
      child: LayoutBuilder(
        builder: (context, constraints) {
          return SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(
              16,
              12,
              16,
              24 + MediaQuery.of(context).viewInsets.bottom,
            ),
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight - 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildCategoryCarousel(),
                  const SizedBox(height: 12),
                  _buildInputFormCard(palette),
                  if (validationMessage != null) ...[
                    const SizedBox(height: 8),
                    _buildValidationHint(validationMessage, palette),
                  ],
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: validationMessage == null
                          ? () {
                              FocusScope.of(context).unfocus();
                              _buildPayload();
                            }
                          : null,
                      style: _primaryActionStyle(palette),
                      child: const Text('QR 생성'),
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildPreviewCardLarge(
                    palette: palette,
                    dataStyle: dataStyle,
                    eyeStyle: eyeStyle,
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 48,
                    child: OutlinedButton.icon(
                      onPressed: _payload.isEmpty ? null : _openEditSheet,
                      icon: const Icon(Icons.tune),
                      label: const Text('편집'),
                      style: _secondaryActionStyle(palette),
                    ),
                  ),
                  const SizedBox(height: 10),
                  _buildSaveShareRow(palette),
                ],
              ),
            ),
          );
        },
      ),
    );
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

  Widget _buildCategoryCarousel() {
    return SizedBox(
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
          final scale = (1.0 - (distance * 0.02)).clamp(0.96, 1.0);
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
    );
  }

  Widget _buildInputFormCard(_GeneratorPalette palette) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: palette.surfaceAlt,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: palette.border),
      ),
      child: _buildFormForType(palette),
    );
  }

  Widget _buildFormForType(_GeneratorPalette palette) {
    final labelStyle = TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w600,
      color: palette.secondaryText,
    );
    const textStyle = TextStyle(fontSize: 14);
    final decoration = _compactInputDecoration();
    switch (_type) {
      case GeneratorType.url:
      case GeneratorType.image:
      case GeneratorType.video:
      case GeneratorType.social:
      case GeneratorType.playlist:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('링크', style: labelStyle),
            const SizedBox(height: 6),
            TextField(
              controller: _urlCtrl,
              style: textStyle,
              maxLines: 1,
              decoration: decoration.copyWith(
                hintText: _urlHintForType(),
                suffixIcon: _urlCtrl.text.isEmpty
                    ? null
                    : IconButton(
                        onPressed: () {
                          _urlCtrl.clear();
                          setState(() {});
                        },
                        icon: const Icon(Icons.close, size: 18),
                        tooltip: '입력 지우기',
                      ),
                suffixIconConstraints: const BoxConstraints(minHeight: 32, minWidth: 32),
              ),
              onChanged: (_) => setState(() {}),
            ),
          ],
        );
      case GeneratorType.pdf:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('PDF 링크', style: labelStyle),
            const SizedBox(height: 6),
            TextField(
              controller: _urlCtrl,
              style: textStyle,
              maxLines: 1,
              decoration: decoration.copyWith(
                hintText: _urlHintForType(),
                suffixIcon: _urlCtrl.text.isEmpty
                    ? null
                    : IconButton(
                        onPressed: () {
                          _urlCtrl.clear();
                          setState(() {});
                        },
                        icon: const Icon(Icons.close, size: 18),
                        tooltip: '입력 지우기',
                      ),
                suffixIconConstraints: const BoxConstraints(minHeight: 32, minWidth: 32),
              ),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 12),
            Text('PDF 업로드 (선택)', style: labelStyle),
            const SizedBox(height: 6),
            Row(
              children: [
                OutlinedButton.icon(
                  onPressed: _pickPdfFile,
                  icon: const Icon(Icons.upload_file),
                  label: const Text('파일 선택'),
                  style: _secondaryActionStyle(palette),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _pdfFileName ?? '선택된 파일 없음',
                    style: TextStyle(color: palette.secondaryText, fontSize: 12),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (_pdfFileName != null)
                  IconButton(
                    onPressed: () => setState(() {
                      _pdfFileName = null;
                      _pdfFilePath = null;
                    }),
                    icon: const Icon(Icons.close, size: 18),
                    tooltip: '선택 해제',
                  ),
              ],
            ),
          ],
        );
      case GeneratorType.text:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('내용', style: labelStyle),
            const SizedBox(height: 6),
            TextField(
              controller: _textCtrl,
              maxLines: 2,
              style: textStyle,
              decoration: decoration.copyWith(hintText: '내용을 입력하세요.'),
              onChanged: (_) => setState(() {}),
            ),
          ],
        );
      case GeneratorType.vcard:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('이름', style: labelStyle),
            const SizedBox(height: 6),
            TextField(
              controller: _vNameCtrl,
              style: textStyle,
              decoration: decoration.copyWith(hintText: '이름'),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 10),
            Text('전화번호', style: labelStyle),
            const SizedBox(height: 6),
            TextField(
              controller: _vPhoneCtrl,
              style: textStyle,
              decoration: decoration.copyWith(hintText: '전화번호'),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 10),
            Text('이메일', style: labelStyle),
            const SizedBox(height: 6),
            TextField(
              controller: _vEmailCtrl,
              style: textStyle,
              decoration: decoration.copyWith(hintText: '이메일'),
              onChanged: (_) => setState(() {}),
            ),
          ],
        );
      case GeneratorType.wifi:
        return _buildWifiForm(palette, labelStyle, decoration, textStyle);
      case GeneratorType.email:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('받는 사람', style: labelStyle),
            const SizedBox(height: 6),
            TextField(
              controller: _emailToCtrl,
              style: textStyle,
              decoration: decoration.copyWith(hintText: '받는 사람'),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 10),
            Text('제목', style: labelStyle),
            const SizedBox(height: 6),
            TextField(
              controller: _emailSubCtrl,
              style: textStyle,
              decoration: decoration.copyWith(hintText: '제목'),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 10),
            Text('본문', style: labelStyle),
            const SizedBox(height: 6),
            TextField(
              controller: _emailBodyCtrl,
              maxLines: 3,
              style: textStyle,
              decoration: decoration.copyWith(hintText: '본문'),
              onChanged: (_) => setState(() {}),
            ),
          ],
        );
    }
  }

  Widget _buildWifiForm(
    _GeneratorPalette palette,
    TextStyle labelStyle,
    InputDecoration decoration,
    TextStyle textStyle,
  ) {
    final passwordEnabled = _wifiSecurity != 'nopass';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('SSID', style: labelStyle),
        const SizedBox(height: 6),
        TextField(
          controller: _wifiSsidCtrl,
          style: textStyle,
          decoration: decoration.copyWith(hintText: 'SSID'),
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 10),
        Text('암호화 방식', style: labelStyle),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: _wifiSecurity,
          decoration: decoration,
          items: const [
            DropdownMenuItem(value: 'nopass', child: Text('Open')),
            DropdownMenuItem(value: 'WPA', child: Text('WPA/WPA2')),
            DropdownMenuItem(value: 'WPA3', child: Text('WPA3')),
            DropdownMenuItem(value: 'WEP', child: Text('WEP')),
          ],
          onChanged: (value) {
            if (value == null) return;
            setState(() {
              _wifiSecurity = value;
              if (value == 'nopass') {
                _wifiPassCtrl.clear();
              }
            });
          },
        ),
        const SizedBox(height: 10),
        Text('비밀번호', style: labelStyle),
        const SizedBox(height: 6),
        TextField(
          controller: _wifiPassCtrl,
          style: textStyle,
          obscureText: !_wifiPassVisible,
          enabled: passwordEnabled,
          decoration: decoration.copyWith(
            hintText: passwordEnabled ? '비밀번호 입력' : 'Open 네트워크는 비밀번호가 필요 없습니다',
            suffixIcon: IconButton(
              onPressed: passwordEnabled
                  ? () => setState(() => _wifiPassVisible = !_wifiPassVisible)
                  : null,
              icon: Icon(_wifiPassVisible ? Icons.visibility : Icons.visibility_off, size: 18),
              tooltip: _wifiPassVisible ? '비밀번호 숨기기' : '비밀번호 보기',
            ),
          ),
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Text('숨김 네트워크', style: labelStyle),
            const Spacer(),
            Switch.adaptive(
              value: _wifiHidden,
              onChanged: (value) => setState(() => _wifiHidden = value),
              activeColor: palette.primary,
            ),
          ],
        ),
      ],
    );
  }

  InputDecoration _compactInputDecoration() {
    return const InputDecoration(
      isDense: true,
      constraints: BoxConstraints(minHeight: 44),
      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      border: OutlineInputBorder(borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(borderSide: BorderSide.none),
      focusedBorder: OutlineInputBorder(borderSide: BorderSide.none),
    );
  }

  Widget _buildValidationHint(String message, _GeneratorPalette palette) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: palette.warningBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: palette.border),
      ),
      child: Text(
        message,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: palette.primaryText),
      ),
    );
  }

  String? _validationMessage() {
    switch (_type) {
      case GeneratorType.url:
      case GeneratorType.image:
      case GeneratorType.video:
      case GeneratorType.social:
      case GeneratorType.playlist:
      case GeneratorType.pdf:
        if (_urlCtrl.text.trim().isEmpty && (_type != GeneratorType.pdf || _pdfFilePath == null)) {
          return '링크 또는 파일을 입력해 주세요.';
        }
        return null;
      case GeneratorType.text:
        return _textCtrl.text.trim().isEmpty ? '텍스트를 입력해 주세요.' : null;
      case GeneratorType.vcard:
        if (_vNameCtrl.text.trim().isEmpty &&
            _vPhoneCtrl.text.trim().isEmpty &&
            _vEmailCtrl.text.trim().isEmpty) {
          return '이름, 전화번호, 이메일 중 하나는 입력해 주세요.';
        }
        return null;
      case GeneratorType.wifi:
        if (_wifiSsidCtrl.text.trim().isEmpty) {
          return 'SSID를 입력해 주세요.';
        }
        if (_wifiSecurity != 'nopass' && _wifiPassCtrl.text.trim().isEmpty) {
          return '선택한 보안 방식에는 비밀번호가 필요합니다.';
        }
        return null;
      case GeneratorType.email:
        if (_emailToCtrl.text.trim().isEmpty) {
          return '받는 사람 주소를 입력해 주세요.';
        }
        return null;
    }
  }

  Future<void> _pickPdfFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['pdf'],
    );
    if (result == null || result.files.isEmpty) return;
    final file = result.files.single;
    setState(() {
      _pdfFilePath = file.path;
      _pdfFileName = file.name;
    });
  }

  Future<void> _openEditSheet() async {
    if (_payload.isEmpty) return;
    var draftForeground = _qrForegroundColor;
    var draftBackground = _qrBackgroundColor;
    var draftUseGradient = _useGradient;
    var draftDirection = _gradientDirection;
    var draftIntensity = _gradientIntensity;
    var draftModuleShape = _moduleShape;
    var draftEyeShape = _eyeShape;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        final modalPalette = _generatorPalette(context);
        return StatefulBuilder(
          builder: (context, setStateSheet) {
            final dataStyle = QrDataModuleStyle(
              dataModuleShape: draftModuleShape,
              color: draftForeground,
            );
            final eyeStyle = QrEyeStyle(
              eyeShape: draftEyeShape,
              color: draftForeground,
            );
            return SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Container(
                  decoration: BoxDecoration(
                    color: modalPalette.surface,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: modalPalette.border),
                  ),
                  child: Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                'QR 편집',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: modalPalette.primaryText,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: AspectRatio(
                          aspectRatio: 1,
                          child: _buildQrPreviewBox(
                            palette: modalPalette,
                            payload: _payload,
                            background: draftBackground,
                            useGradient: draftUseGradient,
                            gradientIntensity: draftIntensity,
                            gradientDirection: draftDirection,
                            dataStyle: dataStyle,
                            eyeStyle: eyeStyle,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Expanded(
                        child: SingleChildScrollView(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              _buildEditSectionCard(
                                title: '컬러 편집',
                                palette: modalPalette,
                                child: SizedBox(
                                  height: 150,
                                  child: _buildColorSection(
                                    palette: modalPalette,
                                    foreground: draftForeground,
                                    background: draftBackground,
                                    onForeground: (color) => setStateSheet(() => draftForeground = color),
                                    onBackground: (color) => setStateSheet(() => draftBackground = color),
                                    onCustomForeground: () => _openColorPicker(
                                      title: 'QR 색상',
                                      initial: draftForeground,
                                      onChanged: (color) => setStateSheet(() => draftForeground = color),
                                    ),
                                    onCustomBackground: () => _openColorPicker(
                                      title: '배경색',
                                      initial: draftBackground,
                                      onChanged: (color) => setStateSheet(() => draftBackground = color),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),
                              _buildEditSectionCard(
                                title: '그라데이션',
                                palette: modalPalette,
                                child: _buildGradientSection(
                                  palette: modalPalette,
                                  useGradient: draftUseGradient,
                                  direction: draftDirection,
                                  intensity: draftIntensity,
                                  onToggle: (value) => setStateSheet(() => draftUseGradient = value),
                                  onDirection: (value) => setStateSheet(() => draftDirection = value),
                                  onIntensity: (value) => setStateSheet(() => draftIntensity = value),
                                ),
                              ),
                              const SizedBox(height: 12),
                              _buildEditSectionCard(
                                title: '패턴',
                                palette: modalPalette,
                                child: _buildDesignSection(
                                  palette: modalPalette,
                                  moduleShape: draftModuleShape,
                                  onShape: (value) => setStateSheet(() {
                                    draftModuleShape = value;
                                    draftEyeShape =
                                        value == QrDataModuleShape.circle ? QrEyeShape.circle : QrEyeShape.square;
                                  }),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                        child: Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () => Navigator.pop(context),
                                style: _secondaryActionStyle(modalPalette),
                                child: const Text('취소'),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: ElevatedButton(
                                onPressed: () {
                                  setState(() {
                                    _qrForegroundColor = draftForeground;
                                    _qrBackgroundColor = draftBackground;
                                    _useGradient = draftUseGradient;
                                    _gradientDirection = draftDirection;
                                    _gradientIntensity = draftIntensity;
                                    _moduleShape = draftModuleShape;
                                    _eyeShape = draftEyeShape;
                                  });
                                  Navigator.pop(context);
                                },
                                style: _primaryActionStyle(modalPalette),
                                child: const Text('저장'),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildEditSectionCard({
    required String title,
    required _GeneratorPalette palette,
    required Widget child,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
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
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: palette.primaryText),
          ),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }

  Widget _buildPreviewCardLarge({
    required _GeneratorPalette palette,
    required QrDataModuleStyle dataStyle,
    required QrEyeStyle eyeStyle,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: palette.border),
        boxShadow: [
          BoxShadow(
            color: palette.shadow,
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  '미리보기',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: palette.primaryText),
                ),
              ),
              IconButton(
                onPressed: _resetGeneratorState,
                icon: Icon(Icons.refresh, size: 18, color: palette.primaryText),
                tooltip: '초기화',
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                padding: EdgeInsets.zero,
              ),
            ],
          ),
          const SizedBox(height: 8),
          AspectRatio(
            aspectRatio: 1,
            child: _buildQrPreviewBox(
              palette: palette,
              payload: _payload,
              background: _qrBackgroundColor,
              useGradient: _useGradient,
              gradientIntensity: _gradientIntensity,
              gradientDirection: _gradientDirection,
              dataStyle: dataStyle,
              eyeStyle: eyeStyle,
              repaintKey: _qrKey,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQrPreviewBox({
    required _GeneratorPalette palette,
    required String payload,
    required Color background,
    required bool useGradient,
    required double gradientIntensity,
    required GradientDirection gradientDirection,
    required QrDataModuleStyle dataStyle,
    required QrEyeStyle eyeStyle,
    Key? repaintKey,
  }) {
    final gradient = useGradient
        ? LinearGradient(
            colors: [
              background,
              background.withOpacity(gradientIntensity),
            ],
            begin: _gradientBegin(gradientDirection),
            end: _gradientEnd(gradientDirection),
          )
        : null;

    return RepaintBoundary(
      key: repaintKey,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: useGradient ? Colors.transparent : background,
          borderRadius: BorderRadius.circular(20),
          gradient: gradient,
          border: Border.all(color: palette.border),
        ),
        child: payload.isEmpty
            ? Center(
                child: Text(
                  '입력 후 생성',
                  style: TextStyle(color: palette.mutedText, fontWeight: FontWeight.w500),
                ),
              )
            : QrImageView(
                data: payload,
                size: 200,
                backgroundColor: useGradient ? Colors.transparent : background,
                dataModuleStyle: dataStyle,
                eyeStyle: eyeStyle,
              ),
      ),
    );
  }

  Widget _buildSaveShareRow(_GeneratorPalette palette) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: palette.surfaceAlt,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: palette.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: ElevatedButton.icon(
              onPressed: _payload.isEmpty ? null : _saveQr,
              icon: const Icon(Icons.save_alt),
              label: const Text('저장'),
              style: _primaryActionStyle(palette).copyWith(
                padding: MaterialStateProperty.all(
                  const EdgeInsets.symmetric(vertical: 12),
                ),
                textStyle: MaterialStateProperty.all(
                  const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                ),
                foregroundColor: MaterialStateProperty.all(Colors.white),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: OutlinedButton.icon(
              onPressed: _payload.isEmpty ? null : _shareQr,
              icon: const Icon(Icons.share),
              label: const Text('공유'),
              style: _secondaryActionStyle(palette).copyWith(
                padding: MaterialStateProperty.all(
                  const EdgeInsets.symmetric(vertical: 12),
                ),
                textStyle: MaterialStateProperty.all(
                  const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                ),
                foregroundColor: MaterialStateProperty.all(palette.primaryText),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildColorSection({
    required _GeneratorPalette palette,
    required Color foreground,
    required Color background,
    required ValueChanged<Color> onForeground,
    required ValueChanged<Color> onBackground,
    required VoidCallback onCustomForeground,
    required VoidCallback onCustomBackground,
  }) {
    final labelStyle = TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w500,
      color: palette.secondaryText,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: _buildColorPresetBlock(
            title: 'QR 색상',
            selected: foreground,
            palette: _presetColors,
            labelStyle: labelStyle,
            paletteTokens: palette,
            onSelect: onForeground,
            onCustom: onCustomForeground,
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: _buildColorPresetBlock(
            title: '배경색',
            selected: background,
            palette: _presetColors,
            labelStyle: labelStyle,
            paletteTokens: palette,
            onSelect: onBackground,
            onCustom: onCustomBackground,
          ),
        ),
      ],
    );
  }

  Widget _buildGradientSection({
    required _GeneratorPalette palette,
    required bool useGradient,
    required GradientDirection direction,
    required double intensity,
    required ValueChanged<bool> onToggle,
    required ValueChanged<GradientDirection> onDirection,
    required ValueChanged<double> onIntensity,
  }) {
    final labelStyle = TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w500,
      color: palette.secondaryText,
    );
    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxHeight < 140;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text('기본 OFF', style: labelStyle),
                const SizedBox(width: 8),
                Transform.scale(
                  scale: 1.15,
                  child: Switch.adaptive(
                    value: useGradient,
                    onChanged: onToggle,
                    activeColor: palette.primary,
                    activeTrackColor: palette.primary.withOpacity(0.3),
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ),
              ],
            ),
            SizedBox(height: compact ? 4 : 8),
            Opacity(
              opacity: useGradient ? 1 : 0.5,
              child: AbsorbPointer(
                absorbing: !useGradient,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (!compact) ...[
                      Text('방향', style: labelStyle),
                      const SizedBox(height: 4),
                    ],
                    _buildSegmentedRow<GradientDirection>(
                      palette: palette,
                      options: const [
                        _SegmentOption(value: GradientDirection.diagonal, label: '대각선'),
                        _SegmentOption(value: GradientDirection.vertical, label: '수직'),
                        _SegmentOption(value: GradientDirection.horizontal, label: '수평'),
                      ],
                      selected: direction,
                      onSelected: onDirection,
                      size: _SegmentSize.small,
                      alignment: WrapAlignment.center,
                    ),
                    SizedBox(height: compact ? 4 : 8),
                    if (!compact)
                      Row(
                        children: [
                          Text('강도', style: labelStyle),
                          const SizedBox(width: 6),
                          Text(
                            '${(intensity * 100).round()}%',
                            style: labelStyle,
                          ),
                        ],
                      ),
                    SizedBox(height: compact ? 4 : 6),
                    SliderTheme(
                      data: SliderTheme.of(context).copyWith(
                        trackHeight: 2,
                        thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                        overlayShape: const RoundSliderOverlayShape(overlayRadius: 12),
                      ),
                      child: Slider(
                        value: intensity,
                        min: 0.2,
                        max: 1.0,
                        activeColor: palette.primary,
                        inactiveColor: palette.border,
                        onChanged: onIntensity,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildDesignSection({
    required _GeneratorPalette palette,
    required QrDataModuleShape moduleShape,
    required ValueChanged<QrDataModuleShape> onShape,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSegmentedRow<QrDataModuleShape>(
          palette: palette,
          options: const [
            _SegmentOption(value: QrDataModuleShape.square, label: '클래식'),
            _SegmentOption(value: QrDataModuleShape.circle, label: '라운드'),
          ],
          selected: moduleShape,
          onSelected: onShape,
          size: _SegmentSize.large,
          alignment: WrapAlignment.center,
        ),
      ],
    );
  }

  Widget _buildColorPresetBlock({
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
            Expanded(
              child: Text(title, style: labelStyle, maxLines: 1, overflow: TextOverflow.ellipsis),
            ),
            Text('기본', style: labelStyle),
            const SizedBox(width: 6),
            Container(
              width: 16,
              height: 16,
              decoration: BoxDecoration(
                color: selected,
                shape: BoxShape.circle,
                border: Border.all(color: paletteTokens.border),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
            decoration: BoxDecoration(
              color: paletteTokens.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: paletteTokens.border),
            ),
            child: _buildPresetRow(
              palette: palette,
              selected: selected,
              paletteTokens: paletteTokens,
              onSelect: onSelect,
              onCustom: onCustom,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPresetRow({
    required List<Color> palette,
    required Color selected,
    required _GeneratorPalette paletteTokens,
    required ValueChanged<Color> onSelect,
    required VoidCallback onCustom,
  }) {
    return ListView.separated(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      padding: EdgeInsets.zero,
      itemCount: palette.length + 1,
      separatorBuilder: (_, __) => const SizedBox(width: 8),
      itemBuilder: (context, index) {
        if (index == 0) {
          return InkWell(
            onTap: onCustom,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: paletteTokens.surfaceAlt,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: paletteTokens.border),
              ),
              child: Icon(Icons.add, size: 18, color: paletteTokens.primaryText),
            ),
          );
        }
        final color = palette[index - 1];
        return _ColorDot(
          color: color,
          selected: selected.value == color.value,
          palette: paletteTokens,
          onTap: () => onSelect(color),
        );
      },
    );
  }

  Widget _buildSegmentedRow<T>({
    required _GeneratorPalette palette,
    required List<_SegmentOption<T>> options,
    required T selected,
    required ValueChanged<T> onSelected,
    _SegmentSize size = _SegmentSize.medium,
    WrapAlignment alignment = WrapAlignment.start,
  }) {
    return Wrap(
      alignment: alignment,
      runAlignment: alignment,
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final option in options)
          _SegmentedButton<T>(
            option: option,
            selected: option.value == selected,
            palette: palette,
            onSelected: onSelected,
            size: size,
          ),
      ],
    );
  }

  Future<void> _openColorPicker({
    required String title,
    required Color initial,
    required ValueChanged<Color> onChanged,
  }) async {
    var current = initial;
    final hexController = TextEditingController(text: colorToHex(current, includeHashSign: true));
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateSheet) {
            return SafeArea(
              child: Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 12),
                    ColorPicker(
                      pickerColor: current,
                      onColorChanged: (color) => setStateSheet(() {
                        current = color;
                        hexController.text = colorToHex(color, includeHashSign: true);
                      }),
                      colorPickerWidth: 280,
                      pickerAreaHeightPercent: 0.75,
                      enableAlpha: false,
                      displayThumbColor: true,
                      hexInputController: hexController,
                      portraitOnly: true,
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: current,
                            shape: BoxShape.circle,
                            border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextField(
                            controller: hexController,
                            decoration: const InputDecoration(
                              labelText: 'HEX',
                              isDense: true,
                              border: OutlineInputBorder(),
                            ),
                            onSubmitted: (value) {
                              final parsed = _parseHexColor(value);
                              if (parsed != null) {
                                setStateSheet(() => current = parsed);
                              }
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          onChanged(current);
                          Navigator.pop(context);
                        },
                        child: const Text('적용'),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Color? _parseHexColor(String input) {
    final value = input.replaceAll('#', '').trim();
    if (value.length != 6 && value.length != 8) return null;
    final buffer = StringBuffer();
    if (value.length == 6) buffer.write('ff');
    buffer.write(value);
    final hex = int.tryParse(buffer.toString(), radix: 16);
    if (hex == null) return null;
    return Color(hex);
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
        const SizedBox(height: 14),
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

  Alignment _gradientBegin(GradientDirection direction) {
    switch (direction) {
      case GradientDirection.vertical:
        return Alignment.topCenter;
      case GradientDirection.horizontal:
        return Alignment.centerLeft;
      case GradientDirection.diagonal:
        return Alignment.topLeft;
    }
  }

  Alignment _gradientEnd(GradientDirection direction) {
    switch (direction) {
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
            ? palette.primary.withOpacity(0.25)
            : palette.primary,
      ),
      foregroundColor: MaterialStateProperty.resolveWith(
        (states) => states.contains(MaterialState.disabled)
            ? Colors.white.withOpacity(0.8)
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
            ? palette.primaryText.withOpacity(0.75)
            : palette.primaryText,
      ),
      backgroundColor: MaterialStateProperty.resolveWith(
        (states) => states.contains(MaterialState.disabled)
            ? palette.surfaceAlt.withOpacity(0.8)
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

enum _SegmentSize { small, medium, large }

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
    required this.size,
  });

  final _SegmentOption<T> option;
  final bool selected;
  final _GeneratorPalette palette;
  final ValueChanged<T> onSelected;
  final _SegmentSize size;

  @override
  Widget build(BuildContext context) {
    final background = selected ? palette.primary.withOpacity(0.2) : palette.surfaceAlt;
    final borderColor = selected ? palette.primary : palette.border;
    final textColor = selected ? Colors.white : palette.secondaryText;
    final padding = switch (size) {
      _SegmentSize.small => const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      _SegmentSize.large => const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
      _SegmentSize.medium => const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
    };
    final fontSize = switch (size) {
      _SegmentSize.small => 11.0,
      _SegmentSize.large => 14.0,
      _SegmentSize.medium => 12.0,
    };

    return InkWell(
      onTap: () => onSelected(option.value),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: padding,
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
            fontSize: fontSize,
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
        width: 26,
        height: 26,
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
        margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(14),
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
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: selected ? colorScheme.primary : colorScheme.outlineVariant,
          width: 1,
        ),
      ),
      child: Icon(icon, size: 22, color: colorScheme.primary),
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
