import { ChunkingOptions, DocumentChunk, DocumentSection } from "@/types/common.type";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { locateChunk, serializeSection, tagIdsInRange } from "./utils";

const DEFAULT_OPTIONS: ChunkingOptions = {
  maxChars: 1500,
  splitChunkSize: 1000,
  splitChunkOverlap: 150,
};

/**
 * Entry point: Transforms parsed DocumentSection array into DocumentChunk array.
 * Strategy: Keeps complete sections as single chunks if within `maxChars`.
 * If exceeding threshold, uses RecursiveCharacterTextSplitter as fallback,
 * mapping original tag IDs based on character position overlaps.
 *
 * @param sections - Parsed document sections.
 * @param options  - Optional chunking options.
 * @returns Array of processed document chunks.
 */
export async function buildChunks(
  sections: DocumentSection[],
  options: Partial<ChunkingOptions> = {}
): Promise<DocumentChunk[]> {
  const opts: ChunkingOptions = { ...DEFAULT_OPTIONS, ...options };
  const chunks: DocumentChunk[] = [];

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: opts.splitChunkSize,
    chunkOverlap: opts.splitChunkOverlap,
    // Prioritize natural legal document separators
    separators: ["\n\n", "\n", ". ", " ", ""],
  });

  for (const section of sections) {
    const { text, segments } = serializeSection(section);

    if (text.length === 0) continue;

    if (text.length <= opts.maxChars) {
      // Standard case: complete section fits into a single chunk
      const allTagIds = Array.from(new Set(segments.map((s) => s.tagId)));
      chunks.push({
        chunkId: section.sectionId,
        sectionId: section.sectionId,
        sectionTitle: section.sectionTitle,
        tagIds: allTagIds,
        text,
      });
      continue;
    }

    // Fallback: section exceeds size limit, split recursively
    const subTexts = await splitter.splitText(text);
    let searchCursor = 0;

    subTexts.forEach((subText, idx) => {
      const start = locateChunk(text, subText, searchCursor);
      const end = start + subText.length;
      searchCursor = start;

      const tagIds = tagIdsInRange(segments, start, end);

      chunks.push({
        chunkId: `${section.sectionId}#${idx}`,
        sectionId: section.sectionId,
        sectionTitle: section.sectionTitle,
        tagIds,
        text: subText,
      });
    });
  }

  return chunks;
}