import mammoth from "mammoth";

/**
 * Input types supported for docx parsing.
 */
export type DocxInput = File | Blob | ArrayBuffer | Buffer | Uint8Array;

/**
 * Converts various input formats (File, Blob, Buffer, Uint8Array) into an ArrayBuffer.
 */
async function toArrayBuffer(input: DocxInput): Promise<ArrayBuffer> {
  if (!input) {
    throw new Error("No DOCX input provided.");
  }

  if (typeof Blob !== "undefined" && input instanceof Blob) {
    return await input.arrayBuffer();
  }

  if (input instanceof ArrayBuffer) {
    return input;
  }

  if (typeof Buffer !== "undefined" && Buffer.isBuffer(input)) {
    const buf = input as Buffer;
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  }

  if (input instanceof Uint8Array) {
    return input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer;
  }

  throw new Error("Unsupported DOCX input type.");
}

/**
 * Converts a .docx file to HTML format using Mammoth.
 *
 * @param input - The docx file as a File, Blob, ArrayBuffer, or Buffer.
 * @returns Promise<string> - The converted HTML string.
 */
export async function parseDocxToHtml(input: DocxInput): Promise<string> {
  const arrayBuffer = await toArrayBuffer(input);
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value.trim();
}



