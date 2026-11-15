import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AnalysisService {
  private readonly ai: GoogleGenAI;
  private readonly logger = new Logger(AnalysisService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;
    this.ai = new GoogleGenAI({ apiKey });
  }

  async evaluateBotProbability(text: string): Promise<number> {
    try {
      const prompt = `Analyze the following user-submitted text and determine the probability (from 0 to 100) that it is an AI-generated bot response. Return ONLY the integer number. Text to analyze: ${text}`;
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const rawText = response.text || '0';
      const match = rawText.match(/\d+/);
      const score = match ? Number(match[0]) : 0;
      
      this.logger.log(`Gemini AI bot probability: ${score}% for text: "${text.substring(0, 50)}..."`);
      return score;
    } catch (error) {
      this.logger.error('Error evaluating bot probability with Gemini:', error);
      return 0;
    }
  }
}
