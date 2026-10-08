"use server";

import { deleteCollectionItem, reorderCollection, saveCollectionItem, type CollectionKey } from "@/lib/content/collections";

const KEYS: CollectionKey[] = ["services", "portfolio", "products"];
const assertKey = (k: string): CollectionKey => {
  if (!KEYS.includes(k as CollectionKey)) throw new Error("Unknown collection");
  return k as CollectionKey;
};

export async function saveItemAction(collection: string, id: string | null, input: unknown) {
  return saveCollectionItem(assertKey(collection), id, input);
}

export async function deleteItemAction(collection: string, id: string) {
  return deleteCollectionItem(assertKey(collection), id);
}

export async function reorderItemsAction(collection: string, ids: string[]) {
  return reorderCollection(assertKey(collection), Array.isArray(ids) ? ids.filter((x) => typeof x === "string").slice(0, 500) : []);
}
