class BackendConfig {
  /// Base URL of your upload/landing backend (used for app landing).
  static const String baseUrl = 'https://api.your-backend.com';

  /// Cloudinary cloud name (from Cloudinary dashboard).
  static const String cloudName = 'dmnn0ifkf';

  /// Unsigned upload preset name.
  static const String uploadPreset = 'saida_unsigned';

  /// Optional folder for uploads (leave empty to upload to root).
  static const String uploadFolder = '';

  /// Endpoint path for generated app landing pages.
  /// Expect query params: name, androidUrl, iosUrl, description (optional).
  static const String appLandingPath = '/apps/landing';
}
