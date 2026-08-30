import { z } from "zod";

const storedRepository = z.object({
  id: z.string().min(1),
  fullName: z.string().min(1),
  pathGlobs: z.array(z.string()).default([]),
});

export type TopicRepository = z.infer<typeof storedRepository>;

export const parseStoredRepositories = (value: unknown): TopicRepository[] =>
  z
    .array(storedRepository.nullable().catch(null))
    .catch([])
    .parse(value)
    .filter((repository) => repository !== null);
