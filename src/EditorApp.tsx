import "@excalidraw/excalidraw/index.css";
import { useCallback, useMemo, useState } from "react";
import { templateFromUrl, useStripTemplateParam } from "./app/useTemplateLoader";
import { useTheme } from "./app/useTheme";
import { TEMPLATES } from "./arch/templates";
import type { AuthUser } from "./auth/authGateway";
import type { DrawingStore } from "./drawings/drawingTypes";
import { useDrawingAutosave } from "./drawings/useDrawingAutosave";
import { useDrawingLibrary } from "./drawings/useDrawingLibrary";
import { Editor } from "./Editor";
import { DrawingLibraryModal } from "./ui/library/DrawingLibraryModal";

type EditorAppProps = { store: DrawingStore; user: AuthUser; onSignOut: () => void };

/** Área logada: biblioteca de desenhos da conta + o desenho aberto (remontado a cada troca). */
export const EditorApp = ({ store, user, onSignOut }: EditorAppProps) => {
  const theme = useTheme();
  // Lido antes de limpar a URL: o link de modelo vira um desenho novo na carga.
  const [linked] = useState(templateFromUrl);
  useStripTemplateParam();
  const handle = useMemo(() => ({ store, persistent: true }), [store]);
  const library = useDrawingLibrary(handle, linked);
  const autosave = useDrawingAutosave(library.current, library.sinks);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const openLibrary = useCallback(() => setLibraryOpen(true), []);
  const loadTemplate = useCallback((templateId: string) => void library.newFromTemplate(templateId), [library.newFromTemplate]);
  const account = useMemo(() => ({ user, onSignOut }), [user, onSignOut]);
  const current = library.current;

  if (!current) return <div className="app-loading">{library.error ?? "Abrindo seus desenhos…"}</div>;
  const name = library.drawings.find((drawing) => drawing.id === current.id)?.name ?? "Sem título";
  return (
    <>
      <Editor key={current.id} drawing={current} drawingName={name} theme={theme} account={account} onSceneChange={autosave.onSceneChange}
        onBookChange={autosave.onBookChange} onLoadTemplate={loadTemplate} onOpenLibrary={openLibrary} />
      <DrawingLibraryModal open={libraryOpen} library={library} templates={TEMPLATES} flushCurrent={autosave.flush} onClose={() => setLibraryOpen(false)} />
      {library.error && !libraryOpen && (
        <div className="app-toast" role="alert">{library.error} <button type="button" onClick={library.clearError}>Ok</button></div>
      )}
    </>
  );
};
