"""
MongoDB-backed prescription catalog with in-memory search cache.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import List, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.prescription_catalog import (
    PrescriptionCatalogCreate,
    category_for_type,
    prescription_catalog_helper,
)
from app.utils.cache import cache, invalidate_cache


class PrescriptionCatalogService:
    CACHE_PREFIX = "prescription_catalog"

    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.prescription_catalog

    @staticmethod
    def _normalize(value: str) -> str:
        return re.sub(r"\s+", " ", (value or "").strip().lower())

    def _cache_key(self, query: str, types: Optional[List[str]], limit: int) -> str:
        type_key = ",".join(sorted(t.upper() for t in types)) if types else "*"
        return f"{self.CACHE_PREFIX}:{type_key}:{self._normalize(query)}:{limit}"

    async def search(
        self,
        query: str = "",
        types: Optional[List[str]] = None,
        limit: int = 12,
    ) -> List[dict]:
        limit = max(1, min(limit, 30))
        cache_key = self._cache_key(query, types, limit)
        cached = await cache.get(cache_key)
        if cached is not None:
            return cached

        mongo_filter: dict = {}
        if types:
            mongo_filter["type"] = {"$in": [t.upper() for t in types]}

        q = self._normalize(query)
        if q:
            escaped = re.escape(q)
            mongo_filter["$or"] = [
                {"nameLower": {"$regex": f"^{escaped}"}},
                {"nameLower": {"$regex": escaped}},
                {"compositionLower": {"$regex": escaped}},
            ]

        cursor = (
            self.collection.find(mongo_filter)
            .sort([("useCount", -1), ("nameLower", 1)])
            .limit(limit)
        )
        results = [await prescription_catalog_helper(doc) async for doc in cursor]
        await cache.set(cache_key, results, ttl_seconds=30)
        return results

    async def upsert(
        self,
        item: PrescriptionCatalogCreate,
        created_by: Optional[str] = None,
        increment_use: bool = False,
    ) -> dict:
        name = item.name.strip()
        item_type = item.type.upper()
        name_lower = self._normalize(name)
        composition = (item.composition or "").strip()
        now = datetime.utcnow()

        existing = await self.collection.find_one(
            {"nameLower": name_lower, "type": item_type}
        )

        update_doc = {
            "name": name,
            "nameLower": name_lower,
            "type": item_type,
            "category": category_for_type(item_type),
            "composition": composition or None,
            "compositionLower": self._normalize(composition),
            "dosage": (item.dosage or "").strip() or None,
            "frequency": (item.frequency or "").strip() or None,
            "duration": (item.duration or "").strip() or None,
            "updatedAt": now,
        }

        if existing:
            inc = {"useCount": 1} if increment_use else {}
            await self.collection.update_one(
                {"_id": existing["_id"]},
                {"$set": update_doc, **({"$inc": inc} if inc else {})},
            )
            doc = await self.collection.find_one({"_id": existing["_id"]})
        else:
            doc = {
                **update_doc,
                "useCount": 1 if increment_use else 0,
                "createdBy": created_by,
                "createdAt": now,
            }
            result = await self.collection.insert_one(doc)
            doc = await self.collection.find_one({"_id": result.inserted_id})

        await invalidate_cache([self.CACHE_PREFIX])
        return await prescription_catalog_helper(doc)

    async def upsert_many_from_prescription(
        self,
        medicines: list,
        created_by: Optional[str] = None,
    ) -> None:
        for med in medicines:
            name = (med.get("name") if isinstance(med, dict) else getattr(med, "name", "")) or ""
            if not name.strip():
                continue
            item_type = (
                (med.get("type") if isinstance(med, dict) else getattr(med, "type", None))
                or "TAB"
            )
            composition = (
                med.get("composition") if isinstance(med, dict) else getattr(med, "composition", None)
            ) or ""
            await self.upsert(
                PrescriptionCatalogCreate(
                    name=name.strip(),
                    type=item_type,
                    composition=composition or None,
                ),
                created_by=created_by,
                increment_use=True,
            )
