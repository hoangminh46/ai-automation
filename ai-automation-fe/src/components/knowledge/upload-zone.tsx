"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileText, FileType, AlertCircle, X } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["text/plain", "application/pdf"];
const ALLOWED_EXTENSIONS = ".txt, .pdf";

interface UploadZoneProps {
  onUpload: (file: File) => Promise<boolean>;
  disabled?: boolean;
}

export function UploadZone({ onUpload, disabled }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}" không hỗ trợ. Chỉ chấp nhận .txt và .pdf`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" quá lớn (${(file.size / 1024 / 1024).toFixed(1)}MB). Tối đa 10MB`;
    }
    return null;
  };

  const handleFile = useCallback(
    async (file: File) => {
      setUploadError(null);
      setUploadedFileName(null);

      const validationError = validateFile(file);
      if (validationError) {
        setUploadError(validationError);
        return;
      }

      setIsUploading(true);
      const success = await onUpload(file);
      setIsUploading(false);

      if (success) {
        setUploadedFileName(file.name);
        // Auto-clear success message
        setTimeout(() => setUploadedFileName(null), 4000);
      }
    },
    [onUpload],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !isUploading) setIsDragging(true);
    },
    [disabled, isUploading],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, isUploading, handleFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input để cho phép chọn lại cùng file
      e.target.value = "";
    },
    [handleFile],
  );

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  const isDisabled = disabled || isUploading;

  return (
    <div className="space-y-3">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center gap-3 p-8
          border-2 border-dashed rounded-2xl transition-all duration-200
          ${isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
          ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[1.01]"
              : isUploading
                ? "border-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                : "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
          }
        `}
      >
        {isUploading ? (
          <>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                Đang xử lý tài liệu...
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Trích xuất văn bản → Chia đoạn → Nhúng vector AI
              </p>
            </div>
          </>
        ) : (
          <>
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isDragging
                  ? "bg-blue-200 dark:bg-blue-800"
                  : "bg-slate-200 dark:bg-slate-800"
              }`}
            >
              <Upload
                className={`w-6 h-6 ${
                  isDragging
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Kéo & thả file vào đây
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                hoặc{" "}
                <span className="text-blue-600 dark:text-blue-400 underline underline-offset-2">
                  chọn từ máy tính
                </span>
              </p>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                <FileText className="w-3.5 h-3.5" />
                .txt
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                <FileType className="w-3.5 h-3.5" />
                .pdf
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Tối đa 10MB
              </span>
            </div>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS}
          className="hidden"
          onChange={handleInputChange}
          disabled={isDisabled}
        />
      </div>

      {/* Success feedback */}
      {uploadedFileName && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm animate-in fade-in duration-300">
          <FileText className="w-4 h-4 shrink-0" />
          <span className="flex-1 truncate">
            Đã tải lên <strong>{uploadedFileName}</strong> thành công!
          </span>
          <button
            onClick={() => setUploadedFileName(null)}
            className="p-0.5 hover:bg-emerald-200/50 dark:hover:bg-emerald-800/50 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error feedback */}
      {uploadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm animate-in fade-in duration-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{uploadError}</span>
          <button
            onClick={() => setUploadError(null)}
            className="p-0.5 hover:bg-red-200/50 dark:hover:bg-red-800/50 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
