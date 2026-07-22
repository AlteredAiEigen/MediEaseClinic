import { get, post } from "@/lib/api-client";
import type { PrescriptionCatalogItem, PrescriptionCatalogType } from "@/lib/prescription-catalog";

type SearchResponse = { items: PrescriptionCatalogItem[] };
type UpsertResponse = { item: PrescriptionCatalogItem };

export async function searchPrescriptionCatalogApi(
  query: string,
  options?: { types?: string[]; limit?: number },
): Promise<PrescriptionCatalogItem[]> {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (options?.limit) params.set("limit", String(options.limit));
  options?.types?.forEach((t) => params.append("type", t));

  const qs = params.toString();
  const response = await get<SearchResponse>(
    `/api/prescription-catalog/search${qs ? `?${qs}` : ""}`,
  );
  if (!response.success || !response.data?.items) return [];
  return response.data.items;
}

export async function upsertPrescriptionCatalogItem(item: {
  name: string;
  type: PrescriptionCatalogType;
  composition?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
}): Promise<PrescriptionCatalogItem | null> {
  const response = await post<UpsertResponse>("/api/prescription-catalog", item);
  if (!response.success || !response.data?.item) return null;
  return response.data.item;
}
