import 'package:flutter/material.dart';

class ScanOverlay extends StatelessWidget {
  const ScanOverlay({
    super.key,
    required this.scanWindow,
    required this.label,
    this.topRight,
    this.topRightPadding = const EdgeInsets.all(12),
  });

  final Rect scanWindow;
  final String label;
  final Widget? topRight;
  final EdgeInsets topRightPadding;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final cornerColor = colorScheme.primary;

    return Stack(
      children: [
        ColorFiltered(
          colorFilter: const ColorFilter.mode(Colors.black54, BlendMode.srcOut),
          child: Stack(
            fit: StackFit.expand,
            children: [
              Container(color: Colors.transparent),
              Positioned.fromRect(
                rect: scanWindow,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.black,
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
              ),
            ],
          ),
        ),
        Positioned.fromRect(
          rect: scanWindow,
          child: Container(
            decoration: BoxDecoration(
              border: Border.all(color: cornerColor.withOpacity(0.7), width: 2),
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
        Positioned.fromRect(
          rect: scanWindow,
          child: Stack(
            children: [
              if (topRight != null)
                Align(
                  alignment: Alignment.topRight,
                  child: Padding(
                    padding: topRightPadding,
                    child: topRight,
                  ),
                ),
              Align(
                alignment: Alignment.center,
                child: Opacity(
                  opacity: 0.75,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: Colors.white.withOpacity(0.2)),
                    ),
                    child: Text(
                      label,
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.9),
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        shadows: [
                          Shadow(
                            color: Colors.black.withOpacity(0.35),
                            blurRadius: 6,
                            offset: const Offset(0, 1),
                          ),
                        ],
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
