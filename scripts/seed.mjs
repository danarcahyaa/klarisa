import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const encryptionKey = process.env.CONTRACT_ENCRYPTION_KEY;
if (!url || !serviceRoleKey || !encryptionKey) throw new Error("Konfigurasi Supabase server belum tersedia.");

const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const key = Buffer.from(encryptionKey, "hex");

function stableUuid(seed) {
  const hex = createHash("sha256").update(seed).digest("hex").slice(0, 32).split("");
  hex[12] = "4";
  hex[16] = ["8", "9", "a", "b"][Number.parseInt(hex[16], 16) % 4];
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function encryptContent(content) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(content, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${encrypted.toString("hex")}`;
}

async function seedDraft(userId, draft) {
  const { data: existing, error: findError } = await supabase
    .from("contracts")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "draft")
    .eq("title", draft.title)
    .maybeSingle();
  if (findError) throw new Error(`contracts: ${findError.message}`);

  if (existing) return;

  const contractId = stableUuid(`${userId}:draft:${draft.slug}`);
  const { error: contractError } = await supabase.from("contracts").upsert({
    id: contractId,
    user_id: userId,
    title: draft.title,
    type: "draft",
    is_pinned: draft.isPinned,
  }, { onConflict: "id" });
  if (contractError) throw new Error(`contracts: ${contractError.message}`);

  const encrypted = encryptContent(draft.content);
  const { error: detailError } = await supabase.from("contract_draft").upsert({
    id: stableUuid(`${contractId}:detail`),
    contract_id: contractId,
    fairness_score: null,
    total_clausul_risk: 0,
    content: encrypted,
    metadata: {
      encryption: "aes-256-gcm",
      shared: draft.shared,
      recipients: draft.recipients,
      comments: draft.comments,
      version: 1,
      seeded_by: "klarisa-draft-v2",
    },
  }, { onConflict: "contract_id" });
  if (detailError) throw new Error(`contract_draft: ${detailError.message}`);

  const { data: version, error: versionFindError } = await supabase
    .from("document_drafts")
    .select("id")
    .eq("document_id", contractId)
    .eq("version", 1)
    .maybeSingle();
  if (versionFindError) throw new Error(`document_drafts: ${versionFindError.message}`);
  if (!version) {
    const { error: versionError } = await supabase.from("document_drafts").insert({
      id: stableUuid(`${contractId}:v1`),
      document_id: contractId,
      title: draft.title,
      body: encrypted,
      version: 1,
      created_by: userId,
    });
    if (versionError) throw new Error(`document_drafts: ${versionError.message}`);
  }
}

const draftContent = `<p><mark class="bg-amber-200 px-1">SURAT PERJANJIAN KERJA SAMA (SPK) RINGKAS</mark></p><p>Nomor: 001/SPK/2026</p><h2>PASAL 1: RUANG LINGKUP &amp; BIAYA</h2><p>PIHAK KEDUA melaksanakan pekerjaan desain identitas visual dengan nilai imbalan Rp20.000.000.</p><h2>PASAL 2: HAK CIPTA &amp; KERAHASIAAN</h2><p>Hak moral tetap melekat pada PIHAK KEDUA dan hak penggunaan komersial berlaku setelah pembayaran lunas.</p>`;
const drafts = [
  { slug: "identity", title: "Perjanjian Jasa Identitas Visual", content: draftContent, shared: false, recipients: 0, comments: 0, isPinned: true },
  { slug: "photography", title: "Draft Kerja Sama Fotografi", content: draftContent, shared: true, recipients: 2, comments: 2, isPinned: false },
];

const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
if (error) throw error;
if (!data.users.length) throw new Error("Buat minimal satu akun Klarisa sebelum menjalankan seed.");

for (const user of data.users) {
  for (const draft of drafts) await seedDraft(user.id, draft);
}

console.log(`Seed draft selesai untuk ${data.users.length} akun tanpa membuat data review.`);
