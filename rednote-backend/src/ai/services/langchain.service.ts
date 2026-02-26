import {
  StringOutputParser,
  JsonOutputParser,
} from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModelConfig } from '../../common/interfaces/model-config.interface';
import { Outline } from '../../common/interfaces/outline.interface';
import {
  redactSecrets,
  summarizeText,
} from '../../common/logging/redaction.util';
import { resolveAndValidateEndpoint } from '../../common/security/ai-endpoint-policy.util';
import { parseOutlineOutput } from '../schemas/outline-output.schema';
import { AiOutputValidationException } from '../exceptions/ai-output-validation.exception';

@Injectable()
export class LangchainService {
  private readonly logger = new Logger(LangchainService.name);

  constructor(private configService: ConfigService) {}

  private getModel(config: ModelConfig) {
    const endpoint = resolveAndValidateEndpoint(
      config,
      this.configService.get<string>('AI_BASE_URL_ALLOWLIST'),
    );

    const apiKey =
      config.apiKey || this.getApiKeyForProvider(endpoint.provider);
    const temperature = config.temperature ?? 0.7;
    const topP = config.topP ?? 0.95;

    if (endpoint.provider === 'openai' || config.modelName.includes('gpt')) {
      this.logger.log(`Creating OpenAI model: ${config.modelName}`);
      return new ChatOpenAI({
        modelName: config.modelName,
        apiKey,
        temperature,
        topP,
        configuration: { baseURL: endpoint.baseUrl },
      });
    }

    this.logger.log(`Creating Google Gemini model: ${config.modelName}`);
    const googleConfig: ConstructorParameters<
      typeof ChatGoogleGenerativeAI
    >[0] = {
      model: config.modelName,
      apiKey,
      temperature,
      topP,
      baseUrl: endpoint.baseUrl,
    };

    return new ChatGoogleGenerativeAI(googleConfig);
  }

  private getApiKeyForProvider(provider?: string): string {
    if (provider === 'openai') {
      return this.configService.get<string>('OPENAI_API_KEY', '');
    }
    return this.configService.get<string>('GOOGLE_API_KEY', '');
  }

  async generateOutlines(
    topic: string,
    modelConfig: ModelConfig,
    maxRetries: number = 3,
  ): Promise<Outline[]> {
    this.logger.log(
      `Generating outlines request received, topicLength=${topic.length}`,
    );

    const model = this.getModel(modelConfig);

    // Use JsonOutputParser for reliable JSON parsing
    const jsonParser = new JsonOutputParser();
    const stringParser = new StringOutputParser();

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `你是一个严格遵循指令的AI助手。

任务：根据用户主题生成小红书大纲。

输出格式要求（违反=失败）：
1. 返回纯JSON数组，不要有任何其他文字
2. 不要使用markdown代码块
3. 不要输出思考过程
4. 不要有任何前缀或后缀文字
5. 第一个字符必须是 [，最后一个字符必须是 ]

JSON结构：
[
  {{
    "title": "标题（15-20字）",
    "content": "内容要点（50-100字）",
    "emoji": "表情符号",
    "tags": ["标签1", "标签2", "标签3"]
  }}
]

示例：
[
  {{"title":"周末去哪儿玩","content":"分享北京周边好玩的地方","emoji":"🎡","tags":["周末","北京","旅游"]}}
]`,
      ],
      ['user', '主题：{topic}'],
    ]);

    // First try with JSON parser
    let chain: any = prompt.pipe(model).pipe(jsonParser);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await chain.invoke({ topic });
        const outlineCount = Array.isArray(result) ? result.length : 0;
        this.logger.debug(
          `Parsed outlines successfully on attempt ${attempt + 1}, count=${outlineCount}`,
        );

        // Handle both direct array and wrapped response
        let outlines: unknown[];
        if (typeof result === 'string') {
          // StringOutputParser returned a string — extract JSON array from it
          const jsonMatch = result.match(/\[[\s\S]*\]/);
          if (!jsonMatch) {
            throw new Error('No JSON array found in string response');
          }
          outlines = JSON.parse(jsonMatch[0]) as unknown[];
        } else if (Array.isArray(result)) {
          outlines = result;
        } else if (
          result &&
          typeof result === 'object' &&
          Array.isArray(result.outlines)
        ) {
          outlines = result.outlines;
        } else if (
          result &&
          typeof result === 'object' &&
          Array.isArray(result.items)
        ) {
          outlines = result.items;
        } else {
          throw new Error('Unexpected response format');
        }

        return parseOutlineOutput(outlines);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        const safeError = summarizeText(redactSecrets(lastError.message), 240);
        this.logger.warn(`Attempt ${attempt + 1} failed: ${safeError}`);

        // If JSON parser fails on first attempt, switch to string parser for subsequent retries
        if (attempt === 0) {
          this.logger.log('Retrying with string parser...');
          chain = prompt.pipe(model).pipe(stringParser);
        }

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
    }

    this.logger.error(
      `Failed to parse outlines after ${maxRetries + 1} attempts`,
    );
    throw new AiOutputValidationException('outlines');
  }

  async generateOutlinesStream(
    topic: string,
    modelConfig: ModelConfig,
    onChunk: (chunk: string) => void,
  ): Promise<Outline[]> {
    this.logger.log(
      `Generating outlines stream request received, topicLength=${topic.length}`,
    );

    const model = this.getModel(modelConfig);

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `你是一个严格遵循指令的AI助手。

任务：根据用户主题生成小红书大纲。

输出格式要求（违反=失败）：
1. 返回纯JSON数组，不要有任何其他文字
2. 不要使用markdown代码块
3. 不要输出思考过程
4. 不要有任何前缀或后缀文字
5. 第一个字符必须是 [，最后一个字符必须是 ]

JSON结构：
[
  {{
    "title": "标题（15-20字）",
    "content": "内容要点（50-100字）",
    "emoji": "表情符号",
    "tags": ["标签1", "标签2", "标签3"]
  }}
]

示例：
[
  {{"title":"周末去哪儿玩","content":"分享北京周边好玩的地方","emoji":"🎡","tags":["周末","北京","旅游"]}}
]`,
      ],
      ['user', '主题：{topic}'],
    ]);

    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    let fullText = '';
    const stream = await chain.stream({ topic });

    for await (const chunk of stream) {
      fullText += chunk;
      onChunk(chunk);
    }

    this.logger.debug(`Outline stream completed, chars=${fullText.length}`);

    try {
      // Parse JSON from string result
      const jsonMatch = fullText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      const outlines = JSON.parse(jsonMatch[0]) as unknown[];
      return parseOutlineOutput(outlines);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to parse streamed outlines: ${summarizeText(redactSecrets(errorMessage), 220)}`,
      );
      throw new AiOutputValidationException('outlines');
    }
  }

  async generateCaption(
    outline: Outline,
    modelConfig: ModelConfig,
  ): Promise<string> {
    this.logger.log(
      `Generating caption, titleLength=${outline.title.length}, tagsCount=${outline.tags.length}`,
    );

    const model = this.getModel(modelConfig);

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `你是一个专业的小红书文案创作专家。你需要根据提供的大纲，创作一篇吸引人的小红书文案。

文案要求：
1. 第一行是醒目的标题，使用emoji增强视觉效果
2. 内容要有条理，使用emoji分隔要点
3. 语气亲切自然，像朋友聊天一样
4. 长度控制在200-300字
5. 结尾可以适当引导互动（点赞、收藏、关注）
6. 最后一行添加相关话题标签

直接返回文案内容，不需要任何额外说明。`,
      ],
      ['user', `标题：{title}\n内容：{content}\n标签：{tags}`],
    ]);

    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    const caption = await chain.invoke({
      title: outline.title,
      content: outline.content,
      tags: outline.tags.join(', '),
    });

    this.logger.debug(`Generated caption length: ${caption.length}`);

    return caption;
  }

  async generateImagePrompt(
    outline: Outline,
    modelConfig: ModelConfig,
  ): Promise<string> {
    this.logger.log(
      `Generating image prompt, titleLength=${outline.title.length}, contentLength=${outline.content.length}`,
    );

    const model = this.getModel(modelConfig);

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `你是一个专业的小红书图像提示词专家。你需要根据小红书笔记的大纲，生成一个详细的英文图像生成提示词。

提示词要求：
1. 风格适合小红书内容（时尚、清新、温馨、生活化、网红风格）
2. 详细描述场景、人物、动作、表情、服饰、配色、光线、构图
3. 突出小红书的视觉特点：明亮、温暖、有质感、有氛围感
4. 长度控制在80-150字
5. 可以包含中文文字元素（如果需要）
6. 注重细节和情感传达

格式示例：
"一位年轻女孩坐在咖啡厅靠窗位置，阳光从侧面洒进来，温暖柔和。她穿着米色针织衫，手里拿着拿铁咖啡，脸上带着治愈的微笑。桌上摆放着鲜花和笔记本。整体色调温暖明亮，充满文艺气息和生活感。"

直接返回英文提示词，不需要任何额外说明或引号。`,
      ],
      ['user', `标题：{title}\n内容：{content}\n标签：{tags}`],
    ]);

    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    const imagePrompt = await chain.invoke({
      title: outline.title,
      content: outline.content,
      tags: outline.tags.join('、'),
    });

    this.logger.debug(`Generated image prompt length: ${imagePrompt.length}`);

    return imagePrompt;
  }
}
