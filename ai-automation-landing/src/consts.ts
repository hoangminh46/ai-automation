/** Site-wide constants — single source of truth */

export const SITE = {
  name: 'Mine Chatbot',
  tagline: 'Tự động chốt đơn 24/7 bằng AI',
  description:
    'Mine Chatbot thông minh cho shop online Việt Nam. Tự động trả lời khách hàng trên Facebook, Zalo, Website — 24/7 không nghỉ. Tiết kiệm 80% thời gian chăm sóc khách hàng.',
  url: 'https://mine-chatbot.vercel.app',
  appUrl: 'https://cms-mine-chatbot.vercel.app',
  ogImage: '/og-image.png',
  themeColor: '#2563eb',
} as const;

export const NAV_LINKS = [
  { label: 'Tính năng', href: '#features' },
  { label: 'Cách hoạt động', href: '#how-it-works' },
  { label: 'Bảng giá', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
] as const;

export const CTA = {
  trial: {
    label: 'Dùng thử miễn phí',
    href: 'https://cms-mine-chatbot.vercel.app/login',
  },
  login: {
    label: 'Đăng nhập',
    href: 'https://cms-mine-chatbot.vercel.app/login',
  },
  demo: {
    label: 'Xem Demo',
    href: '#how-it-works',
  },
} as const;

export const STATS = [
  { value: '100+', label: 'Shop đang sử dụng' },
  { value: '50K+', label: 'Tin nhắn đã xử lý' },
  { value: '99.9%', label: 'Uptime hệ thống' },
] as const;

export const FEATURES = [
  {
    icon: 'channels',
    title: 'Đa kênh trong 1 dashboard',
    description:
      'Quản lý Facebook Messenger, Zalo OA và Website Widget từ một giao diện duy nhất. Không bỏ sót bất kỳ tin nhắn nào.',
  },
  {
    icon: 'brain',
    title: 'AI học từ tài liệu của bạn',
    description:
      'Upload bảng giá, catalog, FAQ — AI tự đọc hiểu và trả lời chính xác như nhân viên giỏi nhất của bạn.',
  },
  {
    icon: 'crm',
    title: 'CRM tích hợp sẵn',
    description:
      'Quản lý danh sách khách hàng, lịch sử hội thoại, trạng thái đơn hàng — tất cả real-time trong cùng hệ thống.',
  },
  {
    icon: 'bots',
    title: 'Đa Bot chuyên biệt',
    description:
      'Tạo bot riêng cho từng mục đích: tư vấn sản phẩm, chăm sóc khách hàng, remarketing — mỗi bot một "chuyên gia".',
  },
  {
    icon: 'shield',
    title: 'Bảo mật cấp doanh nghiệp',
    description:
      'Dữ liệu được mã hóa AES-256. Token an toàn, không chia sẻ với bên thứ ba. Dữ liệu luôn thuộc về bạn.',
  },
  {
    icon: 'chart',
    title: 'Dashboard & Analytics',
    description:
      'Theo dõi hiệu suất bot, lượt hội thoại, tỷ lệ chốt đơn — ra quyết định dựa trên dữ liệu thực.',
  },
] as const;

export const STEPS = [
  {
    number: 1,
    title: 'Đăng ký miễn phí',
    description: 'Tạo tài khoản trong 30 giây. Không cần thẻ tín dụng, không cam kết.',
    icon: 'user-plus',
  },
  {
    number: 2,
    title: 'Upload tài liệu',
    description: 'Tải lên bảng giá, catalog sản phẩm, FAQ — AI tự học và sẵn sàng trong 2 phút.',
    icon: 'upload',
  },
  {
    number: 3,
    title: 'AI bắt đầu chốt đơn',
    description: 'Kết nối Facebook, Zalo — chatbot tự động trả lời và chốt đơn 24/7 cho bạn.',
    icon: 'message-circle',
  },
] as const;

export const PLANS = [
  {
    name: 'Free',
    price: '0đ',
    period: 'Vĩnh viễn',
    description: 'Khám phá sức mạnh AI',
    highlighted: false,
    cta: 'Bắt đầu miễn phí',
    features: [
      { text: '50 AI responses/tháng', included: true },
      { text: '1 Bot', included: true },
      { text: '1 Thành viên', included: true },
      { text: '3 files / 5MB kiến thức', included: true },
      { text: 'Unlimited kênh kết nối', included: true },
      { text: 'Có branding watermark', included: false },
    ],
  },
  {
    name: 'Basic',
    price: '299K',
    period: '/tháng',
    description: 'Cho shop mới bắt đầu',
    highlighted: false,
    cta: 'Chọn Basic',
    features: [
      { text: '3.000 AI responses/tháng', included: true },
      { text: '3 Bots', included: true },
      { text: '3 Thành viên', included: true },
      { text: '10 files / 30MB kiến thức', included: true },
      { text: 'Unlimited kênh kết nối', included: true },
      { text: 'Không branding', included: true },
    ],
  },
  {
    name: 'Standard',
    price: '599K',
    period: '/tháng',
    description: 'Phổ biến nhất',
    highlighted: true,
    cta: 'Chọn Standard',
    features: [
      { text: '8.000 AI responses/tháng', included: true },
      { text: '5 Bots', included: true },
      { text: '10 Thành viên', included: true },
      { text: '30 files / 100MB kiến thức', included: true },
      { text: 'Unlimited kênh kết nối', included: true },
      { text: 'Không branding', included: true },
    ],
  },
  {
    name: 'Premium',
    price: '1.199K',
    period: '/tháng',
    description: 'Cho doanh nghiệp lớn',
    highlighted: false,
    cta: 'Chọn Premium',
    features: [
      { text: '20.000 AI responses/tháng', included: true },
      { text: '10 Bots', included: true },
      { text: 'Unlimited thành viên', included: true },
      { text: '100 files / 500MB kiến thức', included: true },
      { text: 'Unlimited kênh kết nối', included: true },
      { text: 'Không branding', included: true },
    ],
  },
] as const;

export const FAQS = [
  {
    question: 'AI có trả lời sai không?',
    answer:
      'Mine Chatbot sử dụng công nghệ RAG (Retrieval-Augmented Generation) — nghĩa là bot chỉ trả lời dựa trên tài liệu bạn cung cấp, không tự "bịa" thông tin. Nếu câu hỏi nằm ngoài kiến thức đã upload, bot sẽ thông báo và chuyển cho nhân viên xử lý.',
  },
  {
    question: 'Dữ liệu của tôi có an toàn không?',
    answer:
      'Hoàn toàn an toàn. Tất cả dữ liệu được mã hóa AES-256-GCM khi lưu trữ. Dữ liệu thuộc quyền sở hữu của bạn, không được chia sẻ với bất kỳ bên thứ ba nào. Bạn có thể xóa dữ liệu bất cứ lúc nào.',
  },
  {
    question: 'Tôi có cần biết kỹ thuật không?',
    answer:
      'Không cần. Chỉ cần 3 bước: đăng ký tài khoản, upload tài liệu (PDF, Excel, Word), và kết nối trang Facebook/Zalo. Toàn bộ quá trình mất chưa đến 5 phút.',
  },
  {
    question: 'Nếu AI không trả lời được thì sao?',
    answer:
      'Khi gặp câu hỏi ngoài phạm vi kiến thức, bot sẽ tự động chuyển hội thoại cho nhân viên qua hệ thống CRM real-time. Nhân viên nhận được toàn bộ lịch sử chat để tiếp tục tư vấn mượt mà.',
  },
  {
    question: 'Gói Free có giới hạn gì?',
    answer:
      'Gói Free bao gồm 50 AI responses/tháng, 1 bot, kết nối unlimited kênh. Đầy đủ tính năng core để bạn trải nghiệm. Nâng cấp bất cứ lúc nào khi shop phát triển.',
  },
  {
    question: 'Tôi có thể nâng/hạ gói bất kỳ lúc nào không?',
    answer:
      'Có. Bạn có thể nâng cấp hoặc hạ gói ngay lập tức từ trang Dashboard. Khi nâng gói, phần chênh lệch được tính theo ngày sử dụng còn lại. Khi hạ gói, thay đổi có hiệu lực từ chu kỳ thanh toán tiếp theo.',
  },
] as const;

export const CHANNELS = [
  { name: 'Facebook Messenger', icon: 'facebook' },
  { name: 'Zalo OA', icon: 'zalo' },
  { name: 'Website Widget', icon: 'globe' },
] as const;
