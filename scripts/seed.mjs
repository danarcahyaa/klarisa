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

async function backfillDraftSettings(userId, workspaceId) {
  const { data: ownedDrafts, error } = await supabase
    .from("contracts")
    .select("id, contract_draft(metadata)")
    .eq("user_id", userId)
    .eq("type", "draft");
  if (error) throw new Error(`contracts: ${error.message}`);

  for (const draft of ownedDrafts) {
    const metadata = draft.contract_draft?.metadata || {};
    const { error: settingsError } = await supabase.from("draft_settings").upsert({
      contract_id: draft.id,
      workspace_id: workspaceId,
      status: metadata.shared ? "shared" : "private",
    }, { onConflict: "contract_id" });
    if (settingsError) throw new Error(`draft_settings: ${settingsError.message}`);
  }
}

async function seedDraft(user, workspaceId, draft, collaborator) {
  const userId = user.id;
  const { data: existing, error: findError } = await supabase
    .from("contracts")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "draft")
    .eq("title", draft.title)
    .maybeSingle();
  if (findError) throw new Error(`contracts: ${findError.message}`);

  const contractId = existing?.id || stableUuid(`${userId}:draft:${draft.slug}`);
  let encrypted;
  if (!existing) {
    const { error: contractError } = await supabase.from("contracts").upsert({
      id: contractId,
      user_id: userId,
      title: draft.title,
      type: "draft",
      is_pinned: draft.isPinned,
    }, { onConflict: "id" });
    if (contractError) throw new Error(`contracts: ${contractError.message}`);

    encrypted = encryptContent(draft.content);
    const { error: detailError } = await supabase.from("contract_draft").upsert({
      id: stableUuid(`${contractId}:detail`),
      contract_id: contractId,
      fairness_score: null,
      total_clausul_risk: 0,
      content: encrypted,
      metadata: {
        encryption: "aes-256-gcm",
        shared: draft.shared,
        recipients: draft.shared && collaborator ? 1 : 0,
        comments: draft.shared && collaborator ? 2 : 0,
        version: 1,
        seeded_by: "klarisa-draft-v3",
      },
    }, { onConflict: "contract_id" });
    if (detailError) throw new Error(`contract_draft: ${detailError.message}`);
  }

  const { error: settingsError } = await supabase.from("draft_settings").upsert({
    contract_id: contractId,
    workspace_id: workspaceId,
    status: draft.shared ? "shared" : "private",
  }, { onConflict: "contract_id" });
  if (settingsError) throw new Error(`draft_settings: ${settingsError.message}`);

  const { data: version, error: versionFindError } = await supabase
    .from("document_drafts")
    .select("id")
    .eq("document_id", contractId)
    .eq("version", 1)
    .maybeSingle();
  if (versionFindError) throw new Error(`document_drafts: ${versionFindError.message}`);
  if (!version && encrypted) {
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

  if (draft.shared && collaborator && collaborator.id !== userId) {
    const { error: collaboratorError } = await supabase.from("draft_collaborators").upsert({
      contract_id: contractId,
      user_id: collaborator.id,
      invited_by: userId,
      role: "commenter",
    }, { onConflict: "contract_id,user_id" });
    if (collaboratorError) throw new Error(`draft_collaborators: ${collaboratorError.message}`);

    const ownerCommentId = stableUuid(`${contractId}:comment:owner`);
    const replyCommentId = stableUuid(`${contractId}:comment:reply`);
    const { error: ownerCommentError } = await supabase.from("draft_comments").upsert({
      id: ownerCommentId,
      contract_id: contractId,
      author_id: userId,
      body: "Mohon periksa batas waktu pembayaran pada bagian ini.",
      selected_text: "Pembayaran dilakukan maksimal 7 hari kerja.",
    }, { onConflict: "id" });
    if (ownerCommentError) throw new Error(`draft_comments: ${ownerCommentError.message}`);
    const { error: replyError } = await supabase.from("draft_comments").upsert({
      id: replyCommentId,
      contract_id: contractId,
      author_id: collaborator.id,
      parent_id: ownerCommentId,
      body: "Sudah jelas. Saya setuju menggunakan batas 7 hari kerja.",
    }, { onConflict: "id" });
    if (replyError) throw new Error(`draft_comments: ${replyError.message}`);

    const { data: detail, error: detailFindError } = await supabase
      .from("contract_draft")
      .select("metadata")
      .eq("contract_id", contractId)
      .single();
    if (detailFindError) throw new Error(`contract_draft: ${detailFindError.message}`);
    const { error: metadataError } = await supabase.from("contract_draft").update({
      metadata: { ...(detail.metadata || {}), shared: true, recipients: 1, comments: 2 },
    }).eq("contract_id", contractId);
    if (metadataError) throw new Error(`contract_draft: ${metadataError.message}`);
  }
}

const draftContent = `<p><mark class="bg-amber-200 px-1">SURAT PERJANJIAN KERJA SAMA (SPK) RINGKAS</mark></p><p>Nomor: 001/SPK/2026</p><h2>PASAL 1: RUANG LINGKUP &amp; BIAYA</h2><p>PIHAK KEDUA melaksanakan pekerjaan desain identitas visual dengan nilai imbalan Rp20.000.000.</p><h2>PASAL 2: HAK CIPTA &amp; KERAHASIAAN</h2><p>Hak moral tetap melekat pada PIHAK KEDUA dan hak penggunaan komersial berlaku setelah pembayaran lunas.</p>`;
const drafts = [
  { slug: "identity", title: "Perjanjian Jasa Identitas Visual", content: draftContent, shared: false, isPinned: true },
  { slug: "photography", title: "Draft Kerja Sama Fotografi", content: draftContent, shared: true, isPinned: false },
];

const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
if (error) throw error;
if (!data.users.length) throw new Error("Buat minimal satu akun Klarisa sebelum menjalankan seed.");

const workspaces = new Map();
for (const user of data.users) {
  const workspaceId = await ensureWorkspace(user);
  workspaces.set(user.id, workspaceId);
  await backfillDraftSettings(user.id, workspaceId);
}

for (const [index, user] of data.users.entries()) {
  const collaborator = data.users.length > 1 ? data.users[(index + 1) % data.users.length] : null;
  for (const draft of drafts) await seedDraft(user, workspaces.get(user.id), draft, collaborator);
}

console.log(`Seed draft, workspace, kolaborator, dan diskusi selesai untuk ${data.users.length} akun tanpa membuat data review.`);
