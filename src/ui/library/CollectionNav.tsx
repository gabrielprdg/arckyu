import { FolderPlus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { CollectionFilter } from "../../drawings/drawingLibrary";
import type { DrawingCollection, DrawingMeta } from "../../drawings/drawingTypes";
import { InlineName } from "./InlineName";

type CollectionNavProps = {
  drawings: readonly DrawingMeta[];
  collections: readonly DrawingCollection[];
  selected: CollectionFilter;
  onSelect: (filter: CollectionFilter) => void;
  onAdd: (name: string) => void;
  onRename: (collection: DrawingCollection, name: string) => void;
  onRemove: (collection: DrawingCollection) => void;
};

const countIn = (drawings: readonly DrawingMeta[], filter: CollectionFilter): number =>
  drawings.filter((d) => filter === "all" || (filter === "none" ? d.collectionId === null : d.collectionId === filter)).length;

const NavItem = ({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) => (
  <button type="button" className={`collection-nav__item${active ? " is-active" : ""}`} onClick={onClick}>
    <span>{label}</span><span className="collection-nav__count">{count}</span>
  </button>
);

/** Coleções à esquerda: todos, sem coleção e as do usuário (criar, renomear, apagar). */
export const CollectionNav = ({ drawings, collections, selected, onSelect, onAdd, onRename, onRemove }: CollectionNavProps) => {
  const [adding, setAdding] = useState(false);
  return (
    <nav className="collection-nav" aria-label="Coleções">
      <NavItem active={selected === "all"} label="Todos" count={drawings.length} onClick={() => onSelect("all")} />
      <NavItem active={selected === "none"} label="Sem coleção" count={countIn(drawings, "none")} onClick={() => onSelect("none")} />
      <h3 className="collection-nav__title">Coleções</h3>
      {collections.map((collection) => (
        <div key={collection.id} className={`collection-nav__row${selected === collection.id ? " is-active" : ""}`}>
          <button type="button" className="collection-nav__pick" onClick={() => onSelect(collection.id)} aria-label={`Ver coleção “${collection.name}”`} />
          <InlineName value={collection.name} label={`Renomear coleção “${collection.name}”`} onCommit={(name) => onRename(collection, name)} />
          <span className="collection-nav__count">{countIn(drawings, collection.id)}</span>
          <button type="button" className="icon-button is-danger" onClick={() => onRemove(collection)} title="Apagar coleção" aria-label={`Apagar coleção “${collection.name}”`}><Trash2 size={13} /></button>
        </div>
      ))}
      {adding
        ? <InlineName value="Nova coleção" label="Nome da nova coleção" startEditing onCommit={onAdd} onDone={() => setAdding(false)} />
        : <button type="button" className="collection-nav__add" onClick={() => setAdding(true)}><FolderPlus size={15} /> Nova coleção</button>}
    </nav>
  );
};
