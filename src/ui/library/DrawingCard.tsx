import { Copy, Image, Trash2 } from "lucide-react";
import { editedAgo } from "../../drawings/drawingLibrary";
import type { DrawingCollection, DrawingMeta } from "../../drawings/drawingTypes";
import { InlineName } from "./InlineName";

type DrawingCardProps = {
  drawing: DrawingMeta;
  collections: readonly DrawingCollection[];
  isOpen: boolean;
  now: number;
  onOpen: () => void;
  onRename: (name: string) => void;
  onMove: (collectionId: string | null) => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

const NO_COLLECTION = "";

/** Cartão de um desenho na lista: miniatura (abre), nome editável, coleção e ações. */
export const DrawingCard = ({ drawing, collections, isOpen, now, onOpen, onRename, onMove, onDuplicate, onDelete }: DrawingCardProps) => (
  <article className={`drawing-card${isOpen ? " is-open" : ""}`}>
    <button type="button" className="drawing-card__thumb" onClick={onOpen} title={`Abrir “${drawing.name}”`}>
      {drawing.thumbnail ? <img src={drawing.thumbnail} alt="" /> : <Image size={28} aria-hidden />}
      {isOpen && <span className="drawing-card__badge">Aberto</span>}
    </button>
    <div className="drawing-card__body">
      <InlineName value={drawing.name} label={`Renomear “${drawing.name}”`} onCommit={onRename} />
      <span className="drawing-card__meta">Editado {editedAgo(drawing.updatedAt, now)}</span>
      <div className="drawing-card__actions">
        <select value={drawing.collectionId ?? NO_COLLECTION} onChange={(e) => onMove(e.target.value || null)} aria-label="Coleção">
          <option value={NO_COLLECTION}>Sem coleção</option>
          {collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}
        </select>
        <button type="button" className="icon-button" onClick={onDuplicate} title="Duplicar" aria-label={`Duplicar “${drawing.name}”`}><Copy size={15} /></button>
        <button type="button" className="icon-button is-danger" onClick={onDelete} title="Apagar" aria-label={`Apagar “${drawing.name}”`}><Trash2 size={15} /></button>
      </div>
    </div>
  </article>
);
