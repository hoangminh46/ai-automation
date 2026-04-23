"use client";

import { useState, useCallback, useEffect } from "react";
import { useTenantStore } from "@/store/tenant-store";
import { useConversationStore } from "@/store/conversation-store";
import { chatService } from "@/lib/services/chat.service";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { CustomerPanel } from "@/components/chat/CustomerPanel";
import type { MessageItem } from "@/components/chat/types";

export default function ChatCrmPage() {
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const tenantHasLoaded = useTenantStore((state) => state.hasLoaded);

  const conversations = useConversationStore((state) => state.conversations);
  const isLoadingConversations = useConversationStore((state) => state.isLoading);
  const conversationError = useConversationStore((state) => state.error);
  const fetchConversations = useConversationStore((state) => state.fetchConversations);
  const resolveConversation = useConversationStore((state) => state.resolveConversation);
  const handoverToBot = useConversationStore((state) => state.handoverToBot);
  const updateConversationLocally = useConversationStore((state) => state.updateConversationLocally);

  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isHandingOver, setIsHandingOver] = useState(false);

  const tenantId = activeTenant?.id;

  // Step 1: Fetch conversation list when tenant is available
  useEffect(() => {
    if (!tenantId) return;
    fetchConversations(tenantId);
  }, [tenantId, fetchConversations]);

  const selectedConv =
    conversations.find((c) => c.id === selectedConvId) || null;

  // Step 2: Fetch messages when a conversation is selected
  const handleSelectConversation = useCallback(
    async (id: string) => {
      if (!tenantId) return;
      setSelectedConvId(id);
      setMessages([]);
      setMessageError(null);
      setIsLoadingMessages(true);

      try {
        const data = await chatService.getMessages(tenantId, id);
        setMessages(data.messages);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Không thể tải tin nhắn";
        setMessageError(msg);
        console.error("Lỗi tải messages:", err);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [tenantId],
  );

  // Step 3: Resolve conversation (optimistic update in store)
  const handleResolve = useCallback(async () => {
    if (!tenantId || !selectedConvId) return;
    setIsResolving(true);
    await resolveConversation(tenantId, selectedConvId);
    setIsResolving(false);
  }, [tenantId, selectedConvId, resolveConversation]);

  // Step 3b: Handover to Bot
  const handleHandoverToBot = useCallback(async () => {
    if (!tenantId || !selectedConvId) return;
    setIsHandingOver(true);
    await handoverToBot(tenantId, selectedConvId);
    setIsHandingOver(false);
  }, [tenantId, selectedConvId, handoverToBot]);

  // Step 4: Refresh conversation list
  const handleRefresh = useCallback(() => {
    if (!tenantId) return;
    fetchConversations(tenantId, true);
    setSelectedConvId(null);
    setMessages([]);
  }, [tenantId, fetchConversations]);

  // Step 5: Human reply — staff sends message directly
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!tenantId || !selectedConvId) return;
      setSendError(null);

      try {
        const result = await chatService.humanReply(
          tenantId,
          selectedConvId,
          content,
        );

        // Append sent message to local state for instant feedback
        const newMessage: MessageItem = {
          id: result.messageId,
          conversationId: result.conversationId,
          role: result.role,
          content: result.content,
          attachments: [],
          promptTokens: null,
          completionTokens: null,
          feedbackScore: null,
          metadata: {},
          createdAt: result.createdAt,
        };
        setMessages((prev) => [...prev, newMessage]);

        // Optimistic update: status → OPEN + update timestamp (no reload)
        updateConversationLocally(selectedConvId, {
          status: "OPEN",
          lastMessageAt: result.createdAt,
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Không thể gửi tin nhắn";
        setSendError(msg);
        setTimeout(() => setSendError(null), 4000);
        throw err;
      }
    },
    [tenantId, selectedConvId, updateConversationLocally],
  );

  if (!tenantHasLoaded) {
    return <LoadingScreen text="Đang tải..." />;
  }

  if (!activeTenant) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
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

  return (
    <div className="flex h-full">
      {/* Left: Conversation List */}
      <div className="w-80 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col">
        {/* Refresh button */}
        <div className="flex items-center justify-end px-4 pt-3 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isLoadingConversations}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg transition-all disabled:opacity-50"
            title="Làm mới danh sách"
          >
            <RefreshCcw
              className={`w-3.5 h-3.5 ${isLoadingConversations ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Error banner */}
        {conversationError && (
          <div className="mx-3 mb-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-400">
            {conversationError}
          </div>
        )}

        <ConversationList
          conversations={conversations}
          selectedId={selectedConvId}
          onSelect={handleSelectConversation}
          isLoading={isLoadingConversations}
        />
      </div>

      {/* Center: Chat Window */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Message error banner */}
        {messageError && selectedConvId && (
          <div className="px-6 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {messageError}
          </div>
        )}
        <ChatWindow
          conversation={selectedConv}
          messages={messages}
          isLoadingMessages={isLoadingMessages}
          onSendMessage={handleSendMessage}
          sendError={sendError}
        />
      </div>

      {/* Right: Customer Panel — hidden < xl */}
      <div className="w-72 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hidden xl:block">
        <CustomerPanel
          conversation={selectedConv}
          onResolve={handleResolve}
          isResolving={isResolving}
          onHandoverToBot={handleHandoverToBot}
          isHandingOver={isHandingOver}
        />
      </div>
    </div>
  );
}
