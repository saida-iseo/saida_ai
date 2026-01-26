import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:image_gallery_saver/image_gallery_saver.dart';
import 'package:image_picker/image_picker.dart';
import 'package:qr_barcode_scan/features/generator/models/qr_design.dart';
import 'package:qr_barcode_scan/features/generator/models/qr_type.dart';
import 'package:qr_barcode_scan/features/generator/services/payload_builder.dart';
import 'package:qr_barcode_scan/features/generator/services/upload_service.dart';
import 'package:qr_barcode_scan/features/generator/widgets/design_editor_sheet.dart';
import 'package:qr_barcode_scan/features/generator/widgets/qr_preview_card.dart';
import 'package:qr_barcode_scan/models/history_item.dart';
import 'package:qr_barcode_scan/storage/local_storage.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';

class QrFormScreen extends StatefulWidget {
  const QrFormScreen({
    super.key,
    required this.type,
    this.initialText,
    this.autoApply = false,
  });

  final QrType type;
  final String? initialText;
  final bool autoApply;

  @override
  State<QrFormScreen> createState() => _QrFormScreenState();
}

class _QrFormScreenState extends State<QrFormScreen> {
  late QrDesign _design;
  final _uploadService = UploadService();
  String _payload = '';
  bool _uploading = false;
  final GlobalKey _qrKey = GlobalKey();

  // Common controllers
  final _urlCtrl = TextEditingController();
  final _pdfLinkCtrl = TextEditingController();
  final _imageLinkCtrl = TextEditingController();
  final _videoLinkCtrl = TextEditingController();
  final _vNameCtrl = TextEditingController();
  final _vPhoneCtrl = TextEditingController();
  final _vOrgCtrl = TextEditingController();
  final _vTitleCtrl = TextEditingController();
  final _vEmailCtrl = TextEditingController();
  final _vWebsiteCtrl = TextEditingController();
  final _vAddressCtrl = TextEditingController();
  final _fbUrlCtrl = TextEditingController();
  final _igUserCtrl = TextEditingController();
  final _waPhoneCtrl = TextEditingController();
  final _appAndroidCtrl = TextEditingController();
  final _appIosCtrl = TextEditingController();
  final _wifiSsidCtrl = TextEditingController();
  final _wifiPassCtrl = TextEditingController();
  bool _wifiHidden = false;
  String _wifiSecurity = 'WPA';
  bool _wifiPassVisible = false;
  String? _pickedImagePath;
  String? _pickedPdfPath;
  String? _uploadedImageUrl;
  String? _uploadedPdfUrl;

  @override
  void initState() {
    super.initState();
    _design = QrDesign(
      foreground: Colors.black,
      background: Colors.white,
      pattern: QrPattern.classic,
    );
    if (widget.initialText != null && widget.initialText!.isNotEmpty) {
      switch (widget.type) {
        case QrType.website:
          _urlCtrl.text = widget.initialText!;
          break;
        case QrType.pdf:
          _pdfLinkCtrl.text = widget.initialText!;
          break;
        case QrType.image:
          _imageLinkCtrl.text = widget.initialText!;
          break;
        case QrType.youtube:
          _videoLinkCtrl.text = widget.initialText!;
          break;
        default:
          break;
      }
      if (widget.autoApply) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            _applyPayload();
          }
        });
      }
    }
  }

  @override
  void dispose() {
    for (final c in [
      _urlCtrl,
      _pdfLinkCtrl,
      _imageLinkCtrl,
      _videoLinkCtrl,
      _vNameCtrl,
      _vPhoneCtrl,
      _vOrgCtrl,
      _vTitleCtrl,
      _vEmailCtrl,
      _vWebsiteCtrl,
      _vAddressCtrl,
      _fbUrlCtrl,
      _igUserCtrl,
      _waPhoneCtrl,
      _appAndroidCtrl,
      _appIosCtrl,
      _wifiSsidCtrl,
      _wifiPassCtrl,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final meta = metaOf(widget.type);
    return Scaffold(
      appBar: AppBar(title: Text(meta.name)),
      body: SafeArea(
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
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight - 12,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    RepaintBoundary(
                      key: _qrKey,
                      child: QrPreviewCard(payload: _payload, design: _design),
                    ),
                    const SizedBox(height: 14),
                    _buildForm(context),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: _resetForm,
                            child: const Text('초기화'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _uploading ? null : _applyPayload,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF2F80ED),
                              foregroundColor: Colors.white,
                            ),
                            child: Text(
                              widget.type == QrType.image ||
                                      widget.type == QrType.pdf
                                  ? '첨부완료'
                                  : '입력 완료',
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _buildActionRow(context),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildActionRow(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: _openDesignEditor,
            child: const Text('편집'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: OutlinedButton(
            onPressed: _payload.isEmpty ? null : _saveQr,
            child: const Text('저장'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton(
            onPressed: _payload.isEmpty ? null : _shareQr,
            child: const Text('공유'),
          ),
        ),
      ],
    );
  }

  Widget _buildForm(BuildContext context) {
    switch (widget.type) {
      case QrType.website:
        return _buildSingleUrlField(
          '웹사이트 주소 (입력 필요)',
          _urlCtrl,
          'https://example.com',
        );
      case QrType.pdf:
        return _buildPdfForm();
      case QrType.vcard:
        return _buildVCardForm();
      case QrType.image:
        return _buildImageForm();
      case QrType.facebook:
        return _buildFacebookForm();
      case QrType.instagram:
        return _buildInstagramForm();
      case QrType.whatsapp:
        return _buildWhatsappForm();
      case QrType.appRedirect:
        return _buildAppRedirectForm();
      case QrType.wifi:
        return _buildWifiForm();
      case QrType.youtube:
        return _buildYoutubeForm();
    }
  }

  Widget _buildSingleUrlField(
    String label,
    TextEditingController controller,
    String hint,
  ) {
    return _FieldCard(
      children: [
        _Label(label),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          decoration: _inputDecoration(hint),
          keyboardType: TextInputType.url,
        ),
      ],
    );
  }

  Widget _buildPdfForm() {
    final pickedLabel =
        _pickedPdfPath != null ? _pickedPdfPath!.split('/').last : null;
    return _FieldCard(
      children: [
        _Label('PDF 첨부'),
        const SizedBox(height: 8),
        ElevatedButton.icon(
          onPressed: _uploading ? null : _pickLocalPdf,
          icon: const Icon(Icons.picture_as_pdf),
          label: const Text('PDF 선택'),
        ),
        const SizedBox(height: 8),
        Text(
          pickedLabel ?? '선택된 파일 없음',
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 12),
        ),
        const SizedBox(height: 6),
        const Text(
          'PDF 파일을 선택하세요.',
          style: TextStyle(fontSize: 11, color: Colors.grey),
        ),
      ],
    );
  }

  Widget _buildImageForm() {
    final pickedLabel =
        _pickedImagePath != null ? _pickedImagePath!.split('/').last : null;
    return _FieldCard(
      children: [
        _Label('이미지 첨부'),
        const SizedBox(height: 8),
        Row(
          children: [
            ElevatedButton.icon(
              onPressed: _uploading ? null : _pickLocalImage,
              icon: const Icon(Icons.photo),
              label: const Text('이미지 선택'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          pickedLabel ?? '선택된 파일 없음',
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 12),
        ),
        const SizedBox(height: 6),
        const Text(
          '갤러리에서 이미지를 선택하세요.',
          style: TextStyle(fontSize: 11, color: Colors.grey),
        ),
      ],
    );
  }

  Widget _buildYoutubeForm() {
    return _FieldCard(
      children: [
        _Label('YouTube URL'),
        const SizedBox(height: 6),
        TextField(
          controller: _videoLinkCtrl,
          decoration: _inputDecoration('https://youtu.be/...'),
          keyboardType: TextInputType.url,
        ),
        const SizedBox(height: 6),
        const Text(
          '영상/채널 링크를 입력하세요.',
          style: TextStyle(fontSize: 11, color: Colors.grey),
        ),
      ],
    );
  }

  Widget _buildVCardForm() {
    return _FieldCard(
      children: [
        _Label('이름*'),
        const SizedBox(height: 6),
        TextField(controller: _vNameCtrl, decoration: _inputDecoration('홍길동')),
        const SizedBox(height: 10),
        _Label('전화번호*'),
        const SizedBox(height: 6),
        TextField(
          controller: _vPhoneCtrl,
          decoration: _inputDecoration('010-1234-5678'),
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 10),
        _Label('회사/직책'),
        const SizedBox(height: 6),
        TextField(controller: _vOrgCtrl, decoration: _inputDecoration('회사명')),
        const SizedBox(height: 10),
        _Label('직함'),
        const SizedBox(height: 6),
        TextField(controller: _vTitleCtrl, decoration: _inputDecoration('팀장')),
        const SizedBox(height: 10),
        _Label('이메일'),
        const SizedBox(height: 6),
        TextField(
          controller: _vEmailCtrl,
          decoration: _inputDecoration('you@example.com'),
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 10),
        _Label('웹사이트'),
        const SizedBox(height: 6),
        TextField(
          controller: _vWebsiteCtrl,
          decoration: _inputDecoration('https://example.com'),
          keyboardType: TextInputType.url,
        ),
        const SizedBox(height: 10),
        _Label('주소'),
        const SizedBox(height: 6),
        TextField(
          controller: _vAddressCtrl,
          decoration: _inputDecoration('서울시 ...'),
        ),
      ],
    );
  }

  Widget _buildFacebookForm() {
    return _FieldCard(
      children: [
        _Label('Facebook 사용자 이름 또는 URL*'),
        const SizedBox(height: 6),
        TextField(
          controller: _fbUrlCtrl,
          decoration: _inputDecoration('zuck 또는 https://facebook.com/...'),
          keyboardType: TextInputType.url,
        ),
        const SizedBox(height: 10),
        const Text(
          '입력 시 https://www.facebook.com/username 로 변환됩니다.',
          style: TextStyle(fontSize: 11, color: Colors.grey),
        ),
      ],
    );
  }

  Widget _buildInstagramForm() {
    return _FieldCard(
      children: [
        _Label('@사용자 이름*'),
        const SizedBox(height: 6),
        TextField(
          controller: _igUserCtrl,
          decoration: _inputDecoration('@username'),
        ),
        const SizedBox(height: 6),
        const Text(
          '입력 시 자동으로 https://www.instagram.com/username/ 로 변환됩니다.',
          style: TextStyle(fontSize: 11, color: Colors.grey),
        ),
      ],
    );
  }

  Widget _buildWhatsappForm() {
    return _FieldCard(
      children: [
        _Label('전화번호* (국가코드 포함 권장)'),
        const SizedBox(height: 6),
        TextField(
          controller: _waPhoneCtrl,
          decoration: _inputDecoration('+821012345678'),
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 6),
        const Text(
          '숫자/+, 공백 제거 후 wa.me 링크로 변환됩니다.',
          style: TextStyle(fontSize: 11, color: Colors.grey),
        ),
      ],
    );
  }

  Widget _buildAppRedirectForm() {
    return _FieldCard(
      children: [
        _Label('구글 플레이 URL'),
        const SizedBox(height: 6),
        TextField(
          controller: _appAndroidCtrl,
          decoration: _inputDecoration('https://play.google.com/...'),
          keyboardType: TextInputType.url,
        ),
        const SizedBox(height: 6),
        const Text(
          '스토어 상세 페이지 링크를 입력하세요.',
          style: TextStyle(fontSize: 11, color: Colors.grey),
        ),
        const SizedBox(height: 12),
        _Label('애플 앱스토어 URL'),
        const SizedBox(height: 6),
        TextField(
          controller: _appIosCtrl,
          decoration: _inputDecoration('https://apps.apple.com/...'),
          keyboardType: TextInputType.url,
        ),
        const SizedBox(height: 6),
        const Text(
          '스토어 상세 페이지 링크를 입력하세요.',
          style: TextStyle(fontSize: 11, color: Colors.grey),
        ),
        const SizedBox(height: 8),
        const Text(
          '플레이스토어 또는 앱스토어 링크 중 하나 이상 입력하세요.',
          style: TextStyle(fontSize: 11, color: Colors.grey),
        ),
      ],
    );
  }

  Widget _buildWifiForm() {
    return _FieldCard(
      children: [
        _Label('네트워크 이름 (SSID)*'),
        const SizedBox(height: 6),
        TextField(
          controller: _wifiSsidCtrl,
          decoration: _inputDecoration('MyWiFi'),
        ),
        const SizedBox(height: 10),
        _Label('암호화 방식'),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          initialValue: _wifiSecurity,
          decoration: _inputDecoration(null),
          items: const [
            DropdownMenuItem(value: 'WPA', child: Text('WPA/WPA2')),
            DropdownMenuItem(value: 'WEP', child: Text('WEP')),
            DropdownMenuItem(value: 'WPA2-EAP', child: Text('WPA-EAP')),
            DropdownMenuItem(value: 'nopass', child: Text('비밀번호 없음')),
          ],
          onChanged: (value) {
            if (value == null) return;
            setState(() {
              _wifiSecurity = value;
              if (value == 'nopass') _wifiPassCtrl.clear();
            });
          },
        ),
        const SizedBox(height: 10),
        _Label('비밀번호'),
        const SizedBox(height: 6),
        TextField(
          controller: _wifiPassCtrl,
          enabled: _wifiSecurity != 'nopass',
          obscureText: !_wifiPassVisible,
          decoration:
              _inputDecoration(
                _wifiSecurity == 'nopass' ? '비밀번호 없음 선택됨' : '비밀번호 입력',
              ).copyWith(
                suffixIcon: IconButton(
                  icon: Icon(
                    _wifiPassVisible ? Icons.visibility : Icons.visibility_off,
                  ),
                  onPressed: _wifiSecurity == 'nopass'
                      ? null
                      : () => setState(
                          () => _wifiPassVisible = !_wifiPassVisible,
                        ),
                ),
              ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            const Text('숨김 네트워크'),
            const Spacer(),
            Switch.adaptive(
              value: _wifiHidden,
              onChanged: (v) => setState(() {
                _wifiHidden = v;
              }),
            ),
          ],
        ),
      ],
    );
  }

  InputDecoration _inputDecoration(String? hint) {
    return InputDecoration(
      hintText: hint,
      isDense: true,
      filled: true,
      fillColor: Theme.of(context).colorScheme.surfaceContainerHighest,
      border: OutlineInputBorder(
        borderSide: BorderSide.none,
        borderRadius: BorderRadius.circular(14),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
    );
  }

  void _showSnack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _pickLocalImage() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.gallery);
    if (image == null) return;
    final dir = await getApplicationDocumentsDirectory();
    final ext = image.path.split('.').last;
    final filename = 'qr_image_${DateTime.now().millisecondsSinceEpoch}.$ext';
    final savedPath = '${dir.path}/$filename';
    await File(image.path).copy(savedPath);
    if (!mounted) return;
    setState(() {
      _pickedImagePath = savedPath;
      _imageLinkCtrl.clear();
      _uploadedImageUrl = null;
    });
  }

  Future<void> _pickLocalPdf() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
    );
    if (result == null || result.files.isEmpty) return;
    final path = result.files.single.path;
    if (path == null) return;
    final dir = await getApplicationDocumentsDirectory();
    final filename = 'qr_pdf_${DateTime.now().millisecondsSinceEpoch}.pdf';
    final savedPath = '${dir.path}/$filename';
    await File(path).copy(savedPath);
    if (!mounted) return;
    setState(() {
      _pickedPdfPath = savedPath;
      _pdfLinkCtrl.clear();
      _uploadedPdfUrl = null;
    });
  }

  Future<bool> _ensureImageUpload() async {
    if (_uploadedImageUrl != null && _uploadedImageUrl!.isNotEmpty) {
      return true;
    }
    if (_pickedImagePath == null) {
      _showSnack('이미지를 선택해 주세요.');
      return false;
    }
    setState(() {
      _uploading = true;
    });
    try {
      final url = await _uploadService.uploadFile(File(_pickedImagePath!));
      if (!mounted) return false;
      setState(() {
        _uploadedImageUrl = url;
        _imageLinkCtrl.text = url;
      });
      return true;
    } catch (e) {
      if (!mounted) return false;
      final message = e.toString().replaceFirst('Exception: ', '');
      _showSnack(message.isEmpty ? '이미지 업로드에 실패했습니다.' : message);
      return false;
    } finally {
      if (mounted) {
        setState(() {
          _uploading = false;
        });
      }
    }
  }

  Future<bool> _ensurePdfUpload() async {
    if (_uploadedPdfUrl != null && _uploadedPdfUrl!.isNotEmpty) {
      return true;
    }
    if (_pickedPdfPath == null) {
      _showSnack('PDF를 선택해 주세요.');
      return false;
    }
    setState(() {
      _uploading = true;
    });
    try {
      final url = await _uploadService.uploadFile(File(_pickedPdfPath!));
      if (!mounted) return false;
      setState(() {
        _uploadedPdfUrl = url;
        _pdfLinkCtrl.text = url;
      });
      return true;
    } catch (e) {
      if (!mounted) return false;
      final message = e.toString().replaceFirst('Exception: ', '');
      _showSnack(message.isEmpty ? 'PDF 업로드에 실패했습니다.' : message);
      return false;
    } finally {
      if (mounted) {
        setState(() {
          _uploading = false;
        });
      }
    }
  }

  PayloadType _payloadTypeFor(QrType type) {
    switch (type) {
      case QrType.website:
        return PayloadType.url;
      case QrType.pdf:
        return PayloadType.pdf;
      case QrType.image:
        return PayloadType.image;
      case QrType.youtube:
        return PayloadType.video;
      case QrType.facebook:
      case QrType.instagram:
      case QrType.whatsapp:
        return PayloadType.social;
      case QrType.vcard:
        return PayloadType.vcard;
      case QrType.appRedirect:
        return PayloadType.url;
      case QrType.wifi:
        return PayloadType.wifi;
    }
  }

  Future<void> _recordGeneratedHistory() async {
    final result = _buildPayload();
    if (result == null) return;
    final now = DateTime.now();
    await LocalStorage.addHistory(
      HistoryItem(
        id: now.millisecondsSinceEpoch.toString(),
        source: HistorySource.generate,
        type: _payloadTypeFor(widget.type),
        value: result.payload,
        createdAt: now,
        meta: <String, dynamic>{...result.displayMeta},
      ),
    );
  }

  Future<void> _pickAndUpload({
    required List<String> extensions,
    required int maxBytes,
    required ValueChanged<String> onUrl,
    bool allowMemoryUpload = false,
  }) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: extensions,
      withData: allowMemoryUpload,
    );
    if (result == null || result.files.isEmpty) return;
    final file = result.files.single;
    if (file.size > maxBytes) {
      _showSnack('파일 크기가 제한을 초과했습니다.');
      return;
    }
    setState(() {
      _uploading = true;
    });
    try {
      String url;
      if (file.path != null) {
        url = await _uploadService.uploadFile(File(file.path!));
      } else if (allowMemoryUpload && file.bytes != null) {
        url = await _uploadService.uploadBytes(file.bytes!, file.name);
      } else {
        _showSnack('파일 경로를 찾을 수 없습니다.');
        return;
      }
      onUrl(url);
    } catch (e) {
      _showSnack('업로드에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setState(() {
        _uploading = false;
      });
    }
  }

  PayloadBuildResult? _buildPayload() {
    Map<String, dynamic> data;
    switch (widget.type) {
      case QrType.website:
        data = {'url': _sanitizeUrl(_urlCtrl.text)};
        break;
      case QrType.pdf:
        data = {
          'url': _sanitizeUrl(
            _pdfLinkCtrl.text.isNotEmpty
                ? _pdfLinkCtrl.text
                : (_uploadedPdfUrl ?? ''),
          ),
        };
        break;
      case QrType.image:
        data = {
          'url': _sanitizeUrl(
            _imageLinkCtrl.text.isNotEmpty
                ? _imageLinkCtrl.text
                : (_uploadedImageUrl ?? ''),
          ),
        };
        break;
      case QrType.youtube:
        data = {'url': _sanitizeUrl(_videoLinkCtrl.text)};
        break;
      case QrType.vcard:
        data = {
          'name': _vNameCtrl.text.trim(),
          'phone': _vPhoneCtrl.text.trim(),
          'org': _vOrgCtrl.text.trim(),
          'title': _vTitleCtrl.text.trim(),
          'email': _vEmailCtrl.text.trim(),
          'website': _vWebsiteCtrl.text.trim(),
          'address': _vAddressCtrl.text.trim(),
        };
        break;
      case QrType.facebook:
        data = {
          'handle': _fbUrlCtrl.text.trim(),
        };
        break;
      case QrType.instagram:
        data = {'username': _igUserCtrl.text.trim()};
        break;
      case QrType.whatsapp:
        data = {'phone': _waPhoneCtrl.text.trim()};
        break;
      case QrType.appRedirect:
        data = {
          'name': '',
          'description': '',
          'androidUrl': _sanitizeUrl(_appAndroidCtrl.text),
          'iosUrl': _sanitizeUrl(_appIosCtrl.text),
        };
        break;
      case QrType.wifi:
        data = {
          'ssid': _wifiSsidCtrl.text.trim(),
          'security': _wifiSecurity,
          'password': _wifiPassCtrl.text,
          'hidden': _wifiHidden,
        };
        break;
    }

    return QrPayloadBuilder.build(widget.type, data);
  }

  void _resetForm() {
    for (final c in [
      _urlCtrl,
      _pdfLinkCtrl,
      _imageLinkCtrl,
      _videoLinkCtrl,
      _vNameCtrl,
      _vPhoneCtrl,
      _vOrgCtrl,
      _vTitleCtrl,
      _vEmailCtrl,
      _vWebsiteCtrl,
      _vAddressCtrl,
      _fbUrlCtrl,
      _igUserCtrl,
      _waPhoneCtrl,
      _appAndroidCtrl,
      _appIosCtrl,
      _wifiSsidCtrl,
      _wifiPassCtrl,
    ]) {
      c.clear();
    }
    setState(() {
      _payload = '';
      _pickedImagePath = null;
      _pickedPdfPath = null;
      _uploadedImageUrl = null;
      _uploadedPdfUrl = null;
      _wifiHidden = false;
      _wifiSecurity = 'WPA';
      _wifiPassVisible = false;
    });
  }

  Future<void> _applyPayload() async {
    if (_uploading) return;
    if (widget.type == QrType.image) {
      final ok = await _ensureImageUpload();
      if (!ok) return;
    } else if (widget.type == QrType.pdf) {
      final ok = await _ensurePdfUpload();
      if (!ok) return;
    }
    final result = _buildPayload();
    if (result == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('필수 입력을 확인해주세요.')));
      return;
    }
    if (!mounted) return;
    setState(() {
      _payload = result.payload;
    });
  }

  String _sanitizeUrl(String input) {
    final text = input.trim();
    if (text.isEmpty) return '';
    if (text.startsWith('http://') || text.startsWith('https://')) return text;
    return 'https://$text';
  }

  Future<void> _openDesignEditor() async {
    final original = _design;
    final updated = await showDesignEditor(
      context: context,
      initial: _design,
      onChanged: (next) {
        if (mounted) {
          setState(() => _design = next);
        }
      },
    );
    if (updated != null) {
      setState(() => _design = updated);
    } else if (mounted) {
      setState(() => _design = original);
    }
  }

  Future<Uint8List?> _captureQrPng() async {
    final boundary =
        _qrKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
    if (boundary == null) return null;
    final image = await boundary.toImage(pixelRatio: 3);
    final data = await image.toByteData(format: ui.ImageByteFormat.png);
    return data?.buffer.asUint8List();
  }

  Future<void> _shareQr() async {
    _playFeedback();
    final bytes = await _captureQrPng();
    if (bytes == null) return;
    final tempDir = await getTemporaryDirectory();
    final file = File('${tempDir.path}/qr_code.png');
    await file.writeAsBytes(bytes);
    await _recordGeneratedHistory();
    await Share.shareXFiles([XFile(file.path)], text: 'QR Code');
  }

  Future<void> _saveQr() async {
    _playFeedback();
    final bytes = await _captureQrPng();
    if (bytes == null) return;
    if (Platform.isIOS) {
      await Permission.photos.request();
    } else {
      await Permission.storage.request();
    }
    final result = await ImageGallerySaver.saveImage(
      bytes,
      quality: 100,
      name: 'qr_code',
    );
    if (!mounted) return;
    final success = (result['isSuccess'] as bool?) ?? false;
    if (success) {
      await _recordGeneratedHistory();
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(success ? '갤러리에 저장했습니다.' : '저장에 실패했습니다.'),
        duration: const Duration(milliseconds: 1400),
      ),
    );
  }

  void _playFeedback() {
    final settings = LocalStorage.loadSettings();
    if (settings.vibrate) {
      HapticFeedback.lightImpact();
    }
    if (settings.sound) {
      SystemSound.play(SystemSoundType.click);
    }
  }
}

class _FieldCard extends StatelessWidget {
  const _FieldCard({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.text);
  final String text;
  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w700,
        color: Theme.of(context).colorScheme.onSurface,
      ),
    );
  }
}
