"""
Healthcare provider service for fetching clinic/hospital reference data.
Uses the `healthcare_providers` collection.
"""

from typing import Optional, Dict
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError
import logging
from datetime import datetime

from app.models.healthcare_provider import healthcare_provider_helper, HealthcareProviderCreate

logger = logging.getLogger(__name__)


class HealthcareProviderService:
    """Service for handling healthcare provider (clinic/hospital) operations."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.providers_collection = db["healthcare_providers"]

    async def registration_exists(self, registration_number: Optional[str]) -> bool:
        if not registration_number:
            return False
        existing = await self.providers_collection.find_one(
            {"registrationNumber": {"$regex": f"^{registration_number}$", "$options": "i"}}
        )
        return existing is not None

    async def create_provider(self, payload: HealthcareProviderCreate) -> Optional[Dict]:
        """
        Create a new healthcare provider entry.

        Args:
            payload: HealthcareProviderCreate model

        Returns:
            Created provider document as dict, or None if failed
        """
        provider_dict = payload.model_dump()
        now = datetime.utcnow()
        provider_dict["createdAt"] = provider_dict.get("createdAt") or now
        provider_dict["updatedAt"] = provider_dict.get("updatedAt") or now

        try:
            # Prevent duplicate registration number
            if payload.registrationNumber:
                exists = await self.registration_exists(payload.registrationNumber)
                if exists:
                    raise DuplicateKeyError("registrationNumber already exists")

            result = await self.providers_collection.insert_one(provider_dict)
            if result.inserted_id:
                created = await self.providers_collection.find_one({"_id": result.inserted_id})
                return healthcare_provider_helper(created)
        except DuplicateKeyError:
            logger.warning("Healthcare provider with clinicId %s already exists", payload.clinicId)
            raise
        except Exception as e:
            logger.error(f"Failed to create healthcare provider: {e}")
            raise
        return None

    async def list_providers(self, search_query: Optional[str] = None) -> list[Dict]:
        """
        Return all providers, optionally filtered by search query.

        Args:
            search_query: Optional search term to filter by name, city, state, pincode, clinicId, or phone
        """
        query = {}
        if search_query:
            search_term = search_query.strip()
            if search_term:
                query = {
                    "$or": [
                        {"name": {"$regex": search_term, "$options": "i"}},
                        {"city": {"$regex": search_term, "$options": "i"}},
                        {"state": {"$regex": search_term, "$options": "i"}},
                        {"pincode": {"$regex": search_term, "$options": "i"}},
                        {"clinicId": {"$regex": search_term, "$options": "i"}},
                        {"phone": {"$regex": search_term, "$options": "i"}},
                    ]
                }

        cursor = self.providers_collection.find(query).sort("name", 1)
        providers = await cursor.to_list(length=None)
        return [healthcare_provider_helper(c) for c in providers if c]

    async def check_provider_exists(
        self,
        clinic_id: str,
        name: str,
        phone: str,
        city: Optional[str] = None,
        state: Optional[str] = None,
    ) -> bool:
        """
        Check if a provider with similar details already exists.
        Used for uniqueness validation.
        """
        existing_by_id = await self.providers_collection.find_one({"clinicId": clinic_id})
        if existing_by_id:
            return True

        existing_by_details = await self.providers_collection.find_one(
            {"name": {"$regex": f"^{name}$", "$options": "i"}, "phone": phone}
        )
        if existing_by_details:
            return True

        if city and state:
            existing_by_location = await self.providers_collection.find_one(
                {
                    "name": {"$regex": f"^{name}$", "$options": "i"},
                    "city": {"$regex": f"^{city}$", "$options": "i"},
                    "state": {"$regex": f"^{state}$", "$options": "i"},
                }
            )
            if existing_by_location:
                return True

        return False

    async def get_provider_by_id(self, clinic_id: Optional[str]) -> Optional[Dict]:
        """
        Fetch provider information by clinic ID.
        """
        if not clinic_id:
            return None

        try:
            provider = await self.providers_collection.find_one({"clinicId": clinic_id})
            if provider:
                return healthcare_provider_helper(provider)
            return None
        except Exception as e:
            logger.error(f"Error fetching provider {clinic_id}: {e}")
            return None

    async def get_provider_name(self, clinic_id: Optional[str]) -> str:
        """
        Get provider name by clinic ID. Returns default if not found.
        """
        provider = await self.get_provider_by_id(clinic_id)
        if provider:
            return provider.get("name", "MediEase Clinic")
        return "MediEase Clinic"

    async def get_provider_phone(self, clinic_id: Optional[str]) -> Optional[str]:
        """
        Get provider phone number by clinic ID.
        """
        provider = await self.get_provider_by_id(clinic_id)
        if provider:
            return provider.get("phone")
        return None

