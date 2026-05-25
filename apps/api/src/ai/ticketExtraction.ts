import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  aiTicketExtractResponseSchema,
  type AiTicketExtractResponse,
  type TicketCategory,
  type TicketPriority
} from "@request-assistant/shared";

const ticketExtractionSchema = aiTicketExtractResponseSchema.omit({ source: true });

export async function extractTicketFields(input: string): Promise<AiTicketExtractResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return mockExtractTicketFields(input);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";

  const response = await client.responses.parse({
    model,
    instructions:
      "Extract a German property-management maintenance ticket from tenant text. Return only the structured fields. Use practical categories and priorities for a Hausverwaltung. Ask follow-up questions for missing operational details like location, access, contact timing, photos, or urgency.",
    input,
    text: {
      format: zodTextFormat(ticketExtractionSchema, "maintenance_ticket_extraction")
    }
  });

  const parsed = response.output_parsed;

  if (!parsed) {
    throw new Error("OpenAI did not return a parsed ticket extraction.");
  }

  return aiTicketExtractResponseSchema.parse({
    ...parsed,
    source: "openai"
  });
}

function mockExtractTicketFields(input: string): AiTicketExtractResponse {
  const lower = input.toLowerCase();
  const category = inferCategory(lower);
  const priority = inferPriority(lower, category);
  const roomOrLocation = inferLocation(lower);
  const missingFields: string[] = [];
  const followUpQuestions: string[] = [];

  if (!roomOrLocation) {
    missingFields.push("roomOrLocation");
    followUpQuestions.push("Which room or exact location is affected?");
  }

  if (!lower.includes("photo") && !lower.includes("foto") && !lower.includes("bild")) {
    missingFields.push("photos");
    followUpQuestions.push("Can you add a photo or short note describing visible damage?");
  }

  if (!lower.includes("access") && !lower.includes("zugang") && !lower.includes("key") && !lower.includes("schluessel")) {
    missingFields.push("accessDetails");
    followUpQuestions.push("How can a service provider access the apartment or affected area?");
  }

  return {
    suggestedTitle: makeTitle(input, category),
    cleanDescription: input.trim(),
    category,
    priority,
    roomOrLocation,
    missingFields,
    followUpQuestions,
    summary: `Maintenance request categorized as ${category.replaceAll("_", " ")} with ${priority} priority.`,
    confidence: 0.72,
    source: "mock"
  };
}

function inferCategory(input: string): TicketCategory {
  if (input.includes("heating") || input.includes("heat") || input.includes("heizung") || input.includes("radiator")) return "heating";
  if (input.includes("water") || input.includes("leak") || input.includes("sink") || input.includes("wasser")) return "water_damage";
  if (input.includes("internet") || input.includes("wifi") || input.includes("tv") || input.includes("signal")) return "internet_tv";
  if (input.includes("electric") || input.includes("power") || input.includes("strom") || input.includes("light")) return "electricity";
  if (input.includes("clean") || input.includes("trash") || input.includes("muell") || input.includes("reinigung")) return "cleaning";
  if (input.includes("door") || input.includes("lock") || input.includes("key") || input.includes("zugang")) return "access";
  if (input.includes("noise") || input.includes("laerm") || input.includes("loud")) return "noise";
  return "general_repair";
}

function inferPriority(input: string, category: TicketCategory): TicketPriority {
  if (input.includes("urgent") || input.includes("emergency") || input.includes("not working at all") || input.includes("flood")) return "urgent";
  if (category === "water_damage" || category === "heating") return "high";
  if (category === "internet_tv" || category === "noise") return "medium";
  return "medium";
}

function inferLocation(input: string) {
  const knownLocations = [
    "bathroom",
    "kitchen",
    "living room",
    "bedroom",
    "hallway",
    "balcony",
    "basement",
    "bad",
    "kueche",
    "wohnzimmer",
    "schlafzimmer",
    "flur",
    "balkon",
    "keller"
  ];

  return knownLocations.find((location) => input.includes(location)) ?? null;
}

function makeTitle(input: string, category: TicketCategory) {
  const firstSentence = input
    .trim()
    .split(/[.!?]/)[0]
    .replace(/\s+/g, " ")
    .slice(0, 90);

  if (firstSentence.length >= 8) return firstSentence;

  return `Maintenance request: ${category.replaceAll("_", " ")}`;
}
