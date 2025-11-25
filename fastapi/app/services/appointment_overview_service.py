"""
Service for calculating appointment overview statistics.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId


class AppointmentOverviewService:
    """Service for appointment overview calculations."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.appointments = db.appointments
        self.reviews = db.patient_reviews

    async def get_appointment_overview(
        self,
        doctor_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        period: str = "week"  # day, week, month, year
    ) -> Dict:
        """Get appointment overview statistics."""
        # Set default date range based on period
        now = datetime.utcnow()
        if period == "day":
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end = now
        elif period == "week":
            start = now - timedelta(days=now.weekday())
            start = start.replace(hour=0, minute=0, second=0, microsecond=0)
            end = now
        elif period == "month":
            start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end = now
        elif period == "year":
            start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            end = now
        else:
            start = start_date or (now - timedelta(days=7))
            end = end_date or now

        # Build query
        query = {
            "date": {
                "$gte": start.strftime("%Y-%m-%d"),
                "$lte": end.strftime("%Y-%m-%d")
            }
        }
        if doctor_id:
            query["doctorId"] = doctor_id

        # Get appointments
        appointments = await self.appointments.find(query).to_list(length=None)

        # Calculate statistics
        total_appointments = len(appointments)
        completed = [a for a in appointments if a.get("status") == "completed"]
        cancelled = [a for a in appointments if a.get("status") == "cancelled"]
        no_shows = [a for a in appointments if a.get("isNoShow", False)]

        # Calculate average consultation time
        consultation_times = [
            a.get("consultationTimeMinutes")
            for a in completed
            if a.get("consultationTimeMinutes")
        ]
        avg_consultation_time = (
            sum(consultation_times) / len(consultation_times)
            if consultation_times
            else 0
        )

        # Calculate no-show rate
        scheduled = [a for a in appointments if a.get("status") in ["scheduled", "cancelled", "completed", "checked-in", "ongoing"]]
        no_show_rate = (
            (len(no_shows) / len(scheduled) * 100) if scheduled else 0
        )

        # Group by date for chart data
        daily_counts: Dict[str, int] = {}
        for appointment in appointments:
            date_str = appointment.get("date")
            if date_str:
                daily_counts[date_str] = daily_counts.get(date_str, 0) + 1

        # Sort dates and get values
        sorted_dates = sorted(daily_counts.keys())
        chart_data = {
            "dates": sorted_dates,
            "counts": [daily_counts[d] for d in sorted_dates]
        }

        # Calculate peak and average
        peak_count = max(daily_counts.values()) if daily_counts else 0
        average_count = (
            sum(daily_counts.values()) / len(daily_counts)
            if daily_counts
            else 0
        )

        return {
            "total": total_appointments,
            "completed": len(completed),
            "cancelled": len(cancelled),
            "noShows": len(no_shows),
            "noShowRate": round(no_show_rate, 1),
            "averageConsultationTime": round(avg_consultation_time, 1),
            "peakCount": peak_count,
            "averageCount": round(average_count, 1),
            "chartData": chart_data,
            "period": period,
            "startDate": start.isoformat(),
            "endDate": end.isoformat(),
        }

    async def get_performance_insights(
        self,
        doctor_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict:
        """Get performance insights for a doctor."""
        # Default to this week
        now = datetime.utcnow()
        start = start_date or (now - timedelta(days=now.weekday()))
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        end = end_date or now

        query = {
            "doctorId": doctor_id,
            "date": {
                "$gte": start.strftime("%Y-%m-%d"),
                "$lte": end.strftime("%Y-%m-%d")
            }
        }

        # Get appointments
        appointments = await self.appointments.find(query).to_list(length=None)
        completed = [a for a in appointments if a.get("status") == "completed"]

        # Calculate average consultation time
        consultation_times = [
            a.get("consultationTimeMinutes")
            for a in completed
            if a.get("consultationTimeMinutes")
        ]
        avg_consultation = (
            sum(consultation_times) / len(consultation_times)
            if consultation_times
            else 0
        )

        # Calculate no-show rate
        scheduled = [a for a in appointments if a.get("status") in ["scheduled", "cancelled", "completed", "checked-in", "ongoing"]]
        no_shows = [a for a in appointments if a.get("isNoShow", False)]
        no_show_rate = (
            (len(no_shows) / len(scheduled) * 100) if scheduled else 0
        )

        # Calculate follow-up rate
        follow_ups = [a for a in completed if a.get("followUpRequired", False)]
        follow_up_rate = (
            (len(follow_ups) / len(completed) * 100) if completed else 0
        )

        # Get patient satisfaction (from reviews)
        review_query = {
            "doctorId": doctor_id,
            "createdAt": {"$gte": start, "$lte": end}
        }
        reviews = await self.reviews.find(review_query).to_list(length=None)
        avg_rating = 0
        if reviews:
            ratings = [r.get("rating", 0) for r in reviews if r.get("rating")]
            avg_rating = sum(ratings) / len(ratings) if ratings else 0

        return {
            "patientSatisfaction": round(avg_rating, 1) if avg_rating > 0 else None,
            "averageConsultationTime": round(avg_consultation, 1),
            "followUpRate": round(follow_up_rate, 1),
            "noShowRate": round(no_show_rate, 1),
        }

