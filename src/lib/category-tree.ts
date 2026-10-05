import type { Category } from "@/lib/api/types";

// Categories are a flat list from the API; a subcategory is just a category
// with a `parentId`. One level deep only — a parent that is itself a
// subcategory (or points at a category that no longer exists) is treated
// as top-level, so a bad row never hides a category entirely.

export function isTopLevel(category: Category, all: Category[]): boolean {
  if (!category.parentId) return true;
  const parent = all.find((c) => c.id === category.parentId);
  return !parent || Boolean(parent.parentId);
}

export function topLevelCategories(all: Category[]): Category[] {
  return all.filter((c) => isTopLevel(c, all));
}

export function subcategoriesOf(all: Category[], parentId: string): Category[] {
  return all.filter((c) => c.parentId === parentId && !isTopLevel(c, all));
}

/** The top-level category a category belongs to (itself if top-level). */
export function rootCategoryOf(category: Category, all: Category[]): Category {
  if (isTopLevel(category, all)) return category;
  return all.find((c) => c.id === category.parentId) ?? category;
}

/**
 * Ids a category filter should match: the category itself plus, for a
 * top-level category, all of its subcategories — so picking "Pantry" also
 * shows products filed under "Pantry › Spices".
 */
export function categoryIdsForFilter(all: Category[], slug: string): Set<string> {
  const selected = all.find((c) => c.slug === slug);
  if (!selected) return new Set();
  const ids = new Set([selected.id]);
  if (isTopLevel(selected, all)) for (const sub of subcategoriesOf(all, selected.id)) ids.add(sub.id);
  return ids;
}

/** "Pantry › Spices" for a subcategory, just "Pantry" for a top-level one. */
export function categoryPath(category: Category, all: Category[]): string {
  const root = rootCategoryOf(category, all);
  return root.id === category.id ? category.name : `${root.name} › ${category.name}`;
}

/** Top-level categories each followed by their subcategories, for lists and selects. */
export function categoriesInTreeOrder(all: Category[]): { category: Category; depth: 0 | 1 }[] {
  return topLevelCategories(all).flatMap((parent) => [
    { category: parent, depth: 0 as const },
    ...subcategoriesOf(all, parent.id).map((child) => ({ category: child, depth: 1 as const })),
  ]);
}
