"use client";

import Link from "next/link";
import { useState } from "react";

import { submitFeedback } from "@/app/feedback/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { FeedbackType } from "@/types";

interface FeedbackFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

const feedbackTypeOptions = [
  { value: "bug", label: "Bug报告", description: "功能异常、错误、崩溃等问题" },
  { value: "feature", label: "功能建议", description: "新功能需求或现有功能改进" },
  { value: "ui", label: "UI改进", description: "界面设计、布局、交互体验问题" },
  { value: "experience", label: "使用体验", description: "整体使用感受、流程问题" },
  { value: "other", label: "其他", description: "不属于以上分类的反馈" },
];

const ratingOptions = [
  { value: "", label: "不评分", description: "跳过评分" },
  { value: "1", label: "⭐", description: "非常不满意" },
  { value: "2", label: "⭐⭐", description: "不满意" },
  { value: "3", label: "⭐⭐⭐", description: "一般" },
  { value: "4", label: "⭐⭐⭐⭐", description: "满意" },
  { value: "5", label: "⭐⭐⭐⭐⭐", description: "非常满意" },
];

export function FeedbackForm({ onSuccess, onCancel, className = "" }: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
    feedbackId?: string;
  } | null>(null);
  const [selectedType, setSelectedType] = useState<FeedbackType>("experience");
  const [rating, setRating] = useState<string>("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});
    setSubmitResult(null);

    const formData = new FormData(e.currentTarget);
    formData.set("feedback_type", selectedType);
    formData.set("rating", rating);

    try {
      const result = await submitFeedback(formData);
      setSubmitResult(result);
      
      if (result.success && onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: error instanceof Error ? error.message : "提交反馈时发生未知错误",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitResult?.success) {
    return (
      <div className={`card-primary ${className}`}>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
            <svg
              className="h-6 w-6 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-strong">反馈提交成功！</h3>
          <p className="mt-2 text-text-secondary">{submitResult.message}</p>
          {submitResult.feedbackId && (
            <p className="mt-2 text-sm text-text-secondary">
              反馈ID: <span className="font-mono text-text-primary">{submitResult.feedbackId}</span>
            </p>
          )}
          <div className="mt-6">
            <Button
              onClick={() => {
                if (onSuccess) onSuccess();
                else window.location.href = "/feedback/list";
              }}
              variant="primary"
            >
              查看我的反馈
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card-primary ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-text-strong">提供反馈</h2>
        <p className="mt-2 text-text-secondary">
          您的意见帮助我们改进产品。请选择反馈类型并详细描述您的问题或建议。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {submitResult?.message && !submitResult.success && (
          <div className="rounded-2xl border border-error/20 bg-error/10 px-4 py-3">
            <p className="text-error">{submitResult.message}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            反馈类型 *
          </label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {feedbackTypeOptions.map((option) => (
              <div
                key={option.value}
                className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                  selectedType === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border-light hover:border-border-medium"
                }`}
                onClick={() => setSelectedType(option.value as FeedbackType)}
              >
                <input
                  type="radio"
                  id={`type_${option.value}`}
                  name="feedback_type"
                  value={option.value}
                  checked={selectedType === option.value}
                  onChange={(e) => setSelectedType(e.target.value as FeedbackType)}
                  className="sr-only"
                />
                <div className="font-medium text-text-primary">{option.label}</div>
                <div className="mt-1 text-sm text-text-secondary">{option.description}</div>
              </div>
            ))}
          </div>
          <input type="hidden" name="feedback_type" value={selectedType} />
        </div>

        <div>
          <Input
            label="标题 *"
            name="title"
            placeholder="简要描述您的反馈"
            required
            maxLength={200}
            error={formErrors.title}
          />
          <p className="mt-1 text-sm text-text-secondary">简明扼要地概括反馈内容</p>
        </div>

        <div>
          <Textarea
            label="详细描述 *"
            name="description"
            placeholder="请详细描述您的问题、建议或使用体验..."
            rows={6}
            required
            maxLength={5000}
            error={formErrors.description}
          />
          <p className="mt-1 text-sm text-text-secondary">
            请尽可能详细地描述，包括具体场景、期望结果等
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            满意度评分（可选）
          </label>
          <div className="flex flex-wrap gap-2">
            {ratingOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`rounded-2xl border-2 px-4 py-2 transition-all ${
                  rating === option.value
                    ? "border-primary bg-primary/10"
                    : "border-border-light hover:border-border-medium"
                }`}
                onClick={() => setRating(option.value)}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-text-secondary">{option.description}</div>
              </button>
            ))}
          </div>
          <input type="hidden" name="rating" value={rating} />
        </div>

        <div className="flex flex-wrap gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? "提交中..." : "提交反馈"}
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              取消
            </Button>
          )}
          
          <Link
            href="/feedback/list"
            className="inline-flex items-center rounded-2xl px-2 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            查看历史反馈
          </Link>
        </div>

        <div className="rounded-2xl border border-border-light bg-surface/50 p-4">
          <p className="text-sm text-text-secondary">
            <strong>提示：</strong> 提交反馈后，您可以在“我的反馈”页面查看处理状态。我们的团队会定期查看并回复反馈。
          </p>
        </div>
      </form>
    </div>
  );
}
