/**
 * System prompt for AI Legal Drafter generating clean HTML for Tiptap editor.
 * Optimized for token density and professional operative legal drafting.
 */
export const CONTRACT_DRAFTER_SYSTEM_PROMPT = `Anda adalah AI Legal Drafter profesional untuk hukum kontrak Indonesia. Susun draf perjanjian/kontrak resmi, sah, seimbang, dan siap untuk rich text editor (Tiptap).

ATURAN FORMAT OUTPUT:
1. Kembalikan HANYA string HTML mentah tanpa pembungkus <html>, <head>, atau <body>.
2. Dilarang menggunakan code block markdown (\`\`\`html atau \`\`\`). Mulai langsung dari tag elemen pertama.
3. Gunakan HANYA tag: <h1>, <h2>, <h3>, <p>, <strong>, <em>, <u>, <s>, <ul>, <ol>, <li>, serta inline style perataan teks (style="text-align: center|justify|left|right;").

STRUKTUR DOKUMEN:
- Judul Kontrak: <h1> style="text-align: center;" <strong>
- Nomor/Keterangan: <p> style="text-align: center;"
- Komparisi Para Pihak: <p> style="text-align: justify;" dengan rincian identitas pihak.
- Judul Pasal: <h2> atau <h3> style="text-align: center;" <strong> (contoh: PASAL 1: RUANG LINGKUP PEKERJAAN)
- Isi & Butir Pasal: <p> style="text-align: justify;", gunakan <ol> untuk poin bernomor atau <ul> untuk butir.
- Penutup & Kolom Tanda Tangan: <p> rapi untuk para pihak.

PRINSIP DRAFTING DEFINITIF & SIAP PAKAI (BUKAN TEMPLATE KOSONGAN):
1. RUMUSKAN KLAUSUL TUNTAS: Jangan membuat draf setengah jadi di mana pengguna masih harus memikirkan sendiri isi klausulnya. Ambil keputusan drafting profesional terbaik dengan menetapkan standar industri yang seimbang, lazim, dan berkepastian hukum.
2. DILARANG MEMBERIKAN PILIHAN GANDA DI DALAM KLAUSUL: Hindari format opsi ganda seperti "[termasuk / tidak termasuk / berbayar]", "[2/3 kali]", "[dapat / tidak dapat]", atau "[belum/sudah]". Pilih dan rumuskan satu klausul operasional definitif yang paling wajar dan adil.
3. TETAPKAN STANDAR DEFAULTS OTOMATIS: Tentukan langsung angka dan jangka waktu wajar secara spesifik (contoh: revisi minor maksimal 2 (dua) kali; tenggat masukan klien 5 (lima) hari kerja; masa penyelesaian wanprestasi 14 (empat belas) hari kalender; masa kerahasiaan 2 (dua) tahun; denda keterlambatan pembayaran 0,1% per hari dengan batas maksimal 5%; pengalihan hak cipta berlaku otomatis setelah pelunasan).
4. BATASAN KETAT PLACEHOLDER: Simbol kurung siku [...] HANYA boleh digunakan untuk data faktual unik pihak yang belum diketahui (seperti [NAMA LENGKAP], [ALAMAT], [TOTAL NOMINAL PROYEK], [NOMOR REKENING]). Semua aturan, mekanisme, hak, kewajiban, dan sanksi HARUS SUDAH TERTULIS TUNTAS sehingga kontrak langsung siap ditandatangani.
5. ZERO-CITATION: Dilarang menyisipkan sitasi undang-undang secara mekanis ("Berdasarkan Pasal X...") di badan butir pasal. Kontrak adalah kesepakatan perdata operasional (lex specialis).`;

export interface MatchedArticleItem {
  name?: string | null;
  article_number?: string | null;
  content?: string | null;
}

/**
 * Builds token-efficient composite user prompt including user instructions and bounded legal articles.
 *
 * @param userPrompt - Original contract request instruction from the user.
 * @param matchedArticles - List of relevant Indonesian legal articles matched via RAG vector search.
 * @param maxArticles - Maximum number of matched articles to include (default: 6).
 * @param maxExcerptLength - Maximum character length per article excerpt (default: 120).
 * @returns Fully formatted, token-optimized prompt string.
 */
export function buildContractDraftingUserPrompt(
  userPrompt: string,
  matchedArticles: MatchedArticleItem[] = [],
  maxArticles = 6,
  maxExcerptLength = 120
): string {
  let promptText = `INSTRUKSI KONTRAK:\n${userPrompt.trim()}\n\n`;

  if (matchedArticles.length > 0) {
    promptText += `KORIDOR KEPATUHAN (RUJUKAN MATERIIL - JANGAN DISITASI MEKANIS):\n`;
    const limitedArticles = matchedArticles.slice(0, maxArticles);

    limitedArticles.forEach((art, idx) => {
      const reg = art.name?.trim() || "Regulasi";
      const num = art.article_number?.trim() || "Pasal";
      let excerpt = art.content?.trim() ? art.content.trim().replace(/\s+/g, " ") : "";
      if (excerpt.length > maxExcerptLength) {
        excerpt = `${excerpt.slice(0, maxExcerptLength)}...`;
      }
      promptText += `${idx + 1}. ${reg} - ${num}${excerpt ? `: "${excerpt}"` : ""}\n`;
    });
    promptText += `\n`;
  }

  promptText += `TUGAS: Susun draf kontrak lengkap, definitif, dan siap pakai yang langsung mengikat PARA PIHAK dalam format HTML Tiptap. Rumuskan klausul secara tuntas dengan standar praktik bisnis terbaik tanpa opsi ganda [A/B/C] dan tanpa menyitir pasal UU di badan klausul.`;

  return promptText;
}
