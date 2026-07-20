import { create } from "zustand";
import type { Audience, Confidentiality } from "@domain/compiler/types";
import type { CompilationMode } from "@domain/screenplay/types";

export type InspectorTab = "provenance" | "quality" | "impact";

interface ChamberState {
  profileId: string;
  audience: Audience;
  confidentiality: Confidentiality;
  screenplayMode: CompilationMode;
  includeProvenance: boolean;
  selectedSectionId?: string;
  inspectorTab: InspectorTab;
  outlineOpen: boolean;
  inspectorOpen: boolean;
  controlsOpen: boolean;
  densePreview: boolean;
  setProfile: (profileId: string) => void;
  setAudience: (audience: Audience) => void;
  setConfidentiality: (confidentiality: Confidentiality) => void;
  setScreenplayMode: (mode: CompilationMode) => void;
  toggleProvenance: () => void;
  selectSection: (sectionId: string) => void;
  setInspectorTab: (tab: InspectorTab) => void;
  toggleOutline: () => void;
  toggleInspector: () => void;
  toggleControls: () => void;
  toggleDensePreview: () => void;
}

export const useChamberState = create<ChamberState>((set) => ({
  profileId: "studio-review-package",
  audience: "producer",
  confidentiality: "external",
  screenplayMode: "submission",
  includeProvenance: false,
  inspectorTab: "provenance",
  outlineOpen: true,
  inspectorOpen: true,
  controlsOpen: true,
  densePreview: false,
  setProfile: (profileId) => set({ profileId, selectedSectionId: undefined }),
  setAudience: (audience) => set({ audience }),
  setConfidentiality: (confidentiality) => set({ confidentiality }),
  setScreenplayMode: (screenplayMode) => set({ screenplayMode }),
  toggleProvenance: () =>
    set((state) => ({ includeProvenance: !state.includeProvenance })),
  selectSection: (selectedSectionId) => set({ selectedSectionId }),
  setInspectorTab: (inspectorTab) => set({ inspectorTab }),
  toggleOutline: () => set((state) => ({ outlineOpen: !state.outlineOpen })),
  toggleInspector: () => set((state) => ({ inspectorOpen: !state.inspectorOpen })),
  toggleControls: () => set((state) => ({ controlsOpen: !state.controlsOpen })),
  toggleDensePreview: () => set((state) => ({ densePreview: !state.densePreview })),
}));
