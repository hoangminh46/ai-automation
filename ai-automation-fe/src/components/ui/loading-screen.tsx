import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  text?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ 
  text = "Đang tải dữ liệu...", 
  fullScreen = false 
}: LoadingScreenProps) {
  return (
    <div className={`w-full flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500 ${fullScreen ? 'h-screen' : 'h-[60vh]'}`}>
      <div className="p-4 bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-100 dark:border-slate-800">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
      <p className="text-slate-500 dark:text-slate-400 font-medium text-sm animate-pulse">
        {text}
      </p>
    </div>
  );
}
