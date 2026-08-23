import { createCipheriv, createHash, randomBytes } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const encryptionKey = process.env.CONTRACT_ENCRYPTION_KEY;
const targetEmail = process.env.SEED_USER_EMAIL?.trim().toLocaleLowerCase("id-ID");
const seedSlugs = ["identity", "photography"];
const clearAllDrafts = process.argv.includes("--clear-all-drafts");

if (!url || !serviceRoleKey || !encryptionKey) {
  throw new Error("Konfigurasi Supabase server belum tersedia.");
}

const key = Buffer.from(encryptionKey, "hex");
if (key.length !== 32) {
  throw new Error("CONTRACT_ENCRYPTION_KEY harus berupa 64 karakter heksadesimal.");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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

async function ensureWorkspace(user) {
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Pengguna Klarisa";
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: fullName,
    avatar_url: user.user_metadata?.avatar_url || null,
  }, { onConflict: "id" });
  if (profileError) throw new Error(`profiles: ${profileError.message}`);

  const workspaceId = stableUuid(`${user.id}:workspace:personal`);
  const { error: workspaceError } = await supabase.from("workspaces").upsert({
    id: workspaceId,
    owner_id: user.id,
    name: "Workspace pribadi",
  }, { onConflict: "id" });
  if (workspaceError) throw new Error(`workspaces: ${workspaceError.message}`);

  const { error: memberError } = await supabase.from("workspace_members").upsert({
    workspace_id: workspaceId,
    user_id: user.id,
    role: "owner",
  }, { onConflict: "workspace_id,user_id" });
  if (memberError) throw new Error(`workspace_members: ${memberError.message}`);
  return workspaceId;
}

async function clearSeededDrafts(userId) {
  const candidateIds = seedSlugs.map((slug) => stableUuid(`${userId}:draft:${slug}`));
  let query = supabase
    .from("contracts")
    .select("id, contract_draft(metadata)")
    .eq("user_id", userId)
    .eq("type", "draft");
  if (!clearAllDrafts) query = query.in("id", candidateIds);
  const { data: drafts, error } = await query;
  if (error) throw new Error(`contracts: ${error.message}`);

  const contractIds = (drafts ?? []).map((draft) => draft.id);

  if (contractIds.length) {
    for (const table of ["draft_comments", "draft_collaborators", "draft_settings"]) {
      const { error: deleteError } = await supabase.from(table).delete().in("contract_id", contractIds);
      if (deleteError) throw new Error(`${table}: ${deleteError.message}`);
    }
  }

  const versionDocumentIds = clearAllDrafts ? contractIds : candidateIds;
  const { error: versionError } = await supabase.from("document_drafts").delete().in("document_id", versionDocumentIds);
  if (versionError) throw new Error(`document_drafts: ${versionError.message}`);

  if (contractIds.length) {
    const { error: detailError } = await supabase.from("contract_draft").delete().in("contract_id", contractIds);
    if (detailError) throw new Error(`contract_draft: ${detailError.message}`);
    const { error: contractError } = await supabase.from("contracts").delete().in("id", contractIds).eq("user_id", userId);
    if (contractError) throw new Error(`contracts: ${contractError.message}`);
  }
  return contractIds.length;
}

async function seedDraft(user, workspaceId, draft, collaborator) {
  const contractId = stableUuid(`${user.id}:draft:${draft.slug}`);
  const encrypted = encryptContent(draft.content);
  const versionId = stableUuid(`${contractId}:v1`);
  const commentCount = draft.shared && collaborator && collaborator.id !== user.id ? 2 : 0;

  const { error: contractError } = await supabase.from("contracts").insert({
    id: contractId,
    user_id: user.id,
    title: draft.title,
    type: "draft",
    is_pinned: draft.isPinned,
  });
  if (contractError) throw new Error(`contracts: ${contractError.message}`);

  const { error: detailError } = await supabase.from("contract_draft").insert({
    id: stableUuid(`${contractId}:detail`),
    contract_id: contractId,
    fairness_score: null,
    total_clausul_risk: 0,
    content: encrypted,
    metadata: {
      encryption: "aes-256-gcm",
      shared: draft.shared,
      recipients: draft.shared && collaborator ? 1 : 0,
      comments: commentCount,
      version: 1,
      active_version_id: versionId,
      seeded_by: "klarisa-draft-v4",
    },
  });
  if (detailError) throw new Error(`contract_draft: ${detailError.message}`);

  const { error: settingsError } = await supabase.from("draft_settings").insert({
    contract_id: contractId,
    workspace_id: workspaceId,
    status: draft.shared ? "shared" : "private",
  });
  if (settingsError) throw new Error(`draft_settings: ${settingsError.message}`);

  const { error: versionError } = await supabase.from("document_drafts").upsert({
    id: versionId,
    document_id: contractId,
    title: draft.title,
    body: encrypted,
    version: 1,
    created_by: user.id,
  }, { onConflict: "id" });
  if (versionError) throw new Error(`document_drafts: ${versionError.message}`);

  if (!draft.shared || !collaborator || collaborator.id === user.id) return;

  const { error: collaboratorError } = await supabase.from("draft_collaborators").insert({
    contract_id: contractId,
    user_id: collaborator.id,
    invited_by: user.id,
    role: "commenter",
  });
  if (collaboratorError) throw new Error(`draft_collaborators: ${collaboratorError.message}`);

  const selectedText = "Pembayaran dilakukan maksimal 7 hari kerja";
  const start = draft.content.indexOf(selectedText);
  const ownerCommentId = stableUuid(`${contractId}:comment:owner`);
  const { error: ownerCommentError } = await supabase.from("draft_comments").insert({
    id: ownerCommentId,
    contract_id: contractId,
    document_version_id: versionId,
    author_id: user.id,
    body: "Mohon periksa batas waktu pembayaran pada bagian ini.",
    selected_text: selectedText,
    position_start: start,
    position_end: start + selectedText.length,
  });
  if (ownerCommentError) throw new Error(`draft_comments: ${ownerCommentError.message}`);

  const { error: replyError } = await supabase.from("draft_comments").insert({
    id: stableUuid(`${contractId}:comment:reply`),
    contract_id: contractId,
    document_version_id: versionId,
    author_id: collaborator.id,
    parent_id: ownerCommentId,
    body: "Sudah jelas. Saya setuju menggunakan batas 7 hari kerja.",
  });
  if (replyError) throw new Error(`draft_comments: ${replyError.message}`);
}

const draftContent = `<p>SURAT PERJANJIAN KERJA SAMA (SPK) RINGKAS</p><p>Nomor: 001/SPK/2026</p><h2>PASAL 1: RUANG LINGKUP &amp; BIAYA</h2><p>PIHAK KEDUA melaksanakan pekerjaan desain identitas visual dengan nilai imbalan Rp20.000.000.</p><p>Pembayaran dilakukan maksimal 7 hari kerja setelah pekerjaan diserahkan.</p><h2>PASAL 2: HAK CIPTA &amp; KERAHASIAAN</h2><p>Hak moral tetap melekat pada PIHAK KEDUA dan hak penggunaan komersial berlaku setelah pembayaran lunas.</p>`;
const drafts = [
  { slug: "identity", title: "Perjanjian Jasa Identitas Visual", content: draftContent, shared: false, isPinned: true },
  { slug: "photography", title: "Draft Kerja Sama Fotografi", content: draftContent, shared: true, isPinned: false },
];

const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
if (error) throw error;
if (!data.users.length) throw new Error("Buat minimal satu akun Klarisa sebelum menjalankan seed.");

const users = targetEmail
  ? data.users.filter((user) => user.email?.toLocaleLowerCase("id-ID") === targetEmail)
  : data.users.length === 1 ? data.users : [];
if (!users.length) {
  throw new Error("Isi SEED_USER_EMAIL dengan email akun uji agar seed hanya mengubah data dummy pada akun tersebut.");
}

let deletedDrafts = 0;
for (const user of users) deletedDrafts += await clearSeededDrafts(user.id);

for (const user of users) {
  const workspaceId = await ensureWorkspace(user);
  const collaborator = data.users.find((candidate) => candidate.id !== user.id) ?? null;
  for (const draft of drafts) await seedDraft(user, workspaceId, draft, collaborator);
}

console.log(`Seed selesai: ${deletedDrafts} draft ${clearAllDrafts ? "lama" : "dummy lama"} dibersihkan dan ${drafts.length * users.length} draft dummy baru dibuat. Tidak ada tabel review atau RAG yang diubah.`);
