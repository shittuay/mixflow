import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface EnvironmentConfig {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  databaseUrl: string;
  corsOrigins: string[];
  uploadMaxSize: number;
  bcryptRounds: number;
}

class Environment {
  private static instance: Environment;
  public config: EnvironmentConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  static getInstance(): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment();
    }
    return Environment.instance;
  }

  private loadConfig(): EnvironmentConfig {
    return {
      port: parseInt(process.env.PORT || '3333', 10),
      nodeEnv: process.env.NODE_ENV || 'development',
      jwtSecret: process.env.JWT_SECRET || this.generateSecretWarning(),
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
      databaseUrl: process.env.DATABASE_URL || '',
      corsOrigins: this.parseCorsOrigins(process.env.CORS_ORIGINS),
      uploadMaxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '104857600', 10), // 100MB
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    };
  }

  private generateSecretWarning(): string {
    console.warn('⚠️  JWT_SECRET not set in environment variables!');
    console.warn('⚠️  Using a temporary secret - THIS IS NOT SECURE FOR PRODUCTION!');
    console.warn('⚠️  Please set JWT_SECRET environment variable to a secure random string');
    
    if (this.config?.nodeEnv === 'production') {
      throw new Error('JWT_SECRET is required in production environment');
    }
    
    return 'temp-secret-for-development-only-' + Date.now();
  }

  private parseCorsOrigins(origins?: string): string[] {
    if (!origins) {
      return this.config?.nodeEnv === 'production' 
        ? [] 
        : ['http://localhost:3000', 'http://localhost:4200'];
    }
    
    return origins.split(',').map(origin => origin.trim());
  }

  private validateConfig(): void {
    const requiredVars = [
      'JWT_SECRET',
      'DATABASE_URL'
    ];

    const missingVars = requiredVars.filter(varName => {
      const value = process.env[varName];
      return !value || value.trim() === '';
    });

    if (missingVars.length > 0 && this.config.nodeEnv === 'production') {
      throw new Error(
        `Missing required environment variables for production: ${missingVars.join(', ')}`
      );
    }

    if (missingVars.includes('DATABASE_URL')) {
      console.warn('⚠️  DATABASE_URL not set - database connection may fail');
    }

    // Validate port
    if (isNaN(this.config.port) || this.config.port < 1 || this.config.port > 65535) {
      throw new Error('PORT must be a valid number between 1 and 65535');
    }

    // Validate bcrypt rounds
    if (this.config.bcryptRounds < 10 || this.config.bcryptRounds > 15) {
      console.warn('⚠️  BCRYPT_ROUNDS should be between 10-15 for optimal security/performance');
    }

    console.log('✅ Environment configuration loaded successfully');
    console.log(`🌍 Environment: ${this.config.nodeEnv}`);
    console.log(`🚀 Port: ${this.config.port}`);
    console.log(`🗄️  Database: ${this.config.databaseUrl ? 'Configured' : 'Not configured'}`);
  }

  isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }
}

export const env = Environment.getInstance();