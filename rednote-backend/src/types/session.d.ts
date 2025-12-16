import 'express-session';
import { ModelConfig } from '../common/interfaces/model-config.interface';

declare module 'express-session' {
  interface SessionData {
    modelConfig?: ModelConfig;
    textModelConfig?: ModelConfig;
    imageModelConfig?: ModelConfig;
    parameters?: {
      temperature?: number;
      topP?: number;
    };
  }
}
