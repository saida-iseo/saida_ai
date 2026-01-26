import 'dart:async';

import 'package:flutter/services.dart';

class ProcessTextService {
  static const MethodChannel _channel = MethodChannel('process_text');
  static const EventChannel _events = EventChannel('process_text_events');

  static Future<String?> getInitialText() async {
    try {
      final text = await _channel.invokeMethod<String>('getInitialText');
      return text;
    } catch (_) {
      return null;
    }
  }

  static Stream<String> get stream => _events
      .receiveBroadcastStream()
      .where((event) => event is String)
      .cast<String>();
}
