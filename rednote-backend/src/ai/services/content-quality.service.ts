import { Injectable, Logger } from '@nestjs/common';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ConfigService } from '@nestjs/config';
import { redactSecrets, summarizeText } from '../../common/logging/redaction.util';
import { parseQualityScore } from '../schemas/quality-score.schema';

export interface QualityScore {
  overall: number; // 0-100
  creativity: number;
  engagement: number;
  clarity: number;
  suggestions: string[];
}

@Injectable()
export class ContentQualityService {
  private readonly logger = new Logger(ContentQualityService.name);

  constructor(private configService: ConfigService) {}

  async evaluateCaption(caption: string): Promise<QualityScore> {
    this.logger.log('Evaluating content quality');

    const apiKey = this.configService.get<string>('GOOGLE_API_KEY', '');
    if (!apiKey) {
      return this.defaultScore();
    }

    try {
      const model = new ChatGoogleGenerativeAI({
        model: 'gemini-2.5-flash',
        apiKey,
        temperature: 0.3,
      });

      const prompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          `你是小红书内容质量评估专家。评估以下文案的质量，返回纯JSON（不要markdown）。

JSON格式：
{{"overall":85,"creativity":80,"engagement":90,"clarity":85,"suggestions":["建议1","建议2"]}}

评分标准（0-100）：
- overall: 综合评分
- creativity: 创意性（标题吸引力、内容新颖度）
- engagement: 互动性（是否引导点赞收藏、话题性）
- clarity: 清晰度（结构、可读性、排版）
- suggestions: 1-3条改进建议`,
        ],
        ['user', '文案：{caption}'],
      ]);

      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      const result = await chain.invoke({ caption });

      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = parseQualityScore(JSON.parse(jsonMatch[0]));
        this.logger.log(`Quality score: ${parsed.overall}`);
        return parsed;
      }

      throw new Error('No valid quality score JSON object found');
    } catch (error) {
      this.logger.warn(
        `Quality evaluation failed: ${summarizeText(redactSecrets(error), 200)}`,
      );
    }

    return this.defaultScore();
  }

  private defaultScore(): QualityScore {
    return {
      overall: 0,
      creativity: 0,
      engagement: 0,
      clarity: 0,
      suggestions: [],
    };
  }
}
