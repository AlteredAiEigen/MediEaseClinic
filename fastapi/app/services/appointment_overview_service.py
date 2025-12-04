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
            # For day view, restrict to today's date (local concept handled in frontend)
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif period == "week":
            # Calculate start of week (Monday)
            days_since_monday = now.weekday()  # Monday is 0
            start = now - timedelta(days=days_since_monday)
            start = start.replace(hour=0, minute=0, second=0, microsecond=0)
            # End of week is Sunday (6 days after Monday) - include full week including future dates
            end = start + timedelta(days=6)
            end = end.replace(hour=23, minute=59, second=59, microsecond=999999)
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
            # Ensure doctorId is string for comparison
            query["doctorId"] = str(doctor_id)

        # Get appointments
        # Debug: Log the query to help troubleshoot
        import logging
        logger = logging.getLogger(__name__)
        logger.debug(f"Appointment overview query: {query}")
        appointments = await self.appointments.find(query).to_list(length=None)
        logger.debug(f"Found {len(appointments)} appointments for period {period}")

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

        # Group for chart data
        if period == "day":
            # For day view we:
            # - Use HOURLY buckets for statistics (peak/average)
            # - But plot INDIVIDUAL appointment points along a continuous
            #   24-hour axis so the curve reflects exact appointment times.
            #
            # We expect a `time` field like "14:20" or "2:10 pm".
            def _parse_time(time_str: str) -> Optional[tuple[int, int]]:
                if not time_str:
                    return None
                text = time_str.strip().lower()
                period_suffix = None
                if text.endswith("am") or text.endswith("pm"):
                    period_suffix = text[-2:]
                    text = text[:-2].strip()
                parts = text.split(":")
                try:
                    hour = int(parts[0])
                    minute = int(parts[1]) if len(parts) > 1 else 0
                except (ValueError, IndexError):
                    return None
                if period_suffix == "pm" and hour != 12:
                    hour += 12
                if period_suffix == "am" and hour == 12:
                    hour = 0
                if 0 <= hour <= 23 and 0 <= minute <= 59:
                    return hour, minute
                return None

            # Hourly buckets for stats
            hourly_counts: Dict[int, int] = {}
            hour_examples: Dict[int, List[str]] = {}
            # Per-appointment points for the chart (decimal hour + label)
            point_hours: List[float] = []
            point_labels: List[str] = []
            for appointment in appointments:
                time_str = appointment.get("time") or ""
                parsed = _parse_time(time_str)
                if parsed is None:
                    continue
                hour_val, minute_val = parsed

                # Stats: bucket by whole hour
                hourly_counts[hour_val] = hourly_counts.get(hour_val, 0) + 1
                if time_str:
                    hour_examples.setdefault(hour_val, []).append(time_str)

                # Chart point: use decimal hour (e.g., 14.33 for 14:20)
                decimal_hour = hour_val + (minute_val / 60.0)
                point_hours.append(decimal_hour)
                point_labels.append(time_str or f"{hour_val:02d}:{minute_val:02d}")

            # Build fixed clinic-hour window from 08:00–22:00 (inclusive)
            hours_range = list(range(8, 23))

            def _hour_label(hour_val: int) -> str:
                return f"{hour_val:02d}:00"

            chart_data = {
                # `dates` carries each hour label within the clinic window
                "dates": [_hour_label(h) for h in hours_range],
                # `timeLabels` carries comma-separated appointment times per hour
                "timeLabels": [
                    ", ".join(hour_examples.get(h, [])) or _hour_label(h)
                    for h in hours_range
                ],
                "counts": [hourly_counts.get(h, 0) for h in hours_range],
            }

            peak_count = max(hourly_counts.values()) if hourly_counts else 0
            average_count = (
                sum(hourly_counts.values()) / len(hours_range)
                if hours_range
                else 0
            )
        else:
            # Group by date string (YYYY-MM-DD)
            daily_counts: Dict[str, int] = {}
            for appointment in appointments:
                date_str = appointment.get("date")
                if date_str:
                    daily_counts[date_str] = daily_counts.get(date_str, 0) + 1

            # For week period, ensure all 7 days are included (even if 0)
            if period == "week":
                from datetime import datetime as dt
                week_start = dt.strptime(start.strftime("%Y-%m-%d"), "%Y-%m-%d")
                for i in range(7):
                    day_date = week_start + timedelta(days=i)
                    day_str = day_date.strftime("%Y-%m-%d")
                    if day_str not in daily_counts:
                        daily_counts[day_str] = 0

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

