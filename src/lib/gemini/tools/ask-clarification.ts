export const ASK_CLARIFICATION = {
    type: "function",
    name: "ask_clarification",
    description: "Panggil fungsi ini jika input pengguna berupa sapaan atau belum menyebutkan kontrak yang ingin dibuat.",
    parameters: {
        type: "OBJECT",
        properties: {
            message_to_user: {
                type: "STRING",
                description: "Pesan ramah untuk menanyakan hal-hal yang kurang jelas pada input pengguna."
            },
          },
    required: ["message_to_user"]
    }
}