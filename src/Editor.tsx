import { Excalidraw } from "@excalidraw/excalidraw";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState, BinaryFiles, ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { buildSceneGraph } from "./arch/sceneGraph";
import { resolveInspectorTarget } from "./app/inspectorTarget";
import { activeScenario, addScenario, selectScenario, type ScenarioBook } from "./app/scenarioBook";
import { useAltPShortcut } from "./app/useAltPShortcut";
import { useAnimationExport } from "./app/useAnimationExport";
import { PALETTE_MIME, parsePaletteItem, useArchInsert } from "./app/useArchInsert";
import { useCardEditing } from "./app/useCardEditing";
import { useIconLibrary } from "./app/useIconLibrary";
import { useLegacyIconMigration } from "./app/useLegacyIconMigration";
import { useNewItemModal } from "./app/useNewItemModal";
import { usePlayView, useRecordingBadges } from "./app/usePlayView";
import { usePlayer } from "./app/usePlayer";
import { useSceneSnapshot } from "./app/useSceneSnapshot";
import { useScenarioRecorder } from "./app/useScenarioRecorder";
import { useTextRemeasure } from "./app/useTextRemeasure";
import type { ThemeControls } from "./app/useTheme";
import { TEMPLATES } from "./arch/templates";
import type { OpenDrawing } from "./drawings/useDrawingLibrary";
import type { Scenario } from "./model/types";
import { FlowOverlay } from "./overlay/FlowOverlay";
import { ExportAnimationModal } from "./ui/ExportAnimationModal";
import { Inspector } from "./ui/Inspector";
import { NewItemModal } from "./ui/NewItemModal";
import { Palette } from "./ui/Palette";
import { Toolbar } from "./ui/Toolbar";
import type { AccountControls } from "./ui/UserMenu";

// Constante fora do componente: objeto novo a cada render faria o Excalidraw re-renderizar.
const EXCALIDRAW_UI = { canvasActions: { toggleTheme: true } };

// A API fica pronta antes da cena; enquadra uma vez quando os elementos chegam.
// Espera o canvas ter tamanho: enquadrar com largura 0 (editor recém-montado) cai no zoom mínimo de 10%.
const MAX_FIT_FRAMES = 120;

const useFitOnFirstLoad = (api: ExcalidrawImperativeAPI | null, hasElements: boolean): void => {
  const doneRef = useRef(false);
  useEffect(() => {
    if (!api || !hasElements || doneRef.current) return;
    let frames = 0;
    let frameId = 0;
    const fit = (): void => {
      const { width, height } = api.getAppState();
      if ((width < 50 || height < 50) && frames++ < MAX_FIT_FRAMES) { frameId = requestAnimationFrame(fit); return; }
      doneRef.current = true;
      api.scrollToContent(undefined, { fitToContent: true, animate: false });
    };
    frameId = requestAnimationFrame(fit);
    return () => cancelAnimationFrame(frameId);
  }, [api, hasElements]);
};

const useEditorState = (drawing: OpenDrawing) => {
  const [initial] = useState(drawing.initialData);
  const [book, setBook] = useState<ScenarioBook>(drawing.book);
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [paused, setPaused] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);
  return { initial, book, setBook, api, setApi, paused, setPaused, playSpeed, setPlaySpeed, exportOpen, setExportOpen };
};

// Drop da paleta é capturado antes do Excalidraw, que trataria como arquivo.
const paletteDropHandlers = (insertAtClient: ReturnType<typeof useArchInsert>["insertAtClient"]) => ({
  onDragOverCapture: (event: DragEvent) => {
    if (event.dataTransfer.types.includes(PALETTE_MIME)) event.preventDefault();
  },
  onDropCapture: (event: DragEvent) => {
    const item = parsePaletteItem(event.dataTransfer.getData(PALETTE_MIME));
    if (!item) return;
    event.preventDefault();
    event.stopPropagation();
    insertAtClient(item, event.clientX, event.clientY);
  },
});

/** O que o editor recebe do app: o desenho aberto e para onde mandar as mudanças. */
export type EditorProps = {
  drawing: OpenDrawing;
  drawingName: string;
  theme: ThemeControls;
  account: AccountControls;
  /** Mudanças vêm com o id do desenho: quem salva ignora avisos de um desenho que já não é o aberto. */
  onSceneChange: (drawingId: string, elements: readonly OrderedExcalidrawElement[], appState: AppState, files: BinaryFiles) => void;
  onBookChange: (drawingId: string, book: ScenarioBook) => void;
  onLoadTemplate: (templateId: string) => void;
  onOpenLibrary: () => void;
};

/** Um desenho aberto: canvas do Excalidraw + camada de arquitetura. O app remonta (key) ao trocar de desenho. */
export const Editor = ({ drawing, drawingName, theme, account, onSceneChange, onBookChange, onLoadTemplate, onOpenLibrary }: EditorProps) => {
  const s = useEditorState(drawing);
  const library = useIconLibrary();
  const modal = useNewItemModal(s.api, library);
  const { snapshot, onChange: onSnapshot } = useSceneSnapshot();
  useEffect(() => onBookChange(drawing.id, s.book), [drawing.id, s.book, onBookChange]);
  const scenario = activeScenario(s.book);
  // Elementos mutam no lugar: a dependência real é o sceneVersion, não o array.
  const graph = useMemo(() => buildSceneGraph(snapshot.elements), [snapshot.sceneVersion]);
  const steps = useMemo(() => scenario?.steps ?? [], [scenario]);
  const player = usePlayer(steps, s.playSpeed);
  const playView = usePlayView(graph, steps, player.state, player.progressRef);
  const onRecorded = useCallback((recorded: Scenario) => s.setBook((book) => addScenario(book, recorded)), [s.setBook]);
  const recorder = useScenarioRecorder(graph, snapshot.selectedIds, onRecorded);
  const badges = useRecordingBadges(graph, recorder.order);
  const insert = useArchInsert(s.api, library.find);
  const drop = paletteDropHandlers(insert.insertAtClient);
  const onSelectScenario = useCallback((index: number) => s.setBook((book) => selectScenario(book, index)), [s.setBook]);
  const togglePause = useCallback(() => s.setPaused((value) => !value), [s.setPaused]);
  useAltPShortcut(togglePause);
  useFitOnFirstLoad(s.api, snapshot.elements.length > 0);
  useLegacyIconMigration(s.api, snapshot.sceneVersion);
  useTextRemeasure(s.api, snapshot.elements.length > 0);

  const onChange = useCallback((elements: readonly OrderedExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
    onSnapshot(elements, appState);
    onSceneChange(drawing.id, elements, appState, files);
    theme.syncFromCanvas(appState.theme);
  }, [drawing.id, onSnapshot, onSceneChange, theme.syncFromCanvas]);

  const categoryOf = useCallback((iconRef: string) => library.find(iconRef)?.category ?? "compute", [library]);
  const target = resolveInspectorTarget(graph, snapshot.elements, snapshot.selectedIds, categoryOf);
  const cardEditing = useCardEditing(s.api);
  const animationExport = useAnimationExport(s.api);
  const openExport = useCallback(() => { animationExport.reset(); s.setExportOpen(true); }, [animationExport.reset, s.setExportOpen]);

  return (
    <div className="app">
      <Toolbar paused={s.paused} onTogglePause={togglePause} player={player.state} dispatchPlayer={player.dispatch}
        scenarioNames={s.book.scenarios.map((item) => item.name)} activeScenario={s.book.active} onSelectScenario={onSelectScenario}
        playSpeed={s.playSpeed} onPlaySpeed={s.setPlaySpeed} recorder={recorder}
        templates={TEMPLATES} onLoadTemplate={onLoadTemplate} theme={theme.theme} onToggleTheme={theme.toggle} onExportAnimation={openExport}
        drawingName={drawingName} onOpenLibrary={onOpenLibrary} account={account} />
      <Palette library={library} onInsert={insert.insertAtCenter} onCreate={modal.openWith} onEdit={modal.openEdit} />
      <main className="stage" onDragOverCapture={drop.onDragOverCapture} onDropCapture={drop.onDropCapture}>
        <Excalidraw excalidrawAPI={s.setApi} initialData={s.initial} onChange={onChange} langCode="pt-BR"
          theme={theme.theme} UIOptions={EXCALIDRAW_UI} showDeprecatedFonts />
        <FlowOverlay flows={graph.flows} viewport={snapshot.viewport} dark={snapshot.dark} paused={s.paused} play={playView} badges={badges} />
      </main>
      <Inspector target={target} {...cardEditing} />
      <NewItemModal mode={modal.mode} categories={library.categories} onClose={modal.close} onCreate={modal.create}
        onSave={modal.save} onDelete={modal.remove} onReset={modal.reset} />
      <ExportAnimationModal open={s.exportOpen} scenarios={s.book.scenarios} activeScenario={s.book.active} theme={theme.theme}
        playSpeed={s.playSpeed} status={animationExport.status} onExport={(request) => void animationExport.start(request)}
        onCancel={animationExport.cancel} onClose={() => s.setExportOpen(false)} />
    </div>
  );
};
