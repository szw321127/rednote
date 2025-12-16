import { Injectable, Logger } from '@nestjs/common';
import { UserConfig } from '../../common/interfaces/user-config.interface';

@Injectable()
export class ConfigStorageService {
  private readonly logger = new Logger(ConfigStorageService.name);
  private readonly configs: Map<string, UserConfig> = new Map();

  saveConfig(fingerprint: string, config: Partial<UserConfig>): UserConfig {
    this.logger.log(
      `Saving config for fingerprint: ${fingerprint.substring(0, 10)}...`,
    );

    const existingConfig = this.configs.get(fingerprint);
    const updatedConfig: UserConfig = {
      ...existingConfig,
      ...config,
      fingerprint,
      updatedAt: new Date(),
    };

    this.configs.set(fingerprint, updatedConfig);

    this.logger.log(
      `Config saved for fingerprint: ${fingerprint.substring(0, 10)}... (Total configs: ${this.configs.size})`,
    );

    return updatedConfig;
  }

  getConfig(fingerprint: string): UserConfig | null {
    const config = this.configs.get(fingerprint);

    if (config) {
      this.logger.log(
        `Config found for fingerprint: ${fingerprint.substring(0, 10)}...`,
      );
    } else {
      this.logger.log(
        `No config found for fingerprint: ${fingerprint.substring(0, 10)}...`,
      );
    }

    return config || null;
  }

  deleteConfig(fingerprint: string): boolean {
    const deleted = this.configs.delete(fingerprint);

    if (deleted) {
      this.logger.log(
        `Config deleted for fingerprint: ${fingerprint.substring(0, 10)}...`,
      );
    }

    return deleted;
  }

  getAllConfigs(): UserConfig[] {
    return Array.from(this.configs.values());
  }

  getConfigCount(): number {
    return this.configs.size;
  }
}
