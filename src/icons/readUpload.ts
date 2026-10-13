export const MAX_UPLOAD_BYTES = 512 * 1024;
const ALLOWED_TYPES = ["image/svg+xml", "image/png", "image/jpeg", "image/webp"];

/** Valida tipo e tamanho antes de ler; a mensagem diz o que veio e o que é aceito. */
export const validateUpload = (file: { name: string; type: string; size: number }): string | null => {
  if (!ALLOWED_TYPES.includes(file.type)) return `"${file.name}" é ${file.type || "tipo desconhecido"}; aceito SVG, PNG, JPG ou WebP`;
  if (file.size > MAX_UPLOAD_BYTES) return `"${file.name}" tem ${Math.round(file.size / 1024)} KB; o limite é ${MAX_UPLOAD_BYTES / 1024} KB`;
  return null;
};

export const readAsDataUrl = (file: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("leitura do arquivo não gerou data URL")));
    reader.onerror = () => reject(reader.error ?? new Error("falha ao ler o arquivo"));
    reader.readAsDataURL(file);
  });
