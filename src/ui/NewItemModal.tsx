import { X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { IconDefinition } from "../icons/catalog";
import { categoryStyle } from "../icons/categoryStyle";
import { customIconRef } from "../icons/customIconStore";
import type { IconSource } from "../icons/iconSource";
import type { IconCategory } from "../model/types";
import { IconPicker } from "./IconPicker";
import { IconThumb } from "./IconThumb";

const NEW_CATEGORY = "__nova__";

/** Criar (nome sugerido) ou editar um item da paleta. Editar nunca insere no desenho. */
export type ItemModalMode = { kind: "create"; suggestedName: string } | { kind: "edit"; icon: IconDefinition; customizable: "custom" | "default" | "overridden" };

type NewItemModalProps = {
  mode: ItemModalMode | null;
  categories: readonly IconCategory[];
  onClose: () => void;
  onCreate: (icon: IconDefinition, insertNow: boolean) => void;
  onSave: (icon: IconDefinition) => void;
  onDelete: (ref: string) => void;
  onReset: (ref: string) => void;
};

type Draft = { name: string; category: string; newCategory: string; aliases: string; query: string; queryTouched: boolean; source: IconSource };

const emptyDraft = (name: string): Draft => ({ name, category: "compute", newCategory: "", aliases: "", query: name, queryTouched: false, source: { kind: "lucide" } });

const draftFrom = (icon: IconDefinition): Draft => ({
  name: icon.name, category: icon.category, newCategory: "", aliases: icon.aliases.join(", "), query: icon.name, queryTouched: false, source: icon.source,
});

const draftForMode = (mode: ItemModalMode): Draft => (mode.kind === "edit" ? draftFrom(mode.icon) : emptyDraft(mode.suggestedName));

// Editando, o ref se mantém (é a identidade do item na paleta); criando, nasce um ref novo.
const toDefinition = (draft: Draft, ref?: string): IconDefinition => ({
  ref: ref ?? customIconRef(draft.name, crypto.randomUUID().slice(0, 4)),
  name: draft.name.trim(),
  category: draft.category === NEW_CATEGORY ? draft.newCategory.trim() : draft.category,
  aliases: draft.aliases.split(",").map((alias) => alias.trim()).filter(Boolean),
  source: draft.source,
});

const isValid = (draft: Draft): boolean =>
  draft.name.trim() !== "" && (draft.category !== NEW_CATEGORY || draft.newCategory.trim() !== "");

type FooterProps = { mode: ItemModalMode; valid: boolean; onClose: () => void; onSubmit: (insertNow: boolean) => void; onDelete: (ref: string) => void; onReset: (ref: string) => void };

const ModalFooter = ({ mode, valid, onClose, onSubmit, onDelete, onReset }: FooterProps) => {
  if (mode.kind === "create") {
    return (
      <footer className="modal__foot">
        <button type="button" onClick={onClose}>Cancelar</button>
        <button type="button" disabled={!valid} onClick={() => onSubmit(false)}>Só salvar na paleta</button>
        <button type="submit" className="is-primary" disabled={!valid}>Criar e inserir</button>
      </footer>
    );
  }
  const { icon, customizable } = mode;
  return (
    <footer className="modal__foot">
      {customizable === "custom" && <button type="button" className="is-danger" onClick={() => onDelete(icon.ref)}>Apagar item</button>}
      {customizable === "overridden" && <button type="button" onClick={() => onReset(icon.ref)}>Restaurar padrão</button>}
      <span className="modal__spacer" />
      <button type="button" onClick={onClose}>Cancelar</button>
      <button type="submit" className="is-primary" disabled={!valid}>Salvar</button>
    </footer>
  );
};

/** Modal da paleta: criar item (nome, categoria, apelidos, ícone) ou editar um existente. */
export const NewItemModal = ({ mode, categories, onClose, onCreate, onSave, onDelete, onReset }: NewItemModalProps) => {
  const open = mode !== null;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(""));
  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (mode && !dialog.open) {
      setDraft(draftForMode(mode));
      dialog.showModal();
      // autoFocus do React só vale na montagem; o dialog já existe fechado, então o foco é explícito.
      requestAnimationFrame(() => nameRef.current?.focus());
    }
    if (!open && dialog.open) dialog.close();
  }, [mode, open]);

  // A busca de ícone acompanha o nome até o usuário editar a busca à mão.
  const onName = (name: string) => update(draft.queryTouched ? { name } : { name, query: name });

  const submit = (insertNow: boolean) => (event?: FormEvent) => {
    event?.preventDefault();
    if (!mode || !isValid(draft)) return;
    if (mode.kind === "edit") return onSave(toDefinition(draft, mode.icon.ref));
    onCreate(toDefinition(draft), insertNow);
  };

  const previewCategory = draft.category === NEW_CATEGORY ? draft.newCategory || "novo" : draft.category;

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose} aria-labelledby="new-item-title">
      <form onSubmit={submit(true)}>
        <header className="modal__head">
          <h2 id="new-item-title">{mode?.kind === "edit" ? "Editar item da paleta" : "Novo item"}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </header>
        <div className="modal__body">
          <div className="modal__preview">
            <IconThumb icon={{ ref: "preview", category: previewCategory, source: draft.source }} size={56} />
            <span>{draft.name || "Nome do item"}</span>
          </div>
          <label className="field"><span>Nome</span>
            <input ref={nameRef} required value={draft.name} placeholder="ex.: ScaledJob, React, Supabase" onChange={(e) => onName(e.target.value)} />
          </label>
          <label className="field"><span>Categoria</span>
            <select value={draft.category} onChange={(e) => update({ category: e.target.value })}>
              {categories.map((category) => <option key={category} value={category}>{categoryStyle(category).label}</option>)}
              <option value={NEW_CATEGORY}>+ Nova categoria…</option>
            </select>
          </label>
          {draft.category === NEW_CATEGORY && (
            <label className="field"><span>Nome da nova categoria</span>
              <input required value={draft.newCategory} placeholder="ex.: Jobs, Observabilidade" onChange={(e) => update({ newCategory: e.target.value })} />
            </label>
          )}
          <label className="field"><span>Apelidos para a busca (separados por vírgula)</span>
            <input value={draft.aliases} placeholder="ex.: keda, job, batch" onChange={(e) => update({ aliases: e.target.value })} />
          </label>
          <IconPicker query={draft.query} onQuery={(query) => update({ query, queryTouched: true })}
            category={previewCategory} picked={draft.source} onPick={(source) => update({ source })} />
        </div>
        {mode?.kind === "edit" && <p className="hint modal__note">Muda o item na paleta; cards que já estão no desenho continuam como estão.</p>}
        {mode && <ModalFooter mode={mode} valid={isValid(draft)} onClose={onClose} onSubmit={(insertNow) => submit(insertNow)()} onDelete={onDelete} onReset={onReset} />}
      </form>
    </dialog>
  );
};
