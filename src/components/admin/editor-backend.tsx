"use client";

import { createContext, useContext, type ComponentType } from "react";
import { deleteItemAction, saveItemAction } from "@/actions/content";
import { GalleryEditor, MediaField } from "@/components/admin/media";
import type { GalleryImage } from "@/types/content";

export type EditorResult = { ok: true; message?: string; data?: { id: string } } | { ok: false; error: string; fieldErrors?: Record<string, string> };
export type EditorCollection = "services" | "portfolio" | "products";

export interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
}
export interface GalleryFieldProps {
  label: string;
  value: GalleryImage[];
  onChange: (v: GalleryImage[]) => void;
}

/**
 * Where collection editors save to. The default is the Supabase CMS (Server Actions + media
 * library). The Git-backed admin provides its own backend that commits JSON files to GitHub.
 */
export interface EditorBackend {
  save: (collection: EditorCollection, id: string | null, value: unknown, expectedUpdatedAt: string | null) => Promise<EditorResult>;
  remove: (collection: EditorCollection, id: string) => Promise<EditorResult>;
  ImageField: ComponentType<ImageFieldProps>;
  GalleryField: ComponentType<GalleryFieldProps>;
  /** Draft preview through Next.js draft mode (Supabase only). */
  previewEnabled: boolean;
  /** Shown under the save button, e.g. "Changes go live after the next deployment". */
  publishNote?: string;
}

export const supabaseBackend: EditorBackend = {
  save: (collection, id, value) => saveItemAction(collection, id, value) as Promise<EditorResult>,
  remove: (collection, id) => deleteItemAction(collection, id) as Promise<EditorResult>,
  ImageField: MediaField,
  GalleryField: GalleryEditor,
  previewEnabled: true,
};

const Ctx = createContext<EditorBackend>(supabaseBackend);

export function EditorBackendProvider({ backend, children }: { backend: EditorBackend; children: React.ReactNode }) {
  return <Ctx.Provider value={backend}>{children}</Ctx.Provider>;
}

export function useEditorBackend(): EditorBackend {
  return useContext(Ctx);
}
