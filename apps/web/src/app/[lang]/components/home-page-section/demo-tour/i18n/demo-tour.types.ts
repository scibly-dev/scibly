export type DemoModelId = "scibly" | "openai" | "anthropic" | "byoai";

export type DemoTourModel = {
  name: string;
  detail: string;
};

export type DemoTourModels = Record<DemoModelId, DemoTourModel>;

export type DemoTourDictionary = {
  placeholder: string;
  sendLabel: string;
  modelMenuLabel: string;
  modelTriggerLabel: string;
  models: DemoTourModels;

  seedPrompt: string;
};
