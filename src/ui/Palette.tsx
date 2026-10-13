import { Pencil, Plus } from "lucide-react";
import { useMemo, useState, type DragEvent } from "react";
import { PALETTE_MIME, type PaletteItem } from "../app/useArchInsert";
import type { IconLibrary } from "../app/useIconLibrary";
import { BOUNDARIES } from "../arch/boundaries";
import type { IconDefinition } from "../icons/catalog";
import { categoryStyle } from "../icons/categoryStyle";
import { searchIcons } from "../icons/searchIcons";
import type { IconCategory } from "../model/types";
import { IconThumb } from "./IconThumb";

type PaletteProps = {
  library: IconLibrary;
  onInsert: (item: PaletteItem) => void;
  onCreate: (suggestedName: string) => void;
  onEdit: (icon: IconDefinition) => void;
};

const startDrag = (event: DragEvent, item: PaletteItem): void => {
  event.dataTransfer.setData(PALETTE_MIME, JSON.stringify(item));
  event.dataTransfer.effectAllowed = "copy";
};

const groupByCategory = (icons: IconDefinition[], categories: readonly IconCategory[]): [IconCategory, IconDefinition[]][] =>
  categories
    .map((category): [IconCategory, IconDefinition[]] => [category, icons.filter((icon) => icon.category === category)])
    .filter(([, list]) => list.length > 0);

// Linha com dois botões irmãos (inserir e editar): botão dentro de botão não é HTML válido.
const IconItem = ({ icon, onInsert, onEdit }: { icon: IconDefinition; onInsert: PaletteProps["onInsert"]; onEdit: PaletteProps["onEdit"] }) => {
  const item: PaletteItem = { kind: "component", ref: icon.ref };
  return (
    <div className="palette__row">
      <button className="palette__item" draggable title={`Clique ou arraste · ${icon.aliases.join(", ")}`}
        onClick={() => onInsert(item)} onDragStart={(event) => startDrag(event, item)}>
        <IconThumb icon={icon} />
        <span>{icon.name}</span>
        {icon.ref.startsWith("custom:") && <span className="palette__mine">meu</span>}
      </button>
      <button className="palette__edit" onClick={() => onEdit(icon)} title={`Editar “${icon.name}” na paleta`} aria-label={`Editar ${icon.name}`}>
        <Pencil size={14} />
      </button>
    </div>
  );
};

const BoundaryItems = ({ onInsert }: Pick<PaletteProps, "onInsert">) => (
  <section>
    <h3>Fronteiras (C4)</h3>
    {BOUNDARIES.map((boundary) => {
      const item: PaletteItem = { kind: "boundary", boundary: boundary.kind };
      return (
        <button key={boundary.kind} className="palette__item" draggable onClick={() => onInsert(item)} onDragStart={(event) => startDrag(event, item)}>
          <span className="palette__frame" /><span>{boundary.label}</span>
        </button>
      );
    })}
  </section>
);

export const Palette = ({ library, onInsert, onCreate, onEdit }: PaletteProps) => {
  const [query, setQuery] = useState("");
  const groups = useMemo(() => groupByCategory(searchIcons(library.icons, query), library.categories), [library, query]);
  return (
    <aside className="panel palette">
      <div className="palette__head">
        <input className="palette__search" placeholder="Buscar: pg, fila, lambda…" value={query}
          onChange={(event) => setQuery(event.target.value)} aria-label="Buscar ícones" />
        <button className="palette__new" onClick={() => onCreate(query)} title="Criar um item que não está na lista"><Plus size={16} /></button>
      </div>
      <p className="palette__hint">Clique para inserir no centro ou arraste para o canvas.</p>
      {groups.length === 0 && (
        <button className="palette__create" onClick={() => onCreate(query)}>
          <Plus size={14} /> Criar “{query}”
        </button>
      )}
      {groups.map(([category, icons]) => (
        <section key={category}>
          <h3>{categoryStyle(category).label}</h3>
          {icons.map((icon) => <IconItem key={icon.ref} icon={icon} onInsert={onInsert} onEdit={onEdit} />)}
        </section>
      ))}
      <BoundaryItems onInsert={onInsert} />
    </aside>
  );
};
