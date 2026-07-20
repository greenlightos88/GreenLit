import { create } from "zustand";

export interface TranscriptEntry {
  id: number;
  role: "user" | "assistant";
  text: string;
  /** Interface action performed for this reply, when one was. */
  action?: string;
}

interface AssistantState {
  open: boolean;
  speakReplies: boolean;
  entries: TranscriptEntry[];
  setOpen: (open: boolean) => void;
  toggleSpeakReplies: () => void;
  addEntry: (entry: Omit<TranscriptEntry, "id">) => void;
  clearTranscript: () => void;
}

let entryCounter = 0;

export const useAssistantState = create<AssistantState>((set) => ({
  open: false,
  speakReplies: false,
  entries: [
    {
      id: 0,
      role: "assistant",
      text: "I operate GreenlightOS for you — navigation, compilation, exports, readiness. Canon never changes without your review.",
    },
  ],
  setOpen: (open) => set({ open }),
  toggleSpeakReplies: () => set((state) => ({ speakReplies: !state.speakReplies })),
  addEntry: (entry) =>
    set((state) => {
      entryCounter += 1;
      return { entries: [...state.entries, { ...entry, id: entryCounter }] };
    }),
  clearTranscript: () =>
    set({
      entries: [
        {
          id: 0,
          role: "assistant",
          text: "Transcript cleared. What should we do next?",
        },
      ],
    }),
}));
