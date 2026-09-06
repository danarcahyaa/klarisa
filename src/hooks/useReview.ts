"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadReviewDocumentAction } from "@/app/actions/review.action";
import { validateContractFile } from "@/app/validations/contract.validation";
import type { DocumentValidationResult, ReviewStep, UseReviewReturn } from "@/types/contract-review.type";
import type { MatchLegalArticleResult } from "@/types/legal.type";
import { buildChunks } from "@/lib/langchain";
import { formatFileSize, injectHTMLUniqueID, parseContractHtml } from "@/lib/utils";
import { generateEmbeddingAction, matchEmbeddingAction } from "@/app/actions/embedding.action";
import { processReasoningAction } from "@/app/actions/reasoning.action";
import { parseDocxToHtml } from "@/lib/docx-parser";
import { calculateDynamicBatchSize } from "@/components/reasoning-marker";

export type { UseReviewReturn };

export function useReview(): UseReviewReturn {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsedHtml, setParsedHtml] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<DocumentValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [matchedRegulations, setMatchedRegulations] = useState<MatchLegalArticleResult[]>([]);
  const [reasoningChunks, setReasoningChunks] = useState<Array<{ chunkId?: string; sectionTitle?: string; text: string }>>([]);
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);
  const [reviewStep, setReviewStep] = useState<ReviewStep>("idle");

  const fileName = useMemo(() => file?.name ?? "", [file]);

  const fileSizeFormatted = useMemo(() => {
    return file ? formatFileSize(file.size) : "";
  }, [file]);

  const handleFileSelect = useCallback((selectedFile: File | null) => {
    setError(null);
    setIsSuccess(false);
    setMatchedRegulations([]);
    setReasoningChunks([]);
    setReviewStep("idle");

    if (!selectedFile) {
      setFile(null);
      setParsedHtml(null);
      setValidationResult(null);
      return false;
    }

    const audit = validateContractFile(selectedFile);
    setFile(selectedFile);
    setValidationResult(audit);

    if (!audit.isValid) {
      setParsedHtml(null);
      setError(audit.errors[0] ?? "Dokumen tidak memenuhi kriteria validasi.");
      return false;
    }

    return true;
  }, []);

  const handleUpload = useCallback(async (): Promise<boolean> => {
    setError(null);

    const audit = validateContractFile(file);
    setValidationResult(audit);

    if (!audit.isValid || !file) {
      const firstErr = audit.errors[0] ?? "Pilih dokumen .docx yang valid.";
      setError(firstErr);
      return false;
    }

    setIsLoading(true);
    setReviewStep("matching");
    setMatchedRegulations([]);

    try {
      const parsedDoc = await parseDocxToHtml(file);
      const annotatedHtml = injectHTMLUniqueID(parsedDoc);
      const parsedSections = parseContractHtml(annotatedHtml);
      const chunks = await buildChunks(parsedSections);

      // Generate vector embeddings in groups (batches) to prevent rate limits
      const embeddingResult = await generateEmbeddingAction({
        chunks,
        batchSize: 5,
        batchDelayMs: 500,
      });

      if (!embeddingResult.success || !embeddingResult.data) {
        const err = embeddingResult.error ?? "Terjadi kesalahan saat membuat embedding dokumen.";
        throw new Error(err);
      }

      const embeddedChunks = embeddingResult.data.chunks;

      // Perform RAG vector similarity search against legal regulations DB
      const matchResult = await matchEmbeddingAction(
        embeddedChunks,
        { matchThreshold: 0.75, matchCount: 5 }
      );

      if (!matchResult.success || !matchResult.data) {
        const err = matchResult.error ?? "Terjadi kesalahan saat mencocokkan regulasi hukum.";
        throw new Error(err);
      }

      const matchedChunks = matchResult.data.chunks;

      const allMatchedRegs: MatchLegalArticleResult[] = [];
      matchedChunks.forEach((chunk) => {
        if (chunk.matched_regulations && Array.isArray(chunk.matched_regulations)) {
          allMatchedRegs.push(...chunk.matched_regulations);
        }
      });
      setMatchedRegulations(allMatchedRegs);
      setReviewStep("reasoning");

      // Extract chunks being analyzed by the reasoning process (matching backend filterAnalyzableChunks)
      const activeReasoningChunks = matchedChunks
        .filter((c) => c.text && c.text.trim().length >= 20)
        .map((c) => ({
          chunkId: c.chunkId,
          sectionTitle: c.sectionTitle || "",
          text: c.text,
        }));
      setReasoningChunks(activeReasoningChunks);
      // Calculate dynamic batch count and step timer
      const batchSize = calculateDynamicBatchSize(activeReasoningChunks.length);
      const totalBatches = Math.ceil(activeReasoningChunks.length / batchSize);

      let batchTimer: ReturnType<typeof setInterval> | null = null;
      if (totalBatches > 1) {
        let currentBatch = 0;
        batchTimer = setInterval(() => {
          currentBatch++;
          if (currentBatch < totalBatches) {
            setActiveBatchIndex(currentBatch);
          } else if (batchTimer) {
            clearInterval(batchTimer);
          }
        }, 2200);
      }

      const reasoningResult = await processReasoningAction(
        parsedSections,
        matchedChunks
      );

      if (batchTimer) clearInterval(batchTimer);
      setActiveBatchIndex(totalBatches);

      const findings = reasoningResult.data?.findings ?? [];
      const hasFindings = findings.length > 0;

      // Case A: Reasoning failed and NO risky findings were collected
      if (!reasoningResult.success && !hasFindings) {
        const err = reasoningResult.error ?? "Terjadi kesalahan saat menganalisis kepatuhan hukum.";
        setError(err);
        setReviewStep("idle");
        return false;
      }

      const totalRisk = findings.length;
      const fairnessScore = reasoningResult.data?.risky_clauses_count || 0;

      // Save annotated HTML and reasoning findings into Supabase via RPC transaction
      const uploadRes = await uploadReviewDocumentAction({
        title: file.name.replace(/\.[^/.]+$/, ""),
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        content: annotatedHtml,
        fairnessScore,
        totalRisk,
        metadata: {
          findings: reasoningResult.data,
        },
      });

      const contractId = uploadRes.data?.id;

      setReviewStep("redirecting");
      setIsSuccess(true);
      if (contractId) {
        router.push(`/dashboard/review/result/${contractId}`);
      } else {
        router.push("/dashboard/review");
      }
      return true;
    } catch (cause) {
      const err = cause instanceof Error ? cause.message : "Gagal mengunggah dokumen review.";
      setError(err);
      setReviewStep("idle");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [file, router]);

  const reset = useCallback(() => {
    setFile(null);
    setParsedHtml(null);
    setValidationResult(null);
    setIsLoading(false);
    setIsSuccess(false);
    setError(null);
    setMatchedRegulations([]);
    setReasoningChunks([]);
    setActiveBatchIndex(0);
    setReviewStep("idle");
  }, []);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  return {
    file,
    fileName,
    fileSizeFormatted,
    parsedHtml,
    isLoading,
    isSuccess,
    error,
    validationResult,
    matchedRegulations,
    reasoningChunks,
    activeBatchIndex,
    reviewStep,
    handleFileSelect,
    handleUpload,
    reset,
    dismissError,
  };
}