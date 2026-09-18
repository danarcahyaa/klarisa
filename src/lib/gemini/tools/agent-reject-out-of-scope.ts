/**
 * Gemini tool declaration for rejecting requests outside the scope of contract management.
 * Used when user prompts pertain to unrelated domains (e.g., programming, recipes, general science, politics).
 */
export const AGENT_REJECT_OUT_OF_SCOPE = {
  type: "function",
  name: "agent_reject_out_of_scope",
  description:
    "Panggil fungsi ini jika permintaan pengguna berada di luar cakupan pembuatan, peninjauan, analisis, atau penyusunan draf kontrak (seperti pemrograman, resep masakan, pengetahuan umum, sains, atau topik di luar kontrak).",
  parameters: {
    type: "OBJECT",
    properties: {
      reason: {
        type: "STRING",
        description:
          "Pesan penolakan yang sopan dan ramah dalam bahasa Indonesia bahwa asisten berfokus khusus pada draf dan dokumen kontrak.",
      },
    },
    required: ["reason"],
  },
};
