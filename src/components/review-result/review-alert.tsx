"use client";

import { ReusableAlert } from "@/components/ui/reusable-alert";

export interface ReasoningErrorData {
  hasError: boolean;
  errorType: "limitation" | "reasoning";
  errorMessage?: string;
}

export interface ReviewAlertProps {
  reasoningError?: ReasoningErrorData | null;
  riskCount?: number;
  onDismiss?: () => void;
  className?: string;
}

/**
 * ReviewAlert component that displays API limitation warnings or reasoning error alerts for contract review results.
 */
export function ReviewAlert({
  reasoningError,
  riskCount = 0,
  onDismiss,
  className = "px-3 pb-3",
}: ReviewAlertProps) {
  if (!reasoningError?.hasError) {
    return null;
  }

  const isLimitation = reasoningError.errorType === "limitation";

  const title = isLimitation ? "Review Terhenti" : "Terjadi Kesalahan";

  const description = isLimitation
    ? "Anda sudah mencapai batas penggunaan. Coba lagi nanti."
    : reasoningError.errorMessage
    ? `Terjadi kesalahan saat analisis: ${reasoningError.errorMessage}`
    : `Analisis terhenti lebih awal, namun ${riskCount} temuan risiko berhasil terdeteksi.`;

  return (
    <div className={className}>
      <ReusableAlert
        variant={isLimitation ? "warning" : "destructive"}
        dismissible
        onDismiss={onDismiss}
        title={title}
        description={description}
      />
    </div>
  );
}
