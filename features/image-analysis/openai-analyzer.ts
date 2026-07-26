import type {
  AnalyzableImage,
  ImageAnalysisContext,
  ImageAnalyzer,
  ProposedItem,
} from "./port";
import type { LensShoppingCandidate } from "./google-lens";
import {
  buildVisionPrompt,
  extractJsonObject,
  isVisionResultClear,
  toProposedItem,
  visionProductSchema,
} from "./vision-shared";

const OPENAI_MODEL = "gpt-4o";

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function analyzeOneWithOpenAI(
  image: AnalyzableImage,
  context: ImageAnalysisContext,
  lensCandidates: LensShoppingCandidate[] = [],
): Promise<{ item: ProposedItem; clear: boolean }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("MISSING_OPENAI_API_KEY");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: buildVisionPrompt(context, lensCandidates) },
            {
              type: "image_url",
              image_url: {
                url: image.dataUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
    }),
  });

  const body = (await res.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  if (!res.ok) {
    throw new Error(body.error?.message ?? `OPENAI_HTTP_${res.status}`);
  }

  const text = body.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("OPENAI_EMPTY_RESPONSE");
  }

  const parsed = visionProductSchema.parse(extractJsonObject(text));
  return {
    item: toProposedItem(image, parsed, lensCandidates.length),
    clear: isVisionResultClear(parsed),
  };
}

export const openAIImageAnalyzer: ImageAnalyzer = {
  async analyze(images, context) {
    const items: ProposedItem[] = [];
    for (const image of images) {
      const { item } = await analyzeOneWithOpenAI(image, context, []);
      items.push(item);
    }
    return items;
  },
};
