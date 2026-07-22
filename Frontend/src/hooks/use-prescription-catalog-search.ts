import { useEffect, useRef, useState } from "react";
import { searchPrescriptionCatalogApi } from "@/lib/prescription-catalog-api";
import type { PrescriptionCatalogItem } from "@/lib/prescription-catalog";

export function usePrescriptionCatalogSearch(
  query: string,
  options?: { types?: string[]; limit?: number; enabled?: boolean },
) {
  const [items, setItems] = useState<PrescriptionCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    if (options?.enabled === false) {
      setItems([]);
      return;
    }

    const currentId = ++requestId.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchPrescriptionCatalogApi(query, {
          types: options?.types,
          limit: options?.limit ?? 12,
        });
        if (requestId.current === currentId) {
          setItems(results);
        }
      } catch {
        if (requestId.current === currentId) {
          setItems([]);
        }
      } finally {
        if (requestId.current === currentId) {
          setLoading(false);
        }
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query, options?.types?.join(","), options?.limit, options?.enabled]);

  return { items, loading };
}
