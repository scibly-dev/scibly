import { KnowledgeTopicScreen } from "@/features/knowledge/topic-screen";

export default function KnowledgeTopicPage(props: {
  params: Promise<{ lang: string; orgSlug: string; topicId: string }>;
}) {
  return <KnowledgeTopicScreen {...props} />;
}
