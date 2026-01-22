import 'package:flutter/material.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';
import 'package:qr_barcode_scan/features/generator/models/qr_design.dart';

Future<QrDesign?> showDesignEditor({
  required BuildContext context,
  required QrDesign initial,
}) {
  return showModalBottomSheet<QrDesign>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) {
      var draft = initial;
      return StatefulBuilder(
        builder: (context, setState) {
          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Container(
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
                      child: Row(
                        children: [
                          const Text('디자인 편집', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                          const Spacer(),
                          IconButton(
                            icon: const Icon(Icons.close),
                            onPressed: () => Navigator.pop(context),
                          )
                        ],
                      ),
                    ),
                    _ColorPalette(
                      title: 'QR 색상',
                      selected: draft.foreground,
                      onPreset: (c) => setState(() => draft = draft.copyWith(foreground: c)),
                      onCustom: () async {
                        final picked = await _pickColor(context, draft.foreground, 'QR 색상 선택');
                        if (picked != null) setState(() => draft = draft.copyWith(foreground: picked));
                      },
                    ),
                    const SizedBox(height: 12),
                    _ColorPalette(
                      title: '배경색',
                      selected: draft.background,
                      onPreset: (c) => setState(() => draft = draft.copyWith(background: c)),
                      onCustom: () async {
                        final picked = await _pickColor(context, draft.background, '배경색 선택');
                        if (picked != null) setState(() => draft = draft.copyWith(background: picked));
                      },
                    ),
                    const SizedBox(height: 12),
                    _PatternRow(
                      selected: draft.pattern,
                      onSelected: (p) => setState(() => draft = draft.copyWith(pattern: p)),
                    ),
                    const SizedBox(height: 16),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => Navigator.pop(context),
                              child: const Text('취소'),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () => Navigator.pop(context, draft),
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

class _ColorPalette extends StatelessWidget {
  const _ColorPalette({
    required this.title,
    required this.selected,
    required this.onPreset,
    required this.onCustom,
  });

  final String title;
  final Color selected;
  final ValueChanged<Color> onPreset;
  final VoidCallback onCustom;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
              const Spacer(),
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: selected,
                  shape: BoxShape.circle,
                  border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 46,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: kPresetColors.length + 1,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (context, index) {
                if (index == 0) {
                  return InkWell(
                    onTap: onCustom,
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      width: 46,
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surfaceVariant,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                      ),
                      child: const Icon(Icons.add, size: 22),
                    ),
                  );
                }
                final color = kPresetColors[index - 1];
                final selectedNow = selected.value == color.value;
                return GestureDetector(
                  onTap: () => onPreset(color),
                  child: Container(
                    width: 42,
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: selectedNow
                            ? Theme.of(context).colorScheme.primary
                            : Theme.of(context).colorScheme.outlineVariant,
                        width: selectedNow ? 2 : 1,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _PatternRow extends StatelessWidget {
  const _PatternRow({
    required this.selected,
    required this.onSelected,
  });

  final QrPattern selected;
  final ValueChanged<QrPattern> onSelected;

  @override
  Widget build(BuildContext context) {
    const options = [
      (QrPattern.classic, 'Classic'),
      (QrPattern.round, 'Round'),
      (QrPattern.dots, 'Dots'),
      (QrPattern.roundedCorners, 'Rounded'),
      (QrPattern.pixel, 'Pixel'),
    ];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('패턴', style: TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: options
                .map(
                  (opt) => ChoiceChip(
                    label: Text(opt.$2),
                    selected: opt.$1 == selected,
                    onSelected: (_) => onSelected(opt.$1),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }
}

Future<Color?> _pickColor(BuildContext context, Color initial, String title) {
  Color current = initial;
  final controller = TextEditingController(text: _toHex(initial));
  return showModalBottomSheet<Color>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) {
      return StatefulBuilder(
        builder: (context, setState) {
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
                children: [
                  Row(
                    children: [
                      Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
                      const Spacer(),
                      IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
                    ],
                  ),
                  ColorPicker(
                    pickerColor: current,
                    onColorChanged: (c) {
                      setState(() {
                        current = c;
                        controller.text = _toHex(c);
                      });
                    },
                    enableAlpha: false,
                    hexInputController: controller,
                    portraitOnly: true,
                    colorPickerWidth: 280,
                    pickerAreaHeightPercent: 0.6,
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: controller,
                    decoration: const InputDecoration(labelText: 'HEX', border: OutlineInputBorder()),
                    onSubmitted: (value) {
                      final parsed = _parseHex(value);
                      if (parsed != null) {
                        setState(() => current = parsed);
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context, current),
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

String _toHex(Color color) => '#${color.value.toRadixString(16).padLeft(8, '0').substring(2).toUpperCase()}';

Color? _parseHex(String input) {
  final value = input.replaceAll('#', '').trim();
  if (value.length != 6 && value.length != 8) return null;
  final buffer = StringBuffer();
  if (value.length == 6) buffer.write('ff');
  buffer.write(value);
  final hex = int.tryParse(buffer.toString(), radix: 16);
  if (hex == null) return null;
  return Color(hex);
}
