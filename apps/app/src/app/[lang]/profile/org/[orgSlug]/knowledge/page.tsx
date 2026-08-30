import { KnowledgeTopicsScreen } from "@/features/knowledge/screen";

export default function KnowledgePage(props: {
  params: Promise<{ lang: string; orgSlug: string }>;
}) {
  return <KnowledgeTopicsScreen {...props} />;
}
