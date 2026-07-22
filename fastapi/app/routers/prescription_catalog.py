"""
Prescription catalog API — medicines, injections, tests stored in MongoDB.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.middleware.auth import require_any_role, require_doctor_or_admin
from app.models.prescription_catalog import PrescriptionCatalogCreate
from app.services.prescription_catalog_service import PrescriptionCatalogService
from app.utils.response import success_response

router = APIRouter()


def get_service(db: AsyncIOMotorDatabase = Depends(get_db)) -> PrescriptionCatalogService:
    return PrescriptionCatalogService(db)


@router.get("/search")
async def search_catalog(
    q: str = Query("", max_length=200),
    type: Optional[List[str]] = Query(None, alias="type"),
    limit: int = Query(12, ge=1, le=30),
    current_user: dict = Depends(require_any_role),
    service: PrescriptionCatalogService = Depends(get_service),
):
    """Fast char-by-char catalog search (prefix + substring) backed by MongoDB."""
    items = await service.search(query=q, types=type, limit=limit)
    return success_response(
        message="Catalog items retrieved",
        data={"items": items},
    )


@router.post("/", status_code=status.HTTP_201_CREATED)
async def upsert_catalog_item(
    item: PrescriptionCatalogCreate,
    current_user: dict = Depends(require_doctor_or_admin),
    service: PrescriptionCatalogService = Depends(get_service),
):
    """Create or update a catalog entry when a new medicine/test is added."""
    saved = await service.upsert(item, created_by=str(current_user["_id"]))
    return success_response(
        message="Catalog item saved",
        data={"item": saved},
        status_code=status.HTTP_201_CREATED,
    )
