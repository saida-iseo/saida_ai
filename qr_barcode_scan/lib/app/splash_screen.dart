import 'package:flutter/material.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key, required this.onFinish});

  final VoidCallback onFinish;

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  bool _visible = true;
  bool _completed = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 1200), () {
      if (!mounted) return;
      setState(() => _visible = false);
    });
  }

  void _handleEnd() {
    if (_visible || _completed) return;
    _completed = true;
    widget.onFinish();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedOpacity(
        duration: const Duration(milliseconds: 600),
        opacity: _visible ? 1 : 0,
        onEnd: _handleEnd,
        child: AnimatedScale(
          duration: const Duration(milliseconds: 600),
          scale: _visible ? 1 : 0.98,
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  const Color(0xFF0B1220),
                  const Color(0xFF1E293B),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const _SplashQrMark(),
                  const SizedBox(height: 18),
                  Text(
                    'saida qr scanner',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: Colors.white.withOpacity(0.92),
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.8,
                        ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SplashQrMark extends StatelessWidget {
  const _SplashQrMark();

  static const _pattern = [
    1, 1, 1, 0, 1, 0, 1,
    1, 0, 1, 0, 1, 0, 1,
    1, 1, 1, 0, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 0, 1, 1, 0,
    1, 0, 1, 0, 0, 1, 0,
    1, 1, 1, 0, 1, 0, 1,
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 160,
      height: 160,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 18,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: GridView.builder(
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 7,
          crossAxisSpacing: 4,
          mainAxisSpacing: 4,
        ),
        itemCount: _pattern.length,
        itemBuilder: (context, index) {
          final filled = _pattern[index] == 1;
          return AnimatedContainer(
            duration: const Duration(milliseconds: 240),
            decoration: BoxDecoration(
              color: filled ? const Color(0xFF2563EB) : const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(4),
            ),
          );
        },
      ),
    );
  }
}
