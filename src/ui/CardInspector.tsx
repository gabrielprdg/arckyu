import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { ImageUp } from "lucide-react";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import { readCardData, withArchData } from "../arch/archData";
import type { IconSource } from "../icons/iconSource";
import type { ArchCardData, IconCategory } from "../model/types";
import { IconPicker } from "./IconPicker";

export type CardEditActions = {
  onPatch: (id: string, customData: Record<string, unknown>) => void;
  onRename: (cardId: string, name: string) => void;
  onCaption: (cardId: string, caption: string) => void;
  onChangeIcon: (cardId: string, name: string, category: IconCategory, source: IconSource) => Promise<void>;
};

type CardInspectorProps = CardEditActions & { element: ExcalidrawElement; name: string; caption: string; category: IconCategory };

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="field"><span>{label}</span>{children}</label>
);

// Enter grava o campo de uma linha (o blur também grava); no textarea, Enter quebra linha e só o blur grava.
const commitOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
  if (event.key === "Enter") event.currentTarget.blur();
};

const IconSection = ({ element, name, category, onChangeIcon }: Pick<CardInspectorProps, "element" | "name" | "category" | "onChangeIcon">) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(name);
  const [busy, setBusy] = useState(false);
  if (!open) {
    return <button type="button" className="inspector__action" onClick={() => setOpen(true)}><ImageUp size={16} /> Trocar ícone</button>;
  }
  const pick = async (source: IconSource) => {
    setBusy(true);
    try {
      await onChangeIcon(element.id, name, category, source);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="inspector__icon-picker">
      <IconPicker query={query} onQuery={setQuery} category={category} picked={{ kind: "lucide" }} onPick={(source) => void pick(source)} />
      <button type="button" className="inspector__action" disabled={busy} onClick={() => setOpen(false)}>{busy ? "Aplicando…" : "Cancelar"}</button>
    </div>
  );
};

/** Edição do componente: nome e legenda (no canvas), ícone, e dados de arquitetura (customData). */
export const CardInspector = (props: CardInspectorProps) => {
  const { element, name, caption, onPatch, onRename, onCaption } = props;
  const data = readCardData(element);
  if (!data) return null;
  const set = (patch: Partial<ArchCardData>) => onPatch(element.id, withArchData(element.customData, { ...data, ...patch }));
  // Inputs não controlados (key = id): a cena volta pelo onChange um frame depois e controlado faria o cursor pular.
  return (
    <div key={element.id}>
      <h2>Componente</h2>
      <Field label="Nome"><input defaultValue={name} onKeyDown={commitOnEnter} onBlur={(e) => onRename(element.id, e.target.value)} /></Field>
      <Field label="Legenda no diagrama (linhas abaixo do nome)">
        <textarea rows={3} defaultValue={caption} placeholder="Ex.: [NestJS] API de produto" onBlur={(e) => onCaption(element.id, e.target.value)} />
      </Field>
      <IconSection {...props} />
      <h3>Dados do componente</h3>
      <Field label="Tecnologia"><input defaultValue={data.technology} placeholder="Ex.: NestJS · Node 22" onChange={(e) => set({ technology: e.target.value })} /></Field>
      <Field label="Responsável"><input defaultValue={data.owner} placeholder="Ex.: time de pagamentos" onChange={(e) => set({ owner: e.target.value })} /></Field>
      <Field label="Descrição"><textarea rows={4} defaultValue={data.description} placeholder="O que esse componente faz" onChange={(e) => set({ description: e.target.value })} /></Field>
      <p className="hint">Cor e espessura da moldura ficam no painel do Excalidraw (à esquerda).</p>
    </div>
  );
};
