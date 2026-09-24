"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteReviewAction } from "@/app/actions/review.action";

export interface UseDeleteReviewReturn {
  /** Indicates whether the delete action is currently processing */
  isDeleting: boolean;
  /** Error message if deletion failed */
  error: string | null;
  /** Action handler to delete a review by its contract ID */
  handleDeleteReview: (contractId: string, redirectUrl?: string) => Promise<boolean>;
}

/**
 * Custom React hook for deleting contract review documents.
 * Manages loading state, error reporting via toast, and optional client-side navigation.
 */
export function useDeleteReview(): UseDeleteReviewReturn {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteReview = useCallback(
    async (contractId: string, redirectUrl = "/dashboard/review"): Promise<boolean> => {
      if (!contractId) {
        toast.error("ID review tidak valid.");
        return false;
      }

      setIsDeleting(true);
      setError(null);

      try {
        const result = await deleteReviewAction(contractId);

        if (result.success) {
          toast.success(result.message || "Review kontrak berhasil dihapus.");
          if (redirectUrl) {
            router.push(redirectUrl);
          }
          return true;
        }

        const errorMsg = result.error || "Gagal menghapus review kontrak.";
        setError(errorMsg);
        toast.error(errorMsg);
        return false;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus review.";
        setError(errorMsg);
        toast.error(errorMsg);
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [router]
  );

  return {
    isDeleting,
    error,
    handleDeleteReview,
  };
}
