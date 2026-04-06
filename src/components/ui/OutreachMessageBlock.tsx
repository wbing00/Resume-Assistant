"use client";

import { useState } from "react";
import { updateOutreachMessage } from "@/app/analysis/actions";

interface OutreachMessageBlockProps {
  analysisId: string;
  initialMessage: string;
}

export function OutreachMessageBlock({ analysisId, initialMessage }: OutreachMessageBlockProps) {
  const [message, setMessage] = useState(initialMessage);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const formData = new FormData();
    formData.append("analysisId", analysisId);
    formData.append("outreachMessage", message);
    try {
      await updateOutreachMessage(formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save:", error);
      alert("保存失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setMessage(initialMessage);
    setIsEditing(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">打招呼 / 投递附言</p>
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            className="w-full rounded-xl border border-border-light bg-surface p-4 text-sm leading-7 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="请输入投递附言..."
          />
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
            >
              {isSaving ? "保存中..." : "保存"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="btn-secondary px-4 py-2 text-sm"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="whitespace-pre-wrap text-sm leading-8 text-text-primary">
            {message || "当前没有生成投递附言。"}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="btn-secondary px-4 py-2 text-sm"
            >
              {isCopied ? "已复制！" : "采纳并复制"}
            </button>
            <button
              onClick={handleEdit}
              className="btn-secondary px-4 py-2 text-sm"
            >
              修改
            </button>
          </div>
        </>
      )}
    </div>
  );
}