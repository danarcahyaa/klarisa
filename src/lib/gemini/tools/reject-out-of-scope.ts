export const REJECT_OUT_OF_SCOPE = {
        type: "function",
        name: "reject_out_of_scope",
        description: "Panggil fungsi ini jika permintaan user di luar pembuatan atau penyusunan draf kontrak hukum.",
        parameters: {
          type: "OBJECT",
          properties: {
            reason: {
              type: "STRING",
              description: "Pesan penolakan sopan dan pengingat bahwa sistem berfokus pada draf kontrak hukum Indonesia."
            }
          },
          required: ["reason"]
        }
      } 