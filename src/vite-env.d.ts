/// <reference types="vite/client" />

// Só o que é seguro no navegador: URL do projeto e chave pública. Nada de service_role aqui.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** "true" pula o login no `npm run dev` (desenhos no IndexedDB); ignorado no build de produção. */
  readonly VITE_DEV_SKIP_AUTH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
