import { apiFetch } from "../api";

export type CatalogImportStatus = "PARSING" | "READY" | "COMMITTING" | "DONE" | "FAILED";
export type CatalogItemStatus = "NEW" | "UPDATE" | "ONEC" | "DUPLICATE" | "EXCLUDED";

export interface SectionMapping {
  section: string;
  categoryName: string;
  items: number;
}

export interface CatalogImportJob {
  id: number;
  fileName: string;
  brand: string;
  parentCategoryId?: number | null;
  status: CatalogImportStatus;
  pages: number;
  pagesDone: number;
  pagesWithoutText: number;
  items: number;
  included: number;
  warnings: string[];
  sections: SectionMapping[];
  error?: string | null;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  createdBy?: string | null;
  createdAt: string;
  committedAt?: string | null;
}

export interface CatalogImportItem {
  id: number;
  position: number;
  page: number;
  section?: string | null;
  categoryName: string;
  code: string;
  altCode?: string | null;
  name: string;
  nameTr?: string | null;
  nameEn?: string | null;
  note?: string | null;
  voltage?: string | null;
  untranslated?: string | null;
  imageUrl?: string | null;
  included: boolean;
  duplicateInFile: boolean;
  status: CatalogItemStatus;
  existingProductId?: number | null;
  productId?: number | null;
}

export interface CommitResult {
  created: number;
  updated: number;
  skipped: number;
  categoriesCreated: number;
}

const BASE = "/api/admin/catalog-import/jobs";

export const catalogImportApi = {
  upload: (file: File, brand: string, parentCategoryId?: number | null) => {
    const form = new FormData();
    form.append("file", file);
    form.append("brand", brand);
    if (parentCategoryId) form.append("parentCategoryId", String(parentCategoryId));
    return apiFetch<CatalogImportJob>(BASE, { method: "POST", body: form });
  },
  list: () => apiFetch<CatalogImportJob[]>(BASE),
  get: (id: number) => apiFetch<CatalogImportJob>(`${BASE}/${id}`),
  items: (id: number) => apiFetch<CatalogImportItem[]>(`${BASE}/${id}/items`),
  updateItem: (id: number, itemId: number, patch: { name?: string; code?: string; included?: boolean }) =>
    apiFetch<CatalogImportItem>(`${BASE}/${id}/items/${itemId}`, { method: "PATCH", body: JSON.stringify(patch) }),
  updateSections: (id: number, sections: SectionMapping[]) =>
    apiFetch<CatalogImportJob>(`${BASE}/${id}/sections`, { method: "PUT", body: JSON.stringify(sections) }),
  commit: (id: number) => apiFetch<CommitResult>(`${BASE}/${id}/commit`, { method: "POST" }),
  remove: (id: number) => apiFetch<void>(`${BASE}/${id}`, { method: "DELETE", parseAs: "text" }),
};
