import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import { Post, PostDocument } from '../posts/schemas/post.schema';

export interface ChatHistoryItem {
  role: 'user' | 'model';
  parts: { text: string }[];
}

@Injectable()
export class AiService {
  private readonly ai: GoogleGenAI;
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not defined in environment variables or ConfigService');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateChatResponse(
    postId?: string,
    postContext?: string,
    userMessage?: string,
    history: ChatHistoryItem[] = [],
  ): Promise<string> {
    try {
      let fullContent = postContext || '';
      if (postId && isValidObjectId(postId)) {
        try {
          const post = await this.postModel.findById(postId).populate('author', 'username').exec();
          if (post) {
            fullContent = `Title: ${post.title}\nCategory: ${post.category}\nType: ${post.postType}\nContent: ${post.content?.text || ''}\nCode Snippet: ${post.content?.codeSnippet || ''}`;
          }
        } catch (dbErr) {
          this.logger.warn(`Could not fetch post details for ID ${postId}:`, dbErr);
        }
      }

      const systemInstruction = `You are Nexus AI, a helpful assistant. Answer questions specifically based on the provided post context. Keep answers concise.${
        fullContent ? `\n\n[Post Context]:\n${fullContent}` : ''
      }`;

      const sanitizedHistory = (history || [])
        .filter((item) => item && Array.isArray(item.parts) && item.parts.length > 0)
        .map((item) => ({
          role: item.role === 'model' ? 'model' : 'user',
          parts: item.parts.map((p) => ({ text: p.text || '' })),
        }));

      let responseText = '';
      if (this.ai.chats?.create) {
        const chat = this.ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction,
          },
          history: sanitizedHistory,
        });

        const response = await chat.sendMessage({
          message: userMessage || '',
        });
        responseText = response.text || '';
      } else if ((this.ai as any).getGenerativeModel) {
        const model = (this.ai as any).getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction,
        });
        const chat = model.startChat({
          history: sanitizedHistory,
        });
        const response = await chat.sendMessage(userMessage || '');
        responseText = response.response?.text?.() || response.text || '';
      } else {
        throw new Error('No supported Gemini chat client found.');
      }

      return responseText || 'I could not generate a response.';
    } catch (error) {
      console.error('[Gemini API Error]:', error);
      this.logger.error('Error generating AI response:', error);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Gemini response generation failed.',
      );
    }
  }
}

