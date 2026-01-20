import 'package:flutter/material.dart';

class ScanOverlay extends StatelessWidget {
  const ScanOverlay({
    super.key,
    this.isBarcode = false,
  });

  final bool isBarcode;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth * (isBarcode ? 0.82 : 0.68);
        final height = constraints.maxHeight * (isBarcode ? 0.28 : 0.68);
        final left = (constraints.maxWidth - width) / 2;
        final top = (constraints.maxHeight - height) / 2;

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
                      width: width,
                      height: height,
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(isBarcode ? 18 : 24),
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
                width: width,
                height: height,
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFF2EC4B6), width: 3),
                  borderRadius: BorderRadius.circular(isBarcode ? 18 : 24),
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
