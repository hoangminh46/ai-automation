"use client";

import { useState } from "react";
import { X, Bot, Cpu, Thermometer, Hash, Sparkles } from "lucide-react";
import { Agent, CreateAgentPayload } from "@/lib/services/agent.service";

interface AgentFormModalProps {
  isOpen: boolean;
  agent: Agent | null;
  onClose: () => void;
  onSubmit: (payload: CreateAgentPayload) => Promise<void>;
  isSubmitting: boolean;
}

const MODEL_OPTIONS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Nhanh, rẻ, phù hợp đa số" },
  { value: "gpt-4o", label: "GPT-4o", description: "Thông minh nhất, chi phí cao" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo", description: "Turbo nhanh, xử lý tốt" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", description: "Tiết kiệm, đủ dùng" },
];

export function AgentFormModal({ isOpen, agent, onClose, onSubmit, isSubmitting }: AgentFormModalProps) {
  if (!isOpen) return null;

  // Key-based remount: khi agent thay đổi (null → agent hoặc agent A → agent B),
  // React sẽ tạo lại AgentFormInner với initial state mới
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

  // State khởi tạo trực tiếp từ props — không cần useEffect sync
  const [name, setName] = useState(agent?.name ?? "");
  const [persona, setPersona] = useState(agent?.persona ?? "");
  const [greeting, setGreeting] = useState(agent?.greeting ?? "");
  const [model, setModel] = useState(agent?.model ?? "gpt-4o-mini");
  const [temperature, setTemperature] = useState(agent?.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = useState(agent?.maxTokens ?? 500);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: CreateAgentPayload = {
      name: name.trim(),
      model,
      temperature,
      maxTokens,
    };

    // Chỉ gửi field có giá trị (tránh ghi đè default của BE)
    if (persona.trim()) payload.persona = persona.trim();
    if (greeting.trim()) payload.greeting = greeting.trim();

    await onSubmit(payload);
  };

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
              {isEditMode ? "Cập nhật cấu hình cho Bot" : "Thiết lập nhân cách & cấu hình LLM"}
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
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
            autoFocus
          />
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
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm resize-none"
          />
          <p className="text-xs text-slate-400">
            Đây là chỉ thị giúp AI hiểu vai trò và cách nói chuyện của Bot.
          </p>
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
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
          />
        </div>

        {/* Model selection */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <Cpu className="w-4 h-4" />
            Model AI
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MODEL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setModel(opt.value)}
                className={`text-left p-3 rounded-xl border-2 transition-all ${
                  model === opt.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <p className={`text-sm font-semibold ${model === opt.value ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Temperature + Max Tokens */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Thermometer className="w-4 h-4" />
              Nhiệt độ
            </label>
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>Chặt chẽ</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">{temperature}</span>
                <span>Sáng tạo</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Hash className="w-4 h-4" />
              Max Tokens
            </label>
            <input
              type="number"
              min={1}
              max={4000}
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value) || 500)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
            />
            <p className="text-xs text-slate-400">1 – 4000</p>
          </div>
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
            disabled={isSubmitting || !name.trim()}
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
