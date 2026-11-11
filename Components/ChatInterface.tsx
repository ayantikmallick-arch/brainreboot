"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import ParticleBackground from "@/Components/ParticleBackground";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type Chat = {
  id: string;
  title: string;
  timestamp: number;
  project?: string;
  messages: Message[];
};

interface AttachedFile {
  name: string;
  size: number;
  content: string;
  type: string;
}

interface ChatInterfaceProps {
  initialChatId?: string;
}


// Safe Markdown Preprocessor for Normalizing Tables and HTML tags
function formatMarkdownResponse(content: string): string {
  if (!content) return "";

  // 1. Normalize linebreaks & HTML tags safely without raw HTML rendering
  let text = content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<hr\s*\/?>/gi, "\n\n---\n\n")
    .replace(/<b>(.*?)<\/b>/gi, "**$1**")
    .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<i>(.*?)<\/i>/gi, "*$1*")
    .replace(/<em>(.*?)<\/em>/gi, "*$1*")
    .replace(/<code>(.*?)<\/code>/gi, "`$1`")
    .replace(/&nbsp;/gi, " ");

  // 2. Ensure Markdown tables preceded by text have a leading blank line so GFM parser recognizes them
  text = text.replace(/([^\n])\n(\|[^\n]+\|[ \t]*\n\|[\s:-]+\|)/g, "$1\n\n$2");

  // 3. Ensure Markdown tables followed by text have a trailing blank line
  text = text.replace(/(\|[^\n]+\|)\n([^\|\n\s])/g, "$1\n\n$2");

  return text;
}

export default function ChatInterface({ initialChatId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(initialChatId || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Projects system
  const [projects, setProjects] = useState<string[]>(["General", "Research", "Coding"]);
  const [selectedProject, setSelectedProject] = useState<string>("All");
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  // Attached files
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // User auth state
  const [user, setUser] = useState<User | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Format relative time helper (9m, 2h, 1d, 1mo)
  const formatRelativeTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 30) return `${diffDays}d`;
    return `${diffMonths}mo`;
  };

  // Save history to localStorage
  const saveHistoryToStorage = (updated: Chat[]) => {
    setChatHistory(updated);
    try {
      localStorage.setItem("chatHistory", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save chat history", e);
    }
  };

  // Switch chat
  const handleSelectChat = (chat: Chat) => {
    setCurrentChatId(chat.id);
    setMessages(chat.messages);
    setSidebarOpen(false);
    window.history.pushState(null, "", `/chat/${chat.id}`);
  };

  // Start new chat
  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setInput("");
    setAttachedFiles([]);
    setSidebarOpen(false);
    window.history.pushState(null, "", "/chat");
  };

  // Delete chat
  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    const updated = chatHistory.filter((c) => c.id !== chatId);
    saveHistoryToStorage(updated);
    if (currentChatId === chatId) {
      handleNewChat();
    }
  };

  // Create new project
  const handleCreateProject = () => {
    const trimmed = newProjectName.trim();
    if (!trimmed) return;
    if (!projects.includes(trimmed)) {
      const updated = [...projects, trimmed];
      setProjects(updated);
      try {
        localStorage.setItem("brainflowProjects", JSON.stringify(updated));
      } catch {}
    }
    setNewProjectName("");
    setNewProjectModalOpen(false);
  };

  // File Upload Handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < Math.min(files.length, 4); i++) {
      const file = files[i];
      if (file.size > 8 * 1024 * 1024) {
        alert(`File ${file.name} exceeds the 8MB limit.`);
        continue;
      }

      const reader = new FileReader();
      const isText = file.type.startsWith("text/") || 
                     file.name.match(/\.(txt|md|js|ts|tsx|jsx|json|py|html|css|csv|xml|yaml|yml|sql)$/i);

      if (isText) {
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setAttachedFiles((prev) => [
            ...prev,
            { name: file.name, size: file.size, content, type: "text" },
          ]);
        };
        reader.readAsText(file);
      } else {
        // Base64 or binary placeholder
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setAttachedFiles((prev) => [
            ...prev,
            { name: file.name, size: file.size, content, type: file.type || "file" },
          ]);
        };
        reader.readAsDataURL(file);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Format Title Case helper
  const toTitleCase = (str: string) => {
    const words = str.trim().split(/\s+/).slice(0, 5);
    return words
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const rawInput = (textToSend || input).trim();
    if ((!rawInput && attachedFiles.length === 0) || loading) return;

    // Build compound message with any attachments
    let fullUserMessage = rawInput;
    if (attachedFiles.length > 0) {
      const attachmentSummaries = attachedFiles
        .map((f) => {
          if (f.type === "text") {
            return `[File: ${f.name} (${Math.round(f.size / 1024)} KB)]\n\`\`\`\n${f.content.slice(0, 10000)}\n\`\`\``;
          }
          return `[Attached File: ${f.name} (${Math.round(f.size / 1024)} KB)]`;
        })
        .join("\n\n");

      fullUserMessage = fullUserMessage
        ? `${fullUserMessage}\n\n${attachmentSummaries}`
        : attachmentSummaries;
    }

    setInput("");
    setAttachedFiles([]);

    let chatId = currentChatId;
    let isBrandNewChat = false;

    if (!chatId) {
      chatId = Date.now().toString();
      isBrandNewChat = true;
      setCurrentChatId(chatId);
      window.history.pushState(null, "", `/chat/${chatId}`);

      const initialTitle = toTitleCase(rawInput || attachedFiles[0]?.name || "New Chat");

      const newChat: Chat = {
        id: chatId,
        title: initialTitle,
        timestamp: Date.now(),
        project: selectedProject !== "All" ? selectedProject : "General",
        messages: [{ role: "user", content: fullUserMessage }],
      };

      const updated = [newChat, ...chatHistory];
      saveHistoryToStorage(updated);
    } else {
      const updated = chatHistory.map((c) =>
        c.id === chatId
          ? {
              ...c,
              timestamp: Date.now(),
              messages: [...c.messages, { role: "user" as const, content: fullUserMessage }],
            }
          : c
      );
      saveHistoryToStorage(updated);
    }

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: fullUserMessage },
    ];
    setMessages(newMessages);
    setLoading(true);

    // Auto-name sidebar conversation using first message in Title Case
    if (isBrandNewChat) {
      fetch("/api/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: rawInput || attachedFiles[0]?.name || "Discussion" }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.title) {
            setChatHistory((prev) => {
              const updated = prev.map((c) =>
                c.id === chatId ? { ...c, title: data.title } : c
              );
              try {
                localStorage.setItem("chatHistory", JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }
        })
        .catch(() => {});
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          stream: true,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${response.status} from server`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/event-stream") && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "" },
        ]);

        let streamBuffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          streamBuffer += decoder.decode(value, { stream: true });
          const lines = streamBuffer.split("\n");
          streamBuffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const dataStr = trimmed.slice(5).trim();
            if (dataStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === "chunk" && parsed.text) {
                assistantContent += parsed.text;

                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                    updated[lastIdx] = {
                      role: "assistant",
                      content: assistantContent,
                    };
                  }
                  return updated;
                });
              } else if (parsed.type === "error") {
                throw new Error(parsed.error);
              }
            } catch {
              // Ignore partial chunks
            }
          }
        }

        const finalAssistantContent = assistantContent || "I didn't receive a response. Please try again.";
        setChatHistory((prev) => {
          const updated = prev.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: [
                    ...c.messages,
                    { role: "assistant" as const, content: finalAssistantContent },
                  ],
                }
              : c
          );
          localStorage.setItem("chatHistory", JSON.stringify(updated));
          return updated;
        });
      } else {
        const data = await response.json();
        const assistantText = data.text || "No response received.";

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: assistantText },
        ]);

        setChatHistory((prev) => {
          const updated = prev.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: [
                    ...c.messages,
                    { role: "assistant" as const, content: assistantText },
                  ],
                }
              : c
          );
          localStorage.setItem("chatHistory", JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err: any) {
      console.error("[Chat Error]:", err);
      const errorMsg = `Error: ${err.message || "Failed to process request."}`;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errorMsg },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Load saved projects
    try {
      const savedProjects = localStorage.getItem("brainflowProjects");
      if (savedProjects) {
        setProjects(JSON.parse(savedProjects));
      }
    } catch {}

    // Load saved chats
    const savedChats = localStorage.getItem("chatHistory");
    if (savedChats) {
      try {
        const parsed: Chat[] = JSON.parse(savedChats);
        setChatHistory(parsed);

        if (initialChatId) {
          const found = parsed.find((c) => c.id === initialChatId);
          if (found) {
            setCurrentChatId(found.id);
            setMessages(found.messages);
          }
        }
      } catch (e) {
        console.error("Failed to load chat history", e);
      }
    }

    const firstMsg = localStorage.getItem("firstMessage");
    if (firstMsg) {
      localStorage.removeItem("firstMessage");
      handleSendMessage(firstMsg);
    }
  }, [initialChatId]);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Filter chats by project and search query
  const filteredChats = chatHistory.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = selectedProject === "All" || c.project === selectedProject;
    return matchesSearch && matchesProject;
  });

  const currentChat = chatHistory.find((c) => c.id === currentChatId);
  const currentTitle = currentChat ? currentChat.title : "New chat";

  return (
    <main className="h-screen h-[100dvh] w-screen bg-[#0a0e1a] text-[#eef2ff] flex overflow-hidden relative selection:bg-[#8b5cf6]/30 selection:text-[#22c1ff]">
      {/* Dynamic Motion Constellation Background */}
      <ParticleBackground />

      {/* Hidden File Input for Attachment */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        className="hidden"
      />

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity"
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`
          fixed md:static top-0 left-0 h-full w-[280px] sm:w-[290px]
          bg-[#0c1020]/90 border-r border-[#232b48] flex flex-col
          transform transition-transform duration-300 z-40 backdrop-blur-xl
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-[#232b48] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.45)] overflow-hidden p-0.5 flex-shrink-0">
              <Image src="/logo.png" alt="BrainFlow" width={30} height={30} className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-1 font-bold text-lg tracking-tight font-display">
              <span className="text-[#22c1ff]">Brain</span>
              <span className="text-[#c026d3]">Flow</span>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 text-[#8b93b8] hover:text-white rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-4 pt-3 pb-2">
          <button
            onClick={handleNewChat}
            className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[#3a4470] hover:border-[#8b5cf6] hover:bg-[rgba(139,92,246,0.12)] text-[#eef2ff] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
          >
            <span>+</span>
            <span>New chat</span>
          </button>

          {/* Search bar */}
          <div className="mt-3 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your chats..."
              className="w-full px-3 py-2 rounded-xl bg-[#0d1226] border border-[#232b48] text-xs text-[#eef2ff] placeholder-[#8b93b8] outline-none focus:border-[#8b5cf6] transition"
            />
          </div>
        </div>

        {/* Guest Warning Notice (If user is not signed in) */}
        {!user && (
          <div className="mx-3 my-2 p-2.5 rounded-xl bg-[#ff5d7a]/10 border border-[#ff5d7a]/30 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#ff5d7a] mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
              </svg>
              <span>Guest Session</span>
            </div>
            <p className="text-[11px] text-[#8b93b8] leading-tight mb-2">
              Your queries won&apos;t be saved or synced unless you sign in.
            </p>
            <Link
              href="/signin"
              className="block text-center py-1.5 px-2 bg-gradient-to-r from-[#22c1ff] via-[#8b5cf6] to-[#c026d3] text-white rounded-lg font-bold text-[11px] shadow-sm hover:brightness-110 transition"
            >
              Sign in to Save
            </Link>
          </div>
        )}

        {/* Navigation Categories */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {/* Projects Section */}
          <div className="relative">
            <div className="flex items-center justify-between px-2 py-1 text-xs text-[#8b93b8] font-medium">
              <div className="flex items-center gap-1.5">
                <span>Projects</span>
                {selectedProject !== "All" && (
                  <span className="text-[10px] bg-[#8b5cf6]/20 text-[#22c1ff] px-1.5 py-0.5 rounded">
                    {selectedProject}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[#8b93b8]">
                {/* Filter Projects Button */}
                <button
                  onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                  title="Filter by Project"
                  className="hover:text-white transition p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Add New Project Button */}
                <button
                  onClick={() => setNewProjectModalOpen(true)}
                  title="Create New Project Folder"
                  className="hover:text-white transition p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M3.75 3A1.75 1.75 0 0 0 2 4.75v3.26a3.235 3.235 0 0 1 1.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0 0 16.25 5h-4.836a.25.25 0 0 1-.177-.073L9.823 3.513A1.75 1.75 0 0 0 8.586 3H3.75ZM3.75 9A1.75 1.75 0 0 0 2 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0 0 18 15.25v-4.5A1.75 1.75 0 0 0 16.25 9H3.75Z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filter Dropdown Popover */}
            {filterMenuOpen && (
              <div className="absolute left-2 top-8 w-48 bg-[#10162a] border border-[#232b48] rounded-xl p-1.5 shadow-2xl z-50 animate-rise text-xs">
                <div className="font-semibold px-2 py-1 text-[#8b93b8] uppercase text-[10px]">
                  Filter Chats:
                </div>
                <button
                  onClick={() => {
                    setSelectedProject("All");
                    setFilterMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                    selectedProject === "All" ? "bg-[#8b5cf6]/30 text-white font-bold" : "text-[#8b93b8] hover:bg-[#161d35] hover:text-white"
                  }`}
                >
                  All Projects
                </button>
                {projects.map((proj) => (
                  <button
                    key={proj}
                    onClick={() => {
                      setSelectedProject(proj);
                      setFilterMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition truncate ${
                      selectedProject === proj ? "bg-[#8b5cf6]/30 text-white font-bold" : "text-[#8b93b8] hover:bg-[#161d35] hover:text-white"
                    }`}
                  >
                    ðŸ“ {proj}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Conversations Section */}
          <div>
            <div className="flex items-center justify-between px-2 py-1 text-xs text-[#8b93b8] font-medium">
              <span>Conversations</span>
              <button onClick={handleNewChat} className="hover:text-white text-sm" title="New Chat">+</button>
            </div>

            {/* List */}
            <div className="space-y-1 mt-1">
              {filteredChats.length === 0 ? (
                <p className="text-xs text-[#4a5484] px-2 py-2 italic">
                  {searchQuery ? "No matches found" : "No conversations yet"}
                </p>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => handleSelectChat(chat)}
                    className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm cursor-pointer transition ${
                      currentChatId === chat.id
                        ? "bg-gradient-to-r from-[rgba(139,92,246,0.22)] to-transparent border border-[rgba(139,92,246,0.35)] text-white font-medium"
                        : "hover:bg-[#161d35] text-[#8b93b8] hover:text-[#eef2ff]"
                    }`}
                  >
                    <span className="truncate flex-1 pr-2 normal-case font-normal text-slate-200">
                      {chat.title}
                    </span>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[11px] text-[#4a5484] group-hover:hidden">
                        {formatRelativeTime(chat.timestamp || Date.now())}
                      </span>
                      <button
                        onClick={(e) => handleDeleteChat(e, chat.id)}
                        className="hidden group-hover:flex p-1 rounded hover:bg-[#ff5d7a]/20 text-[#8b93b8] hover:text-[#ff5d7a] transition"
                        title="Delete chat"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 1 .75.74l.5 7a.75.75 0 1 1-1.498.1l-.5-7a.75.75 0 0 1 .748-.84Zm3.58.74a.75.75 0 0 0-1.498-.1l-.5 7a.75.75 0 0 0 1.498.1l.5-7Z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Footer with User Profile */}
        <div className="p-3 border-t border-[#232b48] bg-[#0c1020]/95 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "Ayantik Mallick"}
                className="w-8 h-8 rounded-full border border-[#8b5cf6] object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#22c1ff] via-[#8b5cf6] to-[#c026d3] text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : "A"}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">
                {user?.displayName || (user?.email ? user.email.split("@")[0] : "Ayantik Mallick")}
              </p>
              <p className="text-[11px] text-[#8b93b8] truncate">
                {user?.email || "ayantakmallick@gmail.com"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {user ? (
              <button
                onClick={() => signOut(auth)}
                className="p-1.5 text-[#8b93b8] hover:text-[#ff5d7a] rounded-lg hover:bg-[#161d35] transition"
                title="Sign out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
              </button>
            ) : (
              <Link
                href="/signin"
                className="p-1.5 text-[#8b93b8] hover:text-white rounded-lg hover:bg-[#161d35] transition"
                title="Sign in"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {/* Top Bar */}
        <header className="h-14 border-b border-[#232b48] px-3 sm:px-6 flex items-center justify-between bg-[#0c1020]/80 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl border border-[#232b48] bg-[#10162a]/90 text-[#8b93b8] hover:text-white hover:border-[#8b5cf6] transition flex-shrink-0"
              title="Open Sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight truncate max-w-[200px] sm:max-w-md normal-case font-display">
              {currentTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-xl border border-[#232b48] text-[#8b93b8] hover:text-white hover:border-[#8b5cf6] hover:bg-[rgba(139,92,246,0.12)] transition"
              title="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Message View Area */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6">
          {messages.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.5)] overflow-hidden p-1 mb-4 animate-breathe">
                <Image
                  src="/logo.png"
                  alt="BrainFlow"
                  width={60}
                  height={60}
                  priority
                  className="w-full h-full object-contain"
                />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold font-display text-white mb-2 tracking-tight">
                What&apos;s on your mind?
              </h2>

              <p className="text-xs sm:text-sm text-[#8b93b8] max-w-md mb-1 leading-relaxed">
                Ask BrainFlow anything &mdash; every conversation is saved to your history automatically.
              </p>

              <p className="text-xs text-[#4a5484] mb-6">
                Made by Ayantik Mallick
              </p>

              {/* Suggestion Chips */}
              <div className="flex flex-wrap gap-2.5 justify-center">
                {[
                  "Explain a tricky concept simply",
                  "Draft an email for me",
                  "Brainstorm project ideas",
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip)}
                    className="px-4 py-2 rounded-full border border-[#232b48] bg-[#161d35]/70 hover:bg-[#161d35] hover:border-[#8b5cf6] text-xs text-[#8b93b8] hover:text-[#eef2ff] transition backdrop-blur-sm"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Conversation Messages */
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((msg, index) => {
                if (msg.role === "user") {
                  return (
                    <div key={index} className="flex justify-end">
                      <div className="max-w-[88%] sm:max-w-[78%] bg-gradient-to-r from-[#22c1ff] via-[#8b5cf6] to-[#c026d3] text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl rounded-br-sm shadow-md font-medium text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                // AI Response
                return (
                  <div key={index} className="flex items-start gap-3 w-full group">
                    <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.35)] overflow-hidden p-0.5 flex-shrink-0 mt-0.5">
                      <Image src="/logo.png" alt="BrainFlow" width={26} height={26} className="w-full h-full object-contain" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="w-full bg-[#161d35]/90 border border-[#232b48] text-[#eef2ff] px-4 sm:px-5 py-3 sm:py-4 rounded-2xl rounded-bl-sm text-xs sm:text-sm leading-relaxed break-words shadow-lg backdrop-blur-sm">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // Tables (Styled for BrainFlow dark theme with horizontal scroll)
                            table: ({ children }) => (
                              <div className="w-full my-4 overflow-x-auto rounded-xl border border-[#232b48] shadow-lg bg-[#0c1020]/90">
                                <table className="w-full border-collapse text-left text-xs sm:text-sm min-w-[320px]">
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children }) => (
                              <thead className="bg-[#10162a] border-b border-[#232b48] text-[#22c1ff] font-semibold">
                                {children}
                              </thead>
                            ),
                            tbody: ({ children }) => (
                              <tbody className="divide-y divide-[#232b48]/60 text-[#eef2ff]">
                                {children}
                              </tbody>
                            ),
                            tr: ({ children }) => (
                              <tr className="transition-colors hover:bg-[#161d35]/60 even:bg-[#0e1326]/40 odd:bg-[#10162a]/20">
                                {children}
                              </tr>
                            ),
                            th: ({ children }) => (
                              <th className="px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs font-bold uppercase tracking-wider text-[#22c1ff] border-r border-[#232b48]/60 last:border-r-0 whitespace-nowrap">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-[#eef2ff]/90 border-r border-[#232b48]/40 last:border-r-0 align-top leading-relaxed">
                                {children}
                              </td>
                            ),

                            // Headings
                            h1: ({ children }) => (
                              <h1 className="text-xl sm:text-2xl font-bold font-display text-white mt-4 mb-2 tracking-tight flex items-center gap-2">
                                <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-[#22c1ff] to-[#8b5cf6] inline-block flex-shrink-0"></span>
                                <span>{children}</span>
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-lg sm:text-xl font-bold font-display text-white mt-3.5 mb-2 tracking-tight flex items-center gap-2">
                                <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-[#8b5cf6] to-[#c026d3] inline-block flex-shrink-0"></span>
                                <span>{children}</span>
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-sm sm:text-base font-bold text-[#22c1ff] mt-3 mb-1.5 font-display">
                                {children}
                              </h3>
                            ),
                            h4: ({ children }) => (
                              <h4 className="text-xs sm:text-sm font-semibold text-[#8b93b8] mt-2 mb-1 uppercase tracking-wider">
                                {children}
                              </h4>
                            ),

                            // Paragraphs
                            p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed text-[#eef2ff]/95">{children}</p>,

                            // Lists
                            ul: ({ children }) => <ul className="list-disc pl-5 my-2.5 space-y-1.5 marker:text-[#8b5cf6]">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-5 my-2.5 space-y-1.5 marker:text-[#22c1ff] marker:font-semibold">{children}</ol>,
                            li: ({ children }) => <li className="text-[#eef2ff] leading-relaxed pl-0.5">{children}</li>,

                            // Blockquotes
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-[#8b5cf6] pl-3.5 py-1.5 italic bg-[#0d1226]/80 rounded-r-xl text-[#8b93b8] my-3 shadow-inner">
                                {children}
                              </blockquote>
                            ),

                            // Divider
                            hr: () => <hr className="border-t border-[#232b48] my-4" />,

                            // Links
                            a: ({ href, children }) => {
                              const isSafe = href && (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:"));
                              return (
                                <a
                                  href={isSafe ? href : "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#22c1ff] underline underline-offset-2 hover:text-[#c026d3] transition font-medium"
                                >
                                  {children}
                                </a>
                              );
                            },

                            // Code blocks & inline code
                            code: ({ className, children, ...props }) => {
                              const isInline = !className && typeof children === "string" && !children.includes("\n");
                              if (isInline) {
                                return (
                                  <code className="bg-[#080b16] text-[#22c1ff] px-1.5 py-0.5 rounded-md text-xs font-mono border border-[#232b48]/60" {...props}>
                                    {children}
                                  </code>
                                );
                              }
                              return (
                                <pre className="bg-[#080b16] border border-[#232b48] rounded-xl p-3.5 sm:p-4 overflow-x-auto my-3 text-xs sm:text-sm font-mono text-[#22c1ff] shadow-inner">
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </pre>
                              );
                            },
                          }}
                        >
                          {formatMarkdownResponse(msg.content)}
                        </ReactMarkdown>
                      </div>

                      {/* Hover action bar */}
                      <div className="flex items-center gap-2 mt-1.5 pl-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => copyToClipboard(msg.content, index)}
                          className="text-[11px] text-[#8b93b8] hover:text-white flex items-center gap-1 transition"
                        >
                          {copiedIndex === index ? (
                            <>
                              <span className="text-green-400 font-bold">✓</span>
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                              </svg>
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* 3 Bouncing Dots Thinking Animation */}
              {loading && (
                <div className="flex items-start gap-3 w-full">
                  <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.35)] overflow-hidden p-0.5 flex-shrink-0 mt-0.5">
                    <Image src="/logo.png" alt="BrainFlow" width={26} height={26} className="w-full h-full object-contain" />
                  </div>

                  <div className="bg-[#161d35]/90 border border-[#232b48] text-[#8b93b8] px-4 py-3 rounded-2xl rounded-bl-sm text-xs flex items-center gap-2">
                    <span className="italic">BrainFlow is thinking</span>
                    <div className="flex items-center gap-1 pl-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] animate-[dotBounce_1.1s_infinite_ease-in-out]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22c1ff] animate-[dotBounce_1.1s_infinite_ease-in-out_0.15s]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c026d3] animate-[dotBounce_1.1s_infinite_ease-in-out_0.3s]"></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Composer Input Bar */}
        <div className="p-2.5 sm:p-5 pb-[max(0.625rem,env(safe-area-inset-bottom))] border-t border-[#232b48] bg-[#0c1020]/80 backdrop-blur-md">
          <div className="max-w-4xl mx-auto">
            {/* Attachment preview strip */}
            {attachedFiles.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-2.5">
                {attachedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-[#161d35] border border-[#232b48] px-3 py-1.5 rounded-xl text-xs text-[#eef2ff]"
                  >
                    <span className="text-[#22c1ff]">ðŸ“„</span>
                    <span className="max-w-[140px] truncate">{file.name}</span>
                    <span className="text-[10px] text-[#8b93b8]">({Math.round(file.size / 1024)} KB)</span>
                    <button
                      onClick={() => removeAttachedFile(idx)}
                      className="text-[#ff5d7a] hover:text-white font-bold ml-1"
                      title="Remove attachment"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 bg-[#0d1226] border border-[#232b48] focus-within:border-[#8b5cf6] focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.15)] rounded-2xl px-3.5 py-2.5 transition"
            >
              {/* Paperclip attachment button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-[#8b93b8] hover:text-[#22c1ff] rounded-lg transition flex-shrink-0"
                title="Attach text or code files (up to 8MB)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                </svg>
              </button>

              {/* Message Input */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={attachedFiles.length > 0 ? "Add your instructions or prompt..." : "Message BrainFlow..."}
                disabled={loading}
                className="flex-1 bg-transparent border-none outline-none text-[#eef2ff] placeholder-[#8b93b8] text-base sm:text-sm leading-relaxed"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={loading || (!input.trim() && attachedFiles.length === 0)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-r from-[#22c1ff] via-[#8b5cf6] to-[#c026d3] text-white flex items-center justify-center hover:brightness-110 active:scale-95 transition shadow-[0_0_15px_rgba(139,92,246,0.4)] disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                title="Send"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 -rotate-45 ml-0.5">
                  <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                </svg>
              </button>
            </form>

            <p className="text-center text-[11px] text-[#4a5484] mt-2.5">
              BrainFlow can make mistakes. Verify important information. Files up to 8MB, 4 per message.
            </p>
          </div>
        </div>
      </section>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-rise">
          <div className="bg-[#10162a] border border-[#232b48] rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#232b48]">
              <h3 className="text-base font-bold text-white font-display">BrainFlow Settings</h3>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-[#8b93b8] hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#8b93b8]">
              <div className="flex justify-between items-center py-1">
                <span>Application</span>
                <span className="text-white font-medium">BrainFlow AI v2.0</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Account Status</span>
                <span className={user ? "text-green-400 font-medium" : "text-[#ff5d7a] font-medium"}>
                  {user ? "Signed In" : "Guest (Not Synced)"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Active User</span>
                <span className="text-white font-medium truncate max-w-[160px]">{user?.email || "Local Guest"}</span>
              </div>
            </div>

            {/* If guest, give prompt to sign in */}
            {!user && (
              <Link
                href="/signin"
                onClick={() => setSettingsOpen(false)}
                className="block text-center py-2 rounded-xl bg-gradient-to-r from-[#22c1ff] via-[#8b5cf6] to-[#c026d3] text-white font-bold text-xs shadow-md"
              >
                Sign in to save &amp; sync chats
              </Link>
            )}

            {/* Clear history option */}
            <div className="pt-2">
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to clear all conversation history?")) {
                    localStorage.removeItem("chatHistory");
                    setChatHistory([]);
                    handleNewChat();
                    setSettingsOpen(false);
                  }
                }}
                className="w-full py-2 rounded-xl border border-[#ff5d7a]/30 text-[#ff5d7a] hover:bg-[#ff5d7a]/10 font-semibold text-xs transition"
              >
                Clear all chats
              </button>
            </div>

            {/* Legal & Compliance Links */}
            <div className="pt-2 border-t border-[#232b48] flex items-center justify-between text-[11px] text-[#4a5484]">
              <Link href="/privacy-policy" target="_blank" className="hover:text-[#8b93b8] transition">Privacy Policy</Link>
              <span>&middot;</span>
              <Link href="/terms-of-service" target="_blank" className="hover:text-[#8b93b8] transition">Terms of Service</Link>
              <span>&middot;</span>
              <Link href="/cookie-policy" target="_blank" className="hover:text-[#8b93b8] transition">Cookie Policy</Link>
            </div>

            <button
              onClick={() => setSettingsOpen(false)}
              className="w-full py-2 rounded-xl bg-[#161d35] hover:bg-[#232b48] text-white font-semibold text-xs transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {newProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-rise">
          <div className="bg-[#10162a] border border-[#232b48] rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#232b48]">
              <h3 className="text-base font-bold text-white font-display">Create New Project</h3>
              <button
                onClick={() => setNewProjectModalOpen(false)}
                className="text-[#8b93b8] hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-[#8b93b8]">
              Organize your conversations into dedicated project folders.
            </p>

            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="e.g. Website Development, Science Research..."
              className="w-full px-3 py-2.5 rounded-xl bg-[#0d1226] border border-[#232b48] text-xs text-[#eef2ff] outline-none focus:border-[#8b5cf6]"
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setNewProjectModalOpen(false)}
                className="flex-1 py-2 rounded-xl border border-[#232b48] text-[#8b93b8] hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#22c1ff] via-[#8b5cf6] to-[#c026d3] text-white text-xs font-bold disabled:opacity-40"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

