import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

class AppOpenAdManager {
  static const String _androidAdUnitId = 'ca-app-pub-7885970786250498/8534732881';
  static const String _iosAdUnitId = 'ca-app-pub-7885970786250498/8534732881';
  
  static const String _testAndroidAdUnitId = 'ca-app-pub-3940256099942544/9257395912';
  static const String _testIosAdUnitId = 'ca-app-pub-3940256099942544/5575463023';

  AppOpenAd? _appOpenAd;
  bool _isShowingAd = false;

  String get adUnitId {
    if (kDebugMode) {
      return Platform.isAndroid ? _testAndroidAdUnitId : _testIosAdUnitId;
    }
    return Platform.isAndroid ? _androidAdUnitId : _iosAdUnitId;
  }

  /// Load an AppOpenAd.
  void loadAd() {
    AppOpenAd.load(
      adUnitId: adUnitId,
      request: const AdRequest(),
      adLoadCallback: AppOpenAdLoadCallback(
        onAdLoaded: (ad) {
          _appOpenAd = ad;
        },
        onAdFailedToLoad: (error) {
          debugPrint('AppOpenAd failed to load: $error');
        },
      ),
    );
  }

  /// Whether an ad is available to be shown.
  bool get isAdAvailable => _appOpenAd != null;

  /// Shows the ad if one is available and not already showing.
  void showAdIfAvailable() {
    if (!isAdAvailable) {
      debugPrint('Tried to show ad before it was available.');
      loadAd();
      return;
    }
    if (_isShowingAd) {
      debugPrint('Tried to show ad while already showing an ad.');
      return;
    }

    _appOpenAd!.fullScreenContentCallback = FullScreenContentCallback(
      onAdShowedFullScreenContent: (ad) {
        _isShowingAd = true;
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        debugPrint('failed to show: $error');
        _isShowingAd = false;
        ad.dispose();
        _appOpenAd = null;
        loadAd();
      },
      onAdDismissedFullScreenContent: (ad) {
        _isShowingAd = false;
        ad.dispose();
        _appOpenAd = null;
        loadAd();
      },
    );

    _appOpenAd!.show();
  }
}
