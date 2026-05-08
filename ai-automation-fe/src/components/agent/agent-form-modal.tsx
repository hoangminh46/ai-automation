"use client";

import { useState, useEffect } from "react";
import { X, Bot, Sparkles, Globe, BookOpen, Lock } from "lucide-react";
import { Agent, CreateAgentPayload, agentService } from "@/lib/services/agent.service";
import { useChannelStore } from "@/store/channel-store";
import { useKnowledgeStore } from "@/store/knowledge-store";
import { useAgentStore } from "@/store/agent-store";
import { useTenantStore } from "@/store/tenant-store";

interface AgentFormModalProps {
  isOpen: boolean;
  agent: Agent | null;
  onClose: () => void;
  onSubmit: (payload: CreateAgentPayload) => Promise<void>;
  isSubmitting: boolean;
}

export function AgentFormModal({ isOpen, agent, onClose, onSubmit, isSubmitting }: AgentFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <AgentFormInner
        key={agent?.id ?? "create"}
        agent={agent}
        onClose={onClose}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

function AgentFormInner({
  agent,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  agent: Agent | null;
  onClose: () => void;
  onSubmit: (payload: CreateAgentPayload) => Promise<void>;
  isSubmitting: boolean;
}) {
  const isEditMode = !!agent;
  const activeTenant = useTenantStore((s) => s.activeTenant);
  const tenantId = activeTenant?.id;

  const channels = useChannelStore((s) => s.channels);
  const fetchChannels = useChannelStore((s) => s.fetchChannels);
  const documents = useKnowledgeStore((s) => s.documents);
  const fetchDocuments = useKnowledgeStore((s) => s.fetchDocuments);
  const agents = useAgentStore((s) => s.agents);

  // Form fields
  const [name, setName] = useState(agent?.name ?? "");
  const [persona, setPersona] = useState(agent?.persona ?? "");
  const [greeting, setGreeting] = useState(agent?.greeting ?? "");

  // Channel + Knowledge selections
  const agentChannelIds = agent?.channels?.map((ch) => ch.id) ?? [];
  const agentKnowledgeIds = agent?.knowledgeLinks?.map((lk) => lk.knowledge.id) ?? [];
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>(agentChannelIds);
  const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<string[]>(agentKnowledgeIds);

  useEffect(() => {
    if (tenantId) {
      fetchChannels(tenantId);
      fetchDocuments(tenantId);
    }
  }, [tenantId, fetchChannels, fetchDocuments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return;

    const payload: CreateAgentPayload = {
      name: name.trim(),
      channelIds: selectedChannelIds,
    };

    if (persona.trim()) payload.persona = persona.trim();
    if (greeting.trim()) payload.greeting = greeting.trim();

    await onSubmit(payload);

    // Sync knowledge after agent is created/updated
    if (tenantId && agent) {
      try {
        await agentService.syncKnowledge(tenantId, agent.id, {
          knowledgeIds: selectedKnowledgeIds,
        });
      } catch (err) {
        console.error("Lỗi sync knowledge:", err);
      }
    }
  };

  const toggleChannel = (channelId: string) => {
    setSelectedChannelIds((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  const toggleKnowledge = (docId: string) => {
    setSelectedKnowledgeIds((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  };

  // Xác định channel nào đã gán bot khác
  const getChannelAssignment = (channelId: string) => {
    if (selectedChannelIds.includes(channelId)) return null;
    const otherAgent = agents.find(
      (a) => a.id !== agent?.id && a.channels?.some((ch) => ch.id === channelId)
    );
    return otherAgent ?? null;
  };

  const nameError = name.length > 0 && name.trim().length < 2 ? "Tên Bot phải từ 2 ký tự" : "";
  const isFormValid = name.trim().length >= 2;

  return (
    <div className="relative bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-800 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
            {isEditMode ? (
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEditMode ? "Chỉnh sửa Bot" : "Tạo Bot AI mới"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEditMode ? "Cập nhật cấu hình cho Bot" : "Thiết lập nhân cách cho Bot AI"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Name */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Tên Bot <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Trợ lý Bán Hàng"
            maxLength={100}
            className={`w-full bg-slate-50 dark:bg-slate-900 border ${nameError ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-800'} text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm`}
            autoFocus
          />
          {nameError && <p className="text-xs text-red-500">{nameError}</p>}
        </div>

        {/* Persona */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Nhân cách (System Prompt)
          </label>
          <textarea
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            placeholder="Mô tả chi tiết vai trò, phong cách, kiến thức chuyên môn của Bot..."
            rows={3}
            maxLength={2000}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm resize-none"
          />
          <div className="flex justify-between">
            <p className="text-xs text-slate-400">
              Đây là chỉ thị giúp AI hiểu vai trò và cách nói chuyện của Bot.
            </p>
            <span className={`text-xs ${persona.length > 1800 ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'}`}>
              {persona.length}/2000
            </span>
          </div>
        </div>

        {/* Greeting */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Lời chào mặc định
          </label>
          <input
            type="text"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            placeholder="Xin chào, tôi có thể giúp gì cho bạn?"
            maxLength={500}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
          />
        </div>

        {/* Channel checkboxes */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            Kết nối kênh
          </label>
          {channels.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
              Chưa có kênh nào. Hãy kết nối Facebook/Zalo trước.
            </p>
          ) : (
            <div className="space-y-2">
              {channels.map((ch) => {
                const assignedTo = getChannelAssignment(ch.id);
                const isDisabled = !!assignedTo;
                const isChecked = selectedChannelIds.includes(ch.id);

                return (
                  <label
                    key={ch.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isDisabled
                        ? "border-slate-100 dark:border-slate-800 opacity-60 cursor-not-allowed"
                        : isChecked
                          ? "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10"
                          : "border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => toggleChannel(ch.id)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                        {ch.externalName || ch.channelType}
                      </span>
                      <span className={`ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        ch.channelType === "FACEBOOK"
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                      }`}>
                        {ch.channelType === "FACEBOOK" ? "FB" : "Zalo"}
                      </span>
                    </div>
                    {isDisabled && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                        <Lock className="w-3 h-3" />
                        {assignedTo.name}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Knowledge checkboxes */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-500" />
            Chọn Knowledge
          </label>
          {documents.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
              Chưa có tài liệu nào. Hãy upload ở trang Knowledge trước.
            </p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {documents.filter((d) => d.status === "READY").map((doc) => {
                const isChecked = selectedKnowledgeIds.includes(doc.id);
                return (
                  <label
                    key={doc.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isChecked
                        ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10"
                        : "border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleKnowledge(doc.id)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate">
                      {doc.fileName}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl font-medium text-sm transition-all"
          >
            Huỷ bỏ
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isFormValid}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm"
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Đang xử lý...
              </>
            ) : (
              <>{isEditMode ? "Lưu thay đổi" : "Tạo Bot"}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
