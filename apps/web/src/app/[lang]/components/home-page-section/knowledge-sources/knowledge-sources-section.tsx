"use client";

import { cn } from "@scibly/ui/utils";
import { BookOpen, GitPullRequest, Mic } from "lucide-react";

import {
  MarketingSection,
  MarketingSectionHeader,
} from "@/app/[lang]/components/marketing-section-content";
import { useInViewOnce } from "@/components/in-view-reveal";

import { ArtifactsCanvas } from "./artifacts-canvas";
import { type KnowledgeSourcesDictionary } from "./i18n/knowledge-sources.types";
import { InterviewCanvas } from "./interview-canvas";
import { KnowledgeSourceCard } from "./knowledge-source-card";
import {
  INTERVIEW_TONE,
  LESSON_TONE,
  WORK_TONE,
} from "./knowledge-sources-tones";
import { LessonCanvas } from "./lesson-canvas";

export function KnowledgeSourcesSection({
  t,
}: {
  t: KnowledgeSourcesDictionary;
}) {
  const { ref, inView } = useInViewOnce<HTMLElement>(0.15);

  const cards = [
    {
      key: "interview",
      tone: INTERVIEW_TONE,
      icon: <Mic size={15} strokeWidth={2.4} />,
      title: t.interview.title,
      description: t.interview.description,
      canvas: <InterviewCanvas t={t.interview} />,
    },
    {
      key: "artifacts",
      tone: WORK_TONE,
      icon: <GitPullRequest size={15} strokeWidth={2.4} />,
      title: t.artifacts.title,
      description: t.artifacts.description,
      canvas: (
        <ArtifactsCanvas t={t.artifacts} capturedLabel={t.capturedLabel} />
      ),
    },
    {
      key: "lesson",
      tone: LESSON_TONE,
      icon: <BookOpen size={15} strokeWidth={2.4} />,
      title: t.lesson.title,
      description: t.lesson.description,
      canvas: <LessonCanvas knowledge={t.knowledge} t={t.lesson} />,
    },
  ];

  return (
    <MarketingSection
      ref={ref}
      id="knowledge-sources"
      aria-labelledby="knowledge-sources-heading"
      className={cn("sc-bento", inView && "sc-bento-ready")}
      atmosphere={null}
    >
      <MarketingSectionHeader
        titleId="knowledge-sources-heading"
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.subtitle}
      />

      <div className="mt-[clamp(48px,7vh,72px)] grid gap-5 md:grid-cols-3">
        {cards.map((card, index) => (
          <KnowledgeSourceCard
            key={card.key}
            tone={card.tone}
            icon={card.icon}
            title={card.title}
            description={card.description}
            canvas={card.canvas}
            delayMs={120 + index * 140}
          />
        ))}
      </div>
    </MarketingSection>
  );
}
