class BackendConfig {
  /// Base URL of your upload/landing backend. Replace with your actual domain.
  static const String baseUrl = 'https://api.your-backend.com';

  /// Endpoint path for file uploads. Should accept multipart/form-data `file`.
  static const String uploadEndpoint = '/upload';

  /// Endpoint path for generated app landing pages.
  /// Expect query params: name, androidUrl, iosUrl, description (optional).
  static const String appLandingPath = '/apps/landing';
}
