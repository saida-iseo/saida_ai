import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

class AdBanner extends StatefulWidget {
  const AdBanner({super.key});

  @override
  State<AdBanner> createState() => _AdBannerState();
}

class _AdBannerState extends State<AdBanner> {
  BannerAd? _banner;
  bool _loaded = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _load();
  }

  void _load() {
    if (_banner != null) return;
    final adUnitId = _adUnitId;
    if (adUnitId == null) return;

    _banner = BannerAd(
      size: AdSize.banner,
      adUnitId: adUnitId,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (_) {
          if (!mounted) return;
          setState(() => _loaded = true);
        },
        onAdFailedToLoad: (ad, error) {
          ad.dispose();
          _banner = null;
        },
      ),
    )..load();
  }

  String? get _adUnitId {
    if (kIsWeb) return null;
    if (Platform.isAndroid) {
      return kReleaseMode
          ? 'ca-app-pub-7885970786250498/2471043524'
          : 'ca-app-pub-3940256099942544/6300978111';
    }
    if (Platform.isIOS) {
      return kReleaseMode
          ? 'ca-app-pub-7885970786250498/2471043524'
          : 'ca-app-pub-3940256099942544/2934735716';
    }
    return null;
  }

  @override
  void dispose() {
    _banner?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_banner == null || !_loaded) {
      final adUnitId = _adUnitId;
      if (adUnitId == null) return const SizedBox.shrink();
      return Container(
        margin: const EdgeInsets.fromLTRB(16, 12, 16, 8),
        alignment: Alignment.center,
        width: double.infinity,
        height: AdSize.banner.height.toDouble(),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.05),
          borderRadius: BorderRadius.circular(12),
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      alignment: Alignment.center,
      width: _banner!.size.width.toDouble(),
      height: _banner!.size.height.toDouble(),
      child: AdWidget(ad: _banner!),
    );
  }
}
