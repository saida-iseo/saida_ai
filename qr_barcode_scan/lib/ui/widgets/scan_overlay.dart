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
              border: Border.all(color: cornerColor.withOpacity(0.6), width: 2),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: cornerColor.withOpacity(0.25),
                  blurRadius: 24,
                ),
              ],
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
              _CornerAccent(
                color: cornerColor,
                alignment: Alignment.topLeft,
              ),
              _CornerAccent(
                color: cornerColor,
                alignment: Alignment.topRight,
              ),
              _CornerAccent(
                color: cornerColor,
                alignment: Alignment.bottomLeft,
              ),
              _CornerAccent(
                color: cornerColor,
                alignment: Alignment.bottomRight,
              ),
              Center(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 180),
                  switchInCurve: Curves.easeOut,
                  switchOutCurve: Curves.easeIn,
                  transitionBuilder: (child, animation) {
                    final offsetTween = Tween<Offset>(
                      begin: const Offset(0, 0.08),
                      end: Offset.zero,
                    );
                    return FadeTransition(
                      opacity: animation,
                      child: SlideTransition(position: animation.drive(offsetTween), child: child),
                    );
                  },
                  child: Text(
                    label,
                    key: ValueKey(label),
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.85),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                    textAlign: TextAlign.center,
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

class _CornerAccent extends StatelessWidget {
  const _CornerAccent({
    required this.color,
    required this.alignment,
  });

  final Color color;
  final Alignment alignment;

  @override
  Widget build(BuildContext context) {
    const size = 26.0;
    const thickness = 3.0;
    Border border;
    if (alignment == Alignment.topLeft) {
      border = Border(
        top: BorderSide(color: color, width: thickness),
        left: BorderSide(color: color, width: thickness),
      );
    } else if (alignment == Alignment.topRight) {
      border = Border(
        top: BorderSide(color: color, width: thickness),
        right: BorderSide(color: color, width: thickness),
      );
    } else if (alignment == Alignment.bottomLeft) {
      border = Border(
        bottom: BorderSide(color: color, width: thickness),
        left: BorderSide(color: color, width: thickness),
      );
    } else {
      border = Border(
        bottom: BorderSide(color: color, width: thickness),
        right: BorderSide(color: color, width: thickness),
      );
    }

    return Align(
      alignment: alignment,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(border: border),
      ),
    );
  }
}
