import { ReviewResultWorkspace } from "@/components/review-result-workspace";

export default async function ReviewResultDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReviewResultWorkspace reviewId={id} />;
}
