import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  formatServiceSlot,
  formatUsd,
  type ZenVidaService,
} from '../common/zenvida-catalog';
import { ServiceId } from '../database/enums/service-id.enum';
import { ProductsService } from '../products/products.service';

export interface AiResponse {
  text: string;
  action: 'none' | 'show_services' | 'end_conversation';
  serviceIds: string[];
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

const SYSTEM_PROMPT = `You are the WhatsApp assistant for ZenVida, a premium wellness studio in Madrid.
Your goal is to help customers book services and answer questions briefly and warmly.

LANGUAGE: Always write customer-facing messages in English only — even if the user writes in Spanish or another language.

Service categories and offerings:
{{SERVICES}}

ALWAYS respond with valid JSON in this exact format (no markdown, no code blocks):
{"text":"Your short, friendly message in English (2-3 sentences max)","action":"none","serviceIds":[]}

Valid values for "action":
- "none" → informational reply or general greeting
- "show_services" → when the user wants to book, see prices, make an appointment, or mentions any service or category → include the matching serviceIds from the catalog
- "end_conversation" → when the user wants to cancel, say goodbye, or leave

Rules:
- Keep responses concise, friendly, and in English
- "serviceIds" must only contain IDs from the available services list
- If the user mentions astrology, reiki, sound healing, recovery, meditation, yoga, wellness, training, booking, price, or appointment → use action "show_services"
- If no specific service matches, return all services with action "show_services"`;

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly modelName: string;
  private readonly chatHistories = new Map<string, ChatMessage[]>();
  private systemInstruction = '';
  private serviceCatalog: ZenVidaService[] = [];

  constructor(
    config: ConfigService,
    private readonly products: ProductsService,
  ) {
    const apiKey = config.getOrThrow<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = config.get<string>('GEMINI_MODEL', 'gemini-2.5-flash');
  }

  async onModuleInit(): Promise<void> {
    await this.refreshCatalog();
  }

  private async refreshCatalog(): Promise<void> {
    const categories = await this.products.listCategories();
    this.serviceCatalog = categories.flatMap((category) => category.services);

    const servicesJson = JSON.stringify(
      categories.map((category) => ({
        category: category.name,
        services: category.services.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          price: formatUsd(s.priceCents),
          deposit: formatUsd(s.depositCents),
          durationMinutes: s.durationMinutes,
          scheduledAt: formatServiceSlot(s.scheduledAt),
          currency: s.currency,
        })),
      })),
      null,
      2,
    );
    this.systemInstruction = SYSTEM_PROMPT.replace(
      '{{SERVICES}}',
      servicesJson,
    );
  }

  async processMessage(phone: string, userText: string): Promise<AiResponse> {
    if (this.serviceCatalog.length === 0) {
      await this.refreshCatalog();
    }

    const local = this.matchLocalIntent(userText);
    if (local) {
      return local;
    }

    const history = this.chatHistories.get(phone) ?? [];

    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: this.systemInstruction,
      generationConfig: { responseMimeType: 'application/json' },
    });

    const chat = model.startChat({ history });

    let raw: string;
    try {
      const result = await chat.sendMessage(userText);
      raw = result.response.text().trim();
    } catch (err) {
      this.logger.error('Gemini API error', err);
      const fallback = this.matchLocalIntent(userText);
      if (fallback) {
        return fallback;
      }
      return {
        text: 'Sorry, our assistant is temporarily unavailable. Please browse our services below or try again shortly.',
        action: 'show_services',
        serviceIds: [],
      };
    }

    history.push(
      { role: 'user', parts: [{ text: userText }] },
      { role: 'model', parts: [{ text: raw }] },
    );
    if (history.length > 20) history.splice(0, 2);
    this.chatHistories.set(phone, history);

    const validIds = new Set(this.serviceCatalog.map((s) => s.id as string));

    try {
      const parsed = JSON.parse(raw) as AiResponse;
      parsed.serviceIds = (parsed.serviceIds ?? []).filter((id) =>
        validIds.has(id),
      );
      return parsed;
    } catch {
      this.logger.warn('Gemini returned non-JSON response', {
        raw: raw.slice(0, 200),
      });
      return { text: raw, action: 'none', serviceIds: [] };
    }
  }

  clearHistory(phone: string): void {
    this.chatHistories.delete(phone);
  }

  private matchLocalIntent(userText: string): AiResponse | null {
    const normalized = this.normalizeText(userText);

    if (/\b(goodbye|bye|see you|stop chatting|end chat)\b/.test(normalized)) {
      return {
        text: 'Thank you for chatting with ZenVida! We hope to see you soon.',
        action: 'end_conversation',
        serviceIds: [],
      };
    }

    const titleMatches = this.serviceCatalog
      .filter((service) =>
        normalized.includes(this.normalizeText(service.title)),
      )
      .sort((a, b) => b.title.length - a.title.length);

    if (titleMatches.length > 0) {
      const service = titleMatches[0];
      return {
        text: this.formatServiceDetails(service),
        action: 'show_services',
        serviceIds: [service.id],
      };
    }

    const keywordServiceIds = this.matchServicesByKeywords(normalized);
    if (keywordServiceIds.length > 0) {
      if (keywordServiceIds.length === 1) {
        const service = this.serviceCatalog.find(
          (s) => s.id === keywordServiceIds[0],
        );
        if (service) {
          return {
            text: this.formatServiceDetails(service),
            action: 'show_services',
            serviceIds: [service.id],
          };
        }
      }
      return {
        text: 'Here are the ZenVida services that match your request — pick a category to book:',
        action: 'show_services',
        serviceIds: keywordServiceIds,
      };
    }

    const wantsCatalog =
      /\b(book|booking|appointment|price|prices|cost|services|catalog|schedule|available|detail|details|info|tell me)\b/.test(
        normalized,
      ) ||
      /\b(wellness|meditation|yoga|reiki|astrology|healing|recovery|training)\b/.test(
        normalized,
      );

    if (wantsCatalog) {
      return {
        text: 'Welcome to ZenVida! Here are our services — pick a category to explore:',
        action: 'show_services',
        serviceIds: [],
      };
    }

    return null;
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private formatServiceDetails(service: ZenVidaService): string {
    return (
      `*${service.title}*\n\n` +
      `${service.description}\n\n` +
      `${service.durationMinutes} min · ${formatServiceSlot(service.scheduledAt)}\n` +
      `Price: ${formatUsd(service.priceCents)} · Deposit: ${formatUsd(service.depositCents)}\n\n` +
      `Tap below to browse and book.`
    );
  }

  private matchServicesByKeywords(normalized: string): ServiceId[] {
    const rules: Array<{ pattern: RegExp; serviceIds: ServiceId[] }> = [
      {
        pattern: /\bwellness consultation\b/,
        serviceIds: [ServiceId.WellnessConsultation],
      },
      {
        pattern: /\b(corporate wellness|team wellness)\b/,
        serviceIds: [ServiceId.CorporateWellness],
      },
      {
        pattern: /\b(astrology|natal chart|birth chart|horoscope)\b/,
        serviceIds: [
          ServiceId.NatalChartReading,
          ServiceId.CompatibilityReading,
          ServiceId.YearAheadForecast,
        ],
      },
      {
        pattern: /\b(reiki)\b/,
        serviceIds: [
          ServiceId.ReikiHealingSession,
          ServiceId.ReikiLevel1,
          ServiceId.ReikiLevel2,
          ServiceId.ReikiMasterTraining,
          ServiceId.ReikiTeacherCert,
        ],
      },
      {
        pattern:
          /\b(sound healing|singing bowl|gong|tibetan bowl|crystal bowl)\b/,
        serviceIds: [
          ServiceId.TibetanBowlSession,
          ServiceId.CrystalBowlHealing,
          ServiceId.GongMeditation,
        ],
      },
      {
        pattern: /\b(recovery|sauna|cold plunge|compression)\b/,
        serviceIds: [
          ServiceId.InfraredSauna,
          ServiceId.ColdPlunge,
          ServiceId.CompressionTherapy,
        ],
      },
      {
        pattern: /\b(meditation|mindfulness)\b/,
        serviceIds: [
          ServiceId.GuidedMeditation,
          ServiceId.OutdoorMeditation,
          ServiceId.GongMeditation,
        ],
      },
      {
        pattern: /\b(yoga)\b/,
        serviceIds: [ServiceId.MobileYoga],
      },
      {
        pattern: /\b(coaching|life coach)\b/,
        serviceIds: [ServiceId.LifeCoaching],
      },
      {
        pattern: /\bwellness\b/,
        serviceIds: [
          ServiceId.WellnessConsultation,
          ServiceId.CorporateWellness,
        ],
      },
    ];

    const matched = new Set<ServiceId>();
    for (const rule of rules) {
      if (rule.pattern.test(normalized)) {
        for (const id of rule.serviceIds) {
          matched.add(id);
        }
      }
    }
    return [...matched];
  }
}
