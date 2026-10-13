import { exportToCanvas } from "@excalidraw/excalidraw";
import type { RawScene } from "./sceneCodec";

const THUMBNAIL_PX = 360;

/**
 * Miniatura clara do desenho (webp pequeno) para a lista "Meus desenhos"; null se a cena estiver vazia.
 * @example meta.thumbnail = await renderThumbnail(scene)
 */
export const renderThumbnail = async (scene: RawScene): Promise<string | null> => {
  const elements = scene.elements.filter((element) => !element.isDeleted);
  if (elements.length === 0) return null;
  const canvas = await exportToCanvas({
    elements,
    files: scene.files,
    maxWidthOrHeight: THUMBNAIL_PX,
    appState: { exportBackground: true, viewBackgroundColor: scene.appState.viewBackgroundColor ?? "#ffffff", exportWithDarkMode: false },
  });
  return canvas.toDataURL("image/webp", 0.8);
};
