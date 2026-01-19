import 'package:flutter/material.dart';

class ScanOverlay extends StatelessWidget {
  const ScanOverlay({super.key});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final size = constraints.maxWidth * 0.68;
        final left = (constraints.maxWidth - size) / 2;
        final top = (constraints.maxHeight - size) / 2;

        return Stack(
          children: [
            ColorFiltered(
              colorFilter: const ColorFilter.mode(Colors.black54, BlendMode.srcOut),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Container(color: Colors.transparent),
                  Positioned(
                    left: left,
                    top: top,
                    child: Container(
                      width: size,
                      height: size,
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(24),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Positioned(
              left: left,
              top: top,
              child: Container(
                width: size,
                height: size,
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFF2EC4B6), width: 3),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF2EC4B6).withOpacity(0.2),
                      blurRadius: 24,
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
}
