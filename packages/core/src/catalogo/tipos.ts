/** Una imagen ya verificada en Cloudinary — SPEC.md §7 `imagenes[]`. */
export interface ImagenGuardada {
  publicId: string;
  url: string;
  ancho: number | null;
  alto: number | null;
  alt: string;
}
