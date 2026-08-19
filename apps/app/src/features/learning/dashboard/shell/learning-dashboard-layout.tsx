import { getFullDictionary } from "@/i18n/dictionaries";

import LearnTabs from "./components/learn-tabs";

export async function LearningDashboardLayout({
  children,
  lang,
}: {
  children: React.ReactNode;
  lang: string;
}) {
  const dict = await getFullDictionary(lang);
  const t = dict.learn.layout;

  return (
    <div className="flex w-full flex-col gap-8 pb-20">
      <div>
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
          {t.title}
        </h1>
        <p className="text-muted-foreground mt-2 text-[15px]">{t.subtitle}</p>
      </div>
      <LearnTabs />
      {children}
    </div>
  );
}
