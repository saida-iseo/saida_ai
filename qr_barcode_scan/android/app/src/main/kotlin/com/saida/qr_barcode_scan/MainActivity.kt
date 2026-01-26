package com.saida.qr_barcode_scan

import android.content.Intent
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
  private val methodChannelName = "process_text"
  private val eventChannelName = "process_text_events"
  private var pendingText: String? = null
  private var eventSink: EventChannel.EventSink? = null

  override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
    super.configureFlutterEngine(flutterEngine)
    MethodChannel(flutterEngine.dartExecutor.binaryMessenger, methodChannelName)
      .setMethodCallHandler { call, result ->
        if (call.method == "getInitialText") {
          result.success(pendingText)
          pendingText = null
        } else {
          result.notImplemented()
        }
      }

    EventChannel(flutterEngine.dartExecutor.binaryMessenger, eventChannelName)
      .setStreamHandler(object : EventChannel.StreamHandler {
        override fun onListen(arguments: Any?, sink: EventChannel.EventSink?) {
          eventSink = sink
          pendingText?.let {
            sink?.success(it)
            pendingText = null
          }
        }

        override fun onCancel(arguments: Any?) {
          eventSink = null
        }
      })
  }

  override fun onCreate(savedInstanceState: android.os.Bundle?) {
    super.onCreate(savedInstanceState)
    handleProcessTextIntent(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    handleProcessTextIntent(intent)
  }

  private fun handleProcessTextIntent(intent: Intent?) {
    if (intent == null) return
    if (Intent.ACTION_PROCESS_TEXT != intent.action) return
    val text = intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT)?.toString()
    if (text.isNullOrBlank()) return
    if (eventSink != null) {
      eventSink?.success(text)
    } else {
      pendingText = text
    }
  }
}
