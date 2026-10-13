/**
 * Aviso de mudança só vale para o desenho que o autosave está acompanhando agora.
 * Regressão: ao trocar de desenho, o editor novo avisava os cenários antes do autosave trocar de alvo e eles iam para o anterior.
 * @example belongsToOpenDrawing({ id: "a" }, "b") // false
 */
export const belongsToOpenDrawing = (job: { id: string } | null, drawingId: string): boolean => job !== null && job.id === drawingId;
