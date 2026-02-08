class BackendConfig {
  /// Base URL of your upload/landing backend (used for app landing).
  static const String baseUrl = 'https://api.your-backend.com';

  /// Supabase project URL and anon key.
  static const String supabaseUrl = 'https://yrfmagyifkzcikvjgpin.supabase.co';
  static const String supabaseAnonKey = 'sb_publishable_j2uTxgnM-SQAl6AzXXOZtA_tGJA0eKi';

  /// Cloudinary cloud name (from Cloudinary dashboard).
  static const String cloudName = 'dmnn0ifkf';
  // ... rest of the settings (will be replaced by Supabase soon)

  /// Unsigned upload preset name.
  static const String uploadPreset = 'saida_unsigned';

  /// Optional folder for uploads (leave empty to upload to root).
  static const String uploadFolder = '';

  /// Endpoint path for generated app landing pages.
  /// Expect query params: name, androidUrl, iosUrl, description (optional).
  static const String appLandingPath = '/apps/landing';
}
