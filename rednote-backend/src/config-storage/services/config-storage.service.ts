import { Injectable, Logger } from '@nestjs/common';
import { UserConfig } from '../../common/interfaces/user-config.interface';

@Injectable()
export class ConfigStorageService {
  private readonly logger = new Logger(ConfigStorageService.name);
  private readonly configs: Map<string, UserConfig> = new Map();

  saveConfig(userId: string, config: Partial<UserConfig>): UserConfig {
    this.logger.log(`Saving config for userId: ${userId}`);

    const existingConfig = this.configs.get(userId);
    const updatedConfig: UserConfig = {
      ...existingConfig,
      ...config,
      userId,
      updatedAt: new Date(),
    };

    this.configs.set(userId, updatedConfig);

    this.logger.log(
      `Config saved for userId: ${userId} (Total configs: ${this.configs.size})`,
    );

    return updatedConfig;
  }

  getConfig(userId: string): UserConfig | null {
    const config = this.configs.get(userId);

    if (config) {
      this.logger.log(`Config found for userId: ${userId}`);
    } else {
      this.logger.log(`No config found for userId: ${userId}`);
    }

    return config || null;
  }

  deleteConfig(userId: string): boolean {
    const deleted = this.configs.delete(userId);

    if (deleted) {
      this.logger.log(`Config deleted for userId: ${userId}`);
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
