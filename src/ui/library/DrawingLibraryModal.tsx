import { FilePlus2, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { filterDrawings, type CollectionFilter } from "../../drawings/drawingLibrary";
import type { DrawingCollection } from "../../drawings/drawingTypes";
import type { DrawingLibrary } from "../../drawings/useDrawingLibrary";
import { CollectionNav } from "./CollectionNav";
import { DrawingCard } from "./DrawingCard";

type DrawingLibraryModalProps = {
  open: boolean;
  library: DrawingLibrary;
  templates: readonly { id: string; title: string }[];
  /** Grava o que está pendente no desenho aberto (duplicar precisa da versão mais nova). */
  flushCurrent: () => Promise<void>;
  onClose: () => void;
};

const collectionOf = (filter: CollectionFilter): string | null => (filter === "all" || filter === "none" ? null : filter);

const useNativeDialog = (open: boolean) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return dialogRef;
};

const NewDrawingControls = ({ library, templates, filter, onCreated }: { library: DrawingLibrary; templates: DrawingLibraryModalProps["templates"]; filter: CollectionFilter; onCreated: () => void }) => (
  <div className="library__new">
    <button type="button" className="is-primary" onClick={() => void library.newBlank(collectionOf(filter)).then(onCreated)}><FilePlus2 size={16} /> Novo desenho</button>
    <select value="" aria-label="Novo desenho a partir de modelo"
      onChange={(e) => e.target.value && void library.newFromTemplate(e.target.value).then(onCreated)}>
      <option value="">A partir de modelo…</option>
      {templates.map((template) => <option key={template.id} value={template.id}>{template.title}</option>)}
    </select>
  </div>
);

/** "Meus desenhos": coleções, busca, novo (em branco ou modelo), abrir, renomear, mover, duplicar e apagar. */
export const DrawingLibraryModal = ({ open, library, templates, flushCurrent, onClose }: DrawingLibraryModalProps) => {
  const dialogRef = useNativeDialog(open);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CollectionFilter>("all");
  const visible = filterDrawings(library.drawings, { query, collection: filter });
  const now = Date.now();
  const openDrawing = (id: string) => void library.open(id).then(onClose);
  const confirmDelete = (name: string, id: string) => { if (window.confirm(`Apagar “${name}”? Não dá para desfazer.`)) void library.remove(id); };
  const removeCollection = (collection: DrawingCollection) => {
    if (!window.confirm(`Apagar a coleção “${collection.name}”? Os desenhos dela continuam, sem coleção.`)) return;
    if (filter === collection.id) setFilter("all");
    void library.removeCollection(collection.id);
  };

  return (
    <dialog ref={dialogRef} className="modal library" onClose={onClose} aria-labelledby="library-title">
      <header className="modal__head">
        <h2 id="library-title">Meus desenhos</h2>
        <button type="button" className="modal__close" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
      </header>
      <div className="library__layout">
        <CollectionNav drawings={library.drawings} collections={library.collections} selected={filter} onSelect={setFilter}
          onAdd={(name) => void library.addCollection(name)} onRename={(c, name) => void library.renameCollection(c, name)} onRemove={removeCollection} />
        <section className="library__main">
          <div className="library__bar">
            <label className="library__search"><Search size={15} aria-hidden />
              <input type="search" value={query} placeholder="Buscar pelo nome" onChange={(e) => setQuery(e.target.value)} aria-label="Buscar desenho" />
            </label>
            <NewDrawingControls library={library} templates={templates} filter={filter} onCreated={onClose} />
          </div>
          {library.error && <p className="hint is-error">{library.error}</p>}
          {!library.persistent && <p className="hint is-error">O navegador bloqueou o armazenamento: estes desenhos somem ao fechar a aba.</p>}
          {visible.length === 0 && <p className="hint">{query ? `Nenhum desenho com “${query}”.` : "Nenhum desenho aqui ainda."}</p>}
          <div className="library__grid">
            {visible.map((drawing) => (
              <DrawingCard key={drawing.id} drawing={drawing} collections={library.collections} isOpen={drawing.id === library.current?.id} now={now}
                onOpen={() => openDrawing(drawing.id)} onRename={(name) => void library.rename(drawing.id, name)}
                onMove={(collectionId) => void library.move(drawing.id, collectionId)}
                onDuplicate={() => void library.duplicate(drawing.id, flushCurrent)} onDelete={() => confirmDelete(drawing.name, drawing.id)} />
            ))}
          </div>
        </section>
      </div>
    </dialog>
  );
};
