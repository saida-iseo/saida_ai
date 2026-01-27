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
        CustomPaint(
          size: Size.infinite,
          painter: _ScanMaskPainter(scanWindow: scanWindow),
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

class _ScanMaskPainter extends CustomPainter {
  _ScanMaskPainter({required this.scanWindow});

  final Rect scanWindow;

  @override
  void paint(Canvas canvas, Size size) {
    final overlay = Paint()..color = Colors.black54;
    final path = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
      ..addRRect(RRect.fromRectAndRadius(scanWindow, const Radius.circular(16)));
    path.fillType = PathFillType.evenOdd;
    canvas.drawPath(path, overlay);
  }

  @override
  bool shouldRepaint(covariant _ScanMaskPainter oldDelegate) {
    return oldDelegate.scanWindow != scanWindow;
  }
}
