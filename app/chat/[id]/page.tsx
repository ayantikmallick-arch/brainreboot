import ChatInterface from "@/Components/ChatInterface";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DynamicChatPage({ params }: PageProps) {
  const { id } = await params;
  return <ChatInterface initialChatId={id} />;
}
