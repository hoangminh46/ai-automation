"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  FlaskConical,
  Send,
  Bot,
  User,
  RotateCcw,
  ChevronDown,
  AlertCircle,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";
import { useTenantStore } from "@/store/tenant-store";
import { useAgentStore } from "@/store/agent-store";
import { Agent } from "@/lib/services/agent.service";
import { chatService } from "@/lib/services/chat.service";
import { LoadingScreen } from "@/components/ui/loading-screen";

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  content: string;
  agentName?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  timestamp: Date;
}

export default function PlaygroundPage() {
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const tenantHasLoaded = useTenantStore((state) => state.hasLoaded);

  const agents = useAgentStore((state) => state.agents);
  const loadedForTenantId = useAgentStore((state) => state.loadedForTenantId);
  const fetchAgents = useAgentStore((state) => state.fetchAgents);

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const tenantId = activeTenant?.id;
  useEffect(() => {
    if (!tenantId) return;
    fetchAgents(tenantId);
  }, [tenantId, fetchAgents]);

  // Auto-select first active agent
  useEffect(() => {
    if (!selectedAgent && agents.length > 0) {
      const activeAgent = agents.find((a) => a.isActive) || agents[0];
      setSelectedAgent(activeAgent);
    }
  }, [agents, selectedAgent]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsAgentDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectAgent = useCallback(
    (agent: Agent) => {
      setSelectedAgent(agent);
      setIsAgentDropdownOpen(false);

      // Reset conversation nếu đổi agent
      if (selectedAgent?.id !== agent.id) {
        setMessages([]);
        setConversationId(null);
        setError(null);
      }
    },
    [selectedAgent],
  );

  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || !activeTenant || !selectedAgent || isSending)
      return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsSending(true);
    setError(null);

    try {
      const response = await chatService.sendMessage(activeTenant.id, {
        agentId: selectedAgent.id,
        message: userMessage.content,
        conversationId: conversationId || undefined,
        customerName: "Playground Tester",
      });

      setConversationId(response.conversationId);

      const botMessage: ChatMessage = {
        id: response.messageId,
        role: "bot",
        content: response.reply,
        agentName: response.agentName,
        usage: response.usage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể gửi tin nhắn";
      setError(message);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [inputValue, activeTenant, selectedAgent, isSending, conversationId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // Loading gates
  if (
    !tenantHasLoaded ||
    (activeTenant && loadedForTenantId !== activeTenant.id)
  ) {
    return <LoadingScreen text="Đang tải Playground..." />;
  }

  if (!activeTenant) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertCircle className="w-10 h-10 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Chưa chọn Cửa hàng
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Vui lòng tạo hoặc chọn một Cửa hàng ở trang Tổng quan trước.
        </p>
      </div>
    );
  }

  const activeAgents = agents.filter((a) => a.isActive);
  const totalTokens = messages.reduce(
    (sum, m) => sum + (m.usage?.totalTokens || 0),
    0,
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl shadow-lg shadow-violet-500/20">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Playground
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              Test Bot AI với Knowledge RAG thực tế
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Token counter */}
          {totalTokens > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-xs font-medium">
              <Zap className="w-3.5 h-3.5" />
              {totalTokens.toLocaleString()} tokens
            </div>
          )}

          {/* Agent Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-violet-400 dark:hover:border-violet-500 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200 min-w-[160px]"
            >
              <Bot className="w-4 h-4 text-violet-500 shrink-0" />
              <span className="truncate max-w-[120px]">
                {selectedAgent?.name || "Chọn Bot"}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {isAgentDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-20 py-1 max-h-64 overflow-y-auto">
                {activeAgents.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-slate-500">
                    Chưa có Bot nào đang hoạt động
                  </p>
                ) : (
                  activeAgents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => handleSelectAgent(agent)}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${
                        selectedAgent?.id === agent.id
                          ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <p className="font-medium truncate">{agent.name}</p>
                      {agent.persona && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {agent.persona}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* New Conversation */}
          <button
            onClick={handleNewConversation}
            className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 dark:hover:text-violet-400 rounded-xl transition-all"
            title="Cuộc trò chuyện mới"
          >
            <RotateCcw className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-violet-500 dark:text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {selectedAgent
                ? `Thử trò chuyện với ${selectedAgent.name}`
                : "Chọn Bot để bắt đầu"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
              {selectedAgent
                ? "Gõ tin nhắn bên dưới để test Bot AI. Tin nhắn sẽ đi qua pipeline RAG thật — bao gồm Knowledge Search nếu đã upload tài liệu."
                : "Chọn một Bot AI từ dropdown ở góc phải để bắt đầu thử nghiệm."}
            </p>
            {selectedAgent?.greeting && (
              <div className="mt-6 px-4 py-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl text-sm text-slate-600 dark:text-slate-300 max-w-md italic">
                &quot;{selectedAgent.greeting}&quot;
              </div>
            )}
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "bot" && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={`max-w-[75%] ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-2xl rounded-tr-md"
                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl rounded-tl-md"
                } px-4 py-3 shadow-sm`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>

                {/* Token usage (only for bot messages) */}
                {msg.usage && (
                  <div
                    className={`flex items-center gap-2 mt-2 pt-2 border-t text-[10px] ${
                      msg.role === "user"
                        ? "border-blue-500/30 text-blue-200"
                        : "border-slate-200 dark:border-slate-700 text-slate-400"
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    <span>
                      {msg.usage.promptTokens}↓ {msg.usage.completionTokens}↑ ={" "}
                      {msg.usage.totalTokens} tokens
                    </span>
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isSending && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 mb-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1 truncate">{error}</span>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedAgent
                  ? `Nhắn tin cho ${selectedAgent.name}...`
                  : "Chọn Bot trước khi nhắn..."
              }
              disabled={!selectedAgent || isSending}
              rows={1}
              className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 pr-12 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ minHeight: "44px", maxHeight: "120px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || !selectedAgent || isSending}
            className="p-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl transition-all shadow-lg shadow-violet-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none shrink-0"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">
          Enter để gửi · Shift+Enter để xuống dòng · Pipeline: Context → Quota →
          Knowledge RAG → LLM
        </p>
      </div>
    </div>
  );
}
