"""
Service layer for patient review management.
"""

from datetime import datetime
from typing import List, Optional, Dict
from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.patient_review import (
    PatientReviewCreate,
    PatientReviewUpdate,
    patient_review_helper,
)


class PatientReviewService:
    """Business logic for patient reviews."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.reviews = db.patient_reviews
        self.appointments = db.appointments
        self.patients = db.patients
        self.users = db.users

    async def _verify_appointment(self, appointment_id: str, patient_id: str) -> dict:
        """Verify appointment exists and belongs to patient."""
        if not ObjectId.is_valid(appointment_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid appointment ID",
            )
        appointment = await self.appointments.find_one({"_id": ObjectId(appointment_id)})
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found",
            )
        if str(appointment.get("patientId")) != patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Appointment does not belong to this patient",
            )
        return appointment

    async def create_review(self, review_data: PatientReviewCreate) -> dict:
        """Create a new patient review."""
        # Verify appointment
        appointment = await self._verify_appointment(
            review_data.appointmentId, review_data.patientId
        )

        # Check if review already exists for this appointment
        existing = await self.reviews.find_one({"appointmentId": review_data.appointmentId})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Review already exists for this appointment",
            )

        # Get doctor ID from appointment if not provided
        doctor_id = review_data.doctorId or str(appointment.get("doctorId"))

        payload = review_data.model_dump(exclude_none=True)
        payload["doctorId"] = doctor_id
        payload["createdAt"] = datetime.utcnow()
        payload["updatedAt"] = datetime.utcnow()

        result = await self.reviews.insert_one(payload)
        created = await self.reviews.find_one({"_id": result.inserted_id})
        return patient_review_helper(created)

    async def get_review(self, review_id: str) -> Optional[dict]:
        """Get a review by ID."""
        if not ObjectId.is_valid(review_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid review ID",
            )
        review = await self.reviews.find_one({"_id": ObjectId(review_id)})
        if not review:
            return None
        return patient_review_helper(review)

    async def list_reviews(
        self,
        doctor_id: Optional[str] = None,
        patient_id: Optional[str] = None,
        appointment_id: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ) -> tuple[List[dict], int]:
        """List reviews with optional filters."""
        query = {}
        if doctor_id:
            query["doctorId"] = doctor_id
        if patient_id:
            query["patientId"] = patient_id
        if appointment_id:
            query["appointmentId"] = appointment_id

        skip = (page - 1) * limit
        total = await self.reviews.count_documents(query)
        cursor = (
            self.reviews.find(query)
            .sort("createdAt", -1)
            .skip(skip)
            .limit(limit)
        )
        reviews = await cursor.to_list(length=limit)
        return [patient_review_helper(r) for r in reviews], total

    async def update_review(
        self, review_id: str, update_data: PatientReviewUpdate
    ) -> dict:
        """Update a review."""
        if not ObjectId.is_valid(review_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid review ID",
            )

        review = await self.reviews.find_one({"_id": ObjectId(review_id)})
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found",
            )

        update_dict = update_data.model_dump(exclude_unset=True, exclude_none=True)
        update_dict["updatedAt"] = datetime.utcnow()

        await self.reviews.update_one(
            {"_id": ObjectId(review_id)}, {"$set": update_dict}
        )

        updated = await self.reviews.find_one({"_id": ObjectId(review_id)})
        return patient_review_helper(updated)

    async def delete_review(self, review_id: str):
        """Delete a review."""
        if not ObjectId.is_valid(review_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid review ID",
            )
        result = await self.reviews.delete_one({"_id": ObjectId(review_id)})
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found",
            )

    async def get_doctor_rating_stats(self, doctor_id: str) -> Dict:
        """Get rating statistics for a doctor."""
        pipeline = [
            {"$match": {"doctorId": doctor_id}},
            {
                "$group": {
                    "_id": None,
                    "averageRating": {"$avg": "$rating"},
                    "totalReviews": {"$sum": 1},
                    "ratingDistribution": {
                        "$push": "$rating"
                    }
                }
            }
        ]

        result = await self.reviews.aggregate(pipeline).to_list(length=1)
        if not result:
            return {
                "averageRating": 0,
                "totalReviews": 0,
                "ratingDistribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            }

        stats = result[0]
        rating_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for rating in stats.get("ratingDistribution", []):
            if 1 <= rating <= 5:
                rating_dist[rating] = rating_dist.get(rating, 0) + 1

        return {
            "averageRating": round(stats.get("averageRating", 0), 1),
            "totalReviews": stats.get("totalReviews", 0),
            "ratingDistribution": rating_dist
        }

