import type { MatchLegalArticleResult } from "./legal.type";

/**
 * Satu elemen block-level "atomic" dari dokumen (p, li, h1, h2, table-row, dst).
 * Ini adalah unit terkecil yang masih bisa ditelusuri balik ke DOCX asli via tagId.
 */
export interface ParsedElement {
  tagId: string;          // dari data-tag-id, mis. "tag-25"
  tagName: string;        // "h1" | "h2" | "p" | "li" | "table" | dst
  text: string;            // text content yang sudah dinormalisasi (trim, collapse whitespace)
  depth: number;           // kedalaman nesting (untuk <li> di dalam <li>, dsb.)
  isTableCell?: boolean;    // true jika elemen ini berasal dari <td>
}

/**
 * Representasi satu baris tabel yang sudah diserialisasi jadi key-value,
 * dipakai khusus untuk tabel seperti komponen upah.
 */
export interface ParsedTableRow {
  tagIds: string[];        // semua tag-id sel dalam baris ini
  cells: string[];         // teks tiap sel, berurutan sesuai kolom
}

export interface ParsedTable {
  tagId: string;           // tag-id dari elemen <table> itu sendiri (jika ada)
  rows: ParsedTableRow[];
}

/**
 * Satu grup logis dokumen: preamble, atau satu Pasal beserta seluruh isinya.
 * Inilah unit yang nantinya jadi calon chunk (sebelum dicek ukurannya).
 */
export interface DocumentSection {
  sectionId: string;       // slug, mis. "preamble", "pasal-4"
  sectionTitle: string;    // teks heading, mis. "Pasal 4 Pengupahan"
  headingTagId: string | null; // tag-id dari <h1>/<h2> pemicu section ini, null untuk preamble
  elements: ParsedElement[];   // elemen non-tabel dalam section ini, urut sesuai dokumen
  tables: ParsedTable[];       // tabel-tabel dalam section ini
}

/**
 * Chunk final yang siap di-embed. Satu chunk bisa berasal dari satu section utuh,
 * atau dari sebagian section (jika section terlalu panjang dan di-split lebih lanjut).
 */
export interface DocumentChunk {
  chunkId: string;         // e.g. "pasal-4-pengupahan" or "pasal-9-phk#1"
  sectionId: string;
  sectionTitle: string;
  tagIds: string[];        // source element tag-ids contributing to this chunk
  text: string;            // final serialized text to be embedded
}

/**
 * A document chunk populated with its generated vector embedding.
 */
export interface EmbeddedDocumentChunk extends DocumentChunk {
  embedding: number[];
}

/**
 * A document chunk populated with matching legal regulations from vector search.
 */
export interface MatchedDocumentChunk extends DocumentChunk {
  matched_regulations: MatchLegalArticleResult[];
}


 
/**
 * Menandai rentang karakter [start, end) dalam teks gabungan satu section
 * yang berasal dari satu tagId tertentu. Dipakai untuk memetakan balik
 * potongan hasil character-split ke tag-id sumbernya.
 */
export interface TextSegment {
  tagId: string;
  start: number;
  end: number; // exclusive
}

export interface ChunkingOptions {
  maxChars: number;       // batas ukuran section sebelum di-split lebih lanjut
  splitChunkSize: number; // ukuran target tiap sub-chunk saat fallback split
  splitChunkOverlap: number;
}

