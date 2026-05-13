import { useState, useEffect, useRef, useCallback } from 'react';

/* ─── Types ─── */
interface MessagePart {
  text: string;
  bold?: boolean;
  color?: 'primary' | 'green';
}

interface ChatMessage {
  role: 'customer' | 'bot';
  parts: MessagePart[];
}

interface Conversation {
  title: string;
  messages: ChatMessage[];
}

/* ─── Data: Multiple conversation scenarios to cycle through ─── */
const CONVERSATIONS: Conversation[] = [
  {
    title: 'Tư vấn mua áo khoác',
    messages: [
      {
        role: 'customer',
        parts: [{ text: 'Áo khoác size L còn hàng không shop?' }],
      },
      {
        role: 'bot',
        parts: [
          { text: 'Dạ còn hàng ạ! 🎉\n' },
          { text: 'Áo khoác bomber size L hiện còn ' },
          { text: '3 chiếc', bold: true, color: 'primary' },
          { text: '.\n' },
          { text: 'Giá: ' },
          { text: '450.000đ', bold: true },
          { text: ' (giảm 20% còn ' },
          { text: '360.000đ', bold: true, color: 'green' },
          { text: ')\n' },
          { text: 'Anh/chị muốn đặt luôn không ạ? 😊' },
        ],
      },
      {
        role: 'customer',
        parts: [{ text: 'Đặt 1 cái, ship về HCM' }],
      },
      {
        role: 'bot',
        parts: [
          { text: 'Tuyệt vời! Em xác nhận đơn hàng:\n' },
          { text: '✅ Áo khoác bomber L × 1\n' },
          { text: '💰 360.000đ (đã giảm 20%)\n' },
          { text: '🚚 Ship HCM (miễn phí)\n' },
          { text: 'Anh/chị cho em SĐT để liên hệ giao hàng nhé!' },
        ],
      },
    ],
  },
  {
    title: 'Hỏi về kem chống nắng',
    messages: [
      {
        role: 'customer',
        parts: [{ text: 'Shop có kem chống nắng cho da dầu không?' }],
      },
      {
        role: 'bot',
        parts: [
          { text: 'Dạ có ạ! Shop có 2 loại phù hợp da dầu:\n' },
          { text: '1. Biore UV Aqua Rich — ' },
          { text: '195.000đ', bold: true, color: 'primary' },
          { text: ' ⭐ Best seller\n' },
          { text: '2. Skin Aqua Tone Up — ' },
          { text: '175.000đ', bold: true, color: 'primary' },
          { text: '\nCả 2 đều SPF50+, kiềm dầu tốt. Anh/chị thích loại nào ạ? 😊' },
        ],
      },
      {
        role: 'customer',
        parts: [{ text: 'Lấy Biore nha. Mua 2 có giảm giá không?' }],
      },
      {
        role: 'bot',
        parts: [
          { text: 'Dạ mua 2 em giảm thêm 10% ạ! 🎁\n' },
          { text: '✅ Biore UV Aqua Rich × 2\n' },
          { text: '💰 Tổng: ' },
          { text: '351.000đ', bold: true, color: 'green' },
          { text: ' (tiết kiệm 39.000đ)\n' },
          { text: '🚚 Freeship đơn từ 300k\n' },
          { text: 'Anh/chị chốt đơn em gửi link thanh toán nhé! 💪' },
        ],
      },
    ],
  },
  {
    title: 'Kiểm tra đơn hàng',
    messages: [
      {
        role: 'customer',
        parts: [{ text: 'Cho mình check đơn #VN23456 với' }],
      },
      {
        role: 'bot',
        parts: [
          { text: 'Dạ em kiểm tra ngay!\n' },
          { text: '📦 Đơn #VN23456:\n' },
          { text: 'Trạng thái: ' },
          { text: 'Đang giao hàng', bold: true, color: 'green' },
          { text: '\n📍 Đang ở bưu cục Q. Tân Bình, HCM\n' },
          { text: '⏰ Dự kiến giao: ' },
          { text: 'Ngày mai (14h-17h)', bold: true, color: 'primary' },
          { text: '\nAnh/chị cần hỗ trợ gì thêm không ạ? 😊' },
        ],
      },
      {
        role: 'customer',
        parts: [{ text: 'Mình đổi địa chỉ được không?' }],
      },
      {
        role: 'bot',
        parts: [
          { text: 'Được ạ! Đơn chưa giao nên vẫn đổi được ạ.\n' },
          { text: '📝 Anh/chị gửi em địa chỉ mới, em cập nhật ngay.\n' },
          { text: '⚡ Thời gian giao sẽ ' },
          { text: 'không thay đổi', bold: true },
          { text: ' nếu vẫn trong nội thành HCM ạ!' },
        ],
      },
    ],
  },
];

/* ─── Timing constants (ms) ─── */
const DELAY_BEFORE_BOT_TYPING = 800;
const DELAY_BOT_TYPING_DURATION = 1500;
const DELAY_BETWEEN_CUSTOMER_MSG = 600;
const DELAY_BEFORE_NEXT_CONVERSATION = 4000;

/* ─── Render message parts with styling ─── */
function renderParts(parts: MessagePart[]) {
  return parts.map((part, i) => {
    const lines = part.text.split('\n');
    const colorClass =
      part.color === 'primary'
        ? 'text-primary-600'
        : part.color === 'green'
          ? 'text-green-600'
          : '';
    const fontClass = part.bold ? 'font-semibold' : '';
    const className = [colorClass, fontClass].filter(Boolean).join(' ');

    return lines.map((line, li) => (
      <span key={`${i}-${li}`}>
        {li > 0 && <br />}
        {className ? <span className={className}>{line}</span> : line}
      </span>
    ));
  });
}

/* ─── Typing Indicator ─── */
function TypingIndicator() {
  return (
    <div className="flex justify-start msg-enter">
      <div className="rounded-2xl rounded-bl-md bg-white dark:bg-dark-card px-4 py-3 shadow-sm border border-surface-100 dark:border-dark-border">
        <div className="flex items-center gap-1">
          <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-surface-700" style={{ animationDelay: '0ms' }} />
          <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-surface-700" style={{ animationDelay: '150ms' }} />
          <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-surface-700" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function ChatMockup() {
  const [conversationIndex, setConversationIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentConversation = CONVERSATIONS[conversationIndex];
  const totalMessages = currentConversation.messages.length;

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [visibleCount, isTyping]);

  // Message reveal engine
  useEffect(() => {
    clearPendingTimeout();

    if (visibleCount >= totalMessages) {
      // All messages shown → fade out → next conversation
      timeoutRef.current = setTimeout(() => {
        setIsFading(true);
        timeoutRef.current = setTimeout(() => {
          setConversationIndex((prev) => (prev + 1) % CONVERSATIONS.length);
          setVisibleCount(0);
          setIsTyping(false);
          setIsFading(false);
        }, 600);
      }, DELAY_BEFORE_NEXT_CONVERSATION);
      return;
    }

    const nextMessage = currentConversation.messages[visibleCount];

    if (nextMessage.role === 'bot') {
      // Bot: show typing indicator → then reveal message
      timeoutRef.current = setTimeout(() => {
        setIsTyping(true);
        timeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          setVisibleCount((prev) => prev + 1);
        }, DELAY_BOT_TYPING_DURATION);
      }, DELAY_BEFORE_BOT_TYPING);
    } else {
      // Customer: just appear after a short delay
      timeoutRef.current = setTimeout(() => {
        setVisibleCount((prev) => prev + 1);
      }, visibleCount === 0 ? 800 : DELAY_BETWEEN_CUSTOMER_MSG);
    }

    return () => clearPendingTimeout();
  }, [visibleCount, conversationIndex, totalMessages, currentConversation.messages, clearPendingTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearPendingTimeout();
  }, [clearPendingTimeout]);

  const visibleMessages = currentConversation.messages.slice(0, visibleCount);

  return (
    <div className="relative rounded-2xl border border-surface-200/80 dark:border-dark-border bg-white dark:bg-dark-card p-1 shadow-2xl shadow-primary-900/10 dark:shadow-black/30 select-none">
      {/* Inline styles for typing animation */}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        .typing-dot {
          animation: typingBounce 1.2s ease-in-out infinite;
        }
        @keyframes msgSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .msg-enter {
          animation: msgSlideIn 0.35s ease-out forwards;
        }
        .chat-fade-out {
          opacity: 0;
          transition: opacity 0.5s ease-out;
        }
        .chat-fade-in {
          opacity: 1;
          transition: opacity 0.3s ease-in;
        }
      `}</style>

      {/* Mockup Header */}
      <div className="flex items-center gap-3 rounded-t-xl bg-primary-600 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">AI Chatbot</p>
            <p className="text-xs text-white/70">Đang hoạt động</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-white/70">Online</span>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        ref={chatBodyRef}
        className={`space-y-3 bg-surface-50 dark:bg-dark-bg px-4 py-4 h-[360px] overflow-y-auto scroll-smooth relative z-0 mt-[-1px] ${isFading ? 'chat-fade-out' : 'chat-fade-in'}`}
      >
        {visibleMessages.map((msg, idx) => (
          <div key={`${conversationIndex}-${idx}`} className="msg-enter">
            {msg.role === 'customer' ? (
              <div className="flex justify-end">
                <div className="max-w-[75%] rounded-2xl rounded-br-md bg-primary-600 px-4 py-2.5 text-sm text-white">
                  {renderParts(msg.parts)}
                </div>
              </div>
            ) : (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-white dark:bg-dark-card px-4 py-2.5 text-sm text-surface-800 dark:text-surface-200 shadow-sm border border-surface-100 dark:border-dark-border">
                  {renderParts(msg.parts)}
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && <TypingIndicator />}
      </div>

      {/* Mockup Input */}
      <div className="flex items-center gap-2 border-t border-surface-100 dark:border-dark-border bg-white dark:bg-dark-card px-4 py-3 rounded-b-xl">
        <div className="flex-1 rounded-full bg-surface-50 dark:bg-dark-bg px-4 py-2 text-sm text-surface-700/40 dark:text-surface-500">
          Nhập tin nhắn...
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
      </div>
    </div>
  );
}
