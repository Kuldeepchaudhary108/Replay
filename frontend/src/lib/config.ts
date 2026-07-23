/**
 * Centralized environment configuration for the application
 * Ensures type-safe access to environment variables with proper fallbacks
 */

class AppConfig {
  private static instance: AppConfig;
  
  public readonly BACKEND_URL: string;
  public readonly GOOGLE_CLIENT_ID: string;
  public readonly IS_PRODUCTION: boolean;
  public readonly IS_DEVELOPMENT: boolean;

  private constructor() {
    // Validate and set backend URL
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    
    if (!backendUrl) {
      // In development, default to localhost
      // In production, this should always be set - throw error if missing
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'NEXT_PUBLIC_BACKEND_URL is required in production. Please set it in your environment variables.'
        );
      }
      console.warn(
        'NEXT_PUBLIC_BACKEND_URL not found, using default: http://localhost:4000'
      );
      this.BACKEND_URL = 'http://localhost:4000';
    } else {
      // Remove any trailing slashes for consistency
      this.BACKEND_URL = backendUrl.replace(/\/+$/, '');
    }

    // Set Google Client ID
    this.GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

    // Environment flags
    this.IS_PRODUCTION = process.env.NODE_ENV === 'production';
    this.IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

    // Log configuration in development only
    if (this.IS_DEVELOPMENT) {
      console.log('🔧 App Configuration:', {
        BACKEND_URL: this.BACKEND_URL,
        NODE_ENV: process.env.NODE_ENV,
      });
    }
  }

  /**
   * Get the singleton instance of AppConfig
   */
  public static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig();
    }
    return AppConfig.instance;
  }

  /**
   * Get full API endpoint URL
   */
  public getApiUrl(path: string): string {
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.BACKEND_URL}${normalizedPath}`;
  }
}

// Export singleton instance
export const config = AppConfig.getInstance();

// Export commonly used values for convenience
export const BACKEND_URL = config.BACKEND_URL;
export const GOOGLE_CLIENT_ID = config.GOOGLE_CLIENT_ID;
