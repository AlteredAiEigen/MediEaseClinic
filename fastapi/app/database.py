"""
Database configuration and connection management.
Uses Motor for async MongoDB operations with HIPAA compliance.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
import logging
from app.config import settings

logger = logging.getLogger(__name__)


class Database:
    """MongoDB database connection manager."""
    
    client: Optional[AsyncIOMotorClient] = None
    database: Optional[AsyncIOMotorDatabase] = None
    
    @classmethod
    async def connect_db(cls):
        """
        Establish connection to MongoDB Atlas.
        Called on application startup.
        """
        try:
            logger.info("Connecting to MongoDB Atlas...")
            cls.client = AsyncIOMotorClient(
                settings.mongodb_url,
                maxPoolSize=10,
                minPoolSize=1,
                serverSelectionTimeoutMS=5000,
            )
            cls.database = cls.client[settings.database_name]
            
            # Test the connection
            await cls.client.admin.command('ping')
            logger.info(f"Successfully connected to MongoDB: {settings.database_name}")
            
            # Create indexes for optimal performance
            await cls.create_indexes()
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    @classmethod
    async def close_db(cls):
        """
        Close MongoDB connection.
        Called on application shutdown.
        """
        if cls.client:
            logger.info("Closing MongoDB connection...")
            cls.client.close()
            logger.info("MongoDB connection closed")
    
    @classmethod
    async def create_indexes(cls):
        """
        Create database indexes for performance and uniqueness constraints.
        HIPAA Compliance: Indexes improve query performance for audit trails.
        """
        if cls.database is None:
            return
        
        try:
            # Users collection indexes
            await cls.database.users.create_index("email", unique=True)
            await cls.database.users.create_index("role")
            await cls.database.users.create_index([("firstName", 1), ("lastName", 1)])
            
            # Patients collection indexes
            await cls.database.patients.create_index("patientId", unique=True)
            await cls.database.patients.create_index("email")
            await cls.database.patients.create_index("phone")
            await cls.database.patients.create_index([("firstName", 1), ("lastName", 1)])
            await cls.database.patients.create_index("createdByClinicId")  # For reference queries (patients are universal)
            await cls.database.patients.create_index("presentInClinic")  # For queue management
            
            # Appointments collection indexes
            await cls.database.appointments.create_index("appointmentId", unique=True)
            await cls.database.appointments.create_index("patientId")
            await cls.database.appointments.create_index("doctorId")
            await cls.database.appointments.create_index("date")
            await cls.database.appointments.create_index("status")
            await cls.database.appointments.create_index("clinicId")  # Appointments are clinic-specific
            await cls.database.appointments.create_index([("date", 1), ("time", 1)])  # For schedule queries
            
            # Prescriptions collection indexes
            await cls.database.prescriptions.create_index("prescriptionId", unique=True)
            await cls.database.prescriptions.create_index("patientId")
            await cls.database.prescriptions.create_index("doctorId")
            
            # Recordings collection indexes
            await cls.database.recordings.create_index("recordingId", unique=True)
            await cls.database.recordings.create_index("patientId")
            await cls.database.recordings.create_index("doctorId")
            await cls.database.recordings.create_index("appointmentId")
            await cls.database.recordings.create_index("status")
            await cls.database.recordings.create_index("expiresAt")
            
            # Clinical Notes collection indexes
            await cls.database.clinical_notes.create_index("noteId", unique=True)
            await cls.database.clinical_notes.create_index("patientId")
            await cls.database.clinical_notes.create_index("doctorId")
            await cls.database.clinical_notes.create_index("appointmentId")
            await cls.database.clinical_notes.create_index("status")
            await cls.database.clinical_notes.create_index("actionable")
            
            # Queue collection indexes
            await cls.database.queue.create_index("queue_id", unique=True)
            await cls.database.queue.create_index("patient")
            await cls.database.queue.create_index("doctor")
            await cls.database.queue.create_index("appointment")
            await cls.database.queue.create_index("status")
            await cls.database.queue.create_index("is_active")
            await cls.database.queue.create_index([("checked_in_at", -1)])  # For queue ordering
            
            # Patient Vitals collection indexes
            await cls.database.patient_vitals.create_index("patientId")
            await cls.database.patient_vitals.create_index("recordedBy")
            await cls.database.patient_vitals.create_index([("recordedAt", -1)])  # For chronological queries
            
            # Users collection additional indexes
            await cls.database.users.create_index("clinicId")  # For clinic-based user queries
            await cls.database.users.create_index("isActive")
            await cls.database.users.create_index([("role", 1), ("isActive", 1)])  # For role-based active user queries
            
            # Audit Logs collection indexes (HIPAA Critical)
            await cls.database.audit_logs.create_index("userId")
            await cls.database.audit_logs.create_index("action")
            await cls.database.audit_logs.create_index("resourceType")
            await cls.database.audit_logs.create_index("resourceId")
            await cls.database.audit_logs.create_index("timestamp")
            await cls.database.audit_logs.create_index([("timestamp", -1)])  # For time-based queries
            
            logger.info("Database indexes created successfully")
            
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")
            raise
    
    @classmethod
    def get_database(cls) -> AsyncIOMotorDatabase:
        """Get the database instance."""
        if cls.database is None:
            raise Exception("Database not initialized. Call connect_db() first.")
        return cls.database


# Global database instance (initialized during startup)
db: Optional[AsyncIOMotorDatabase] = None

# Dependency for FastAPI routes
async def get_db() -> AsyncIOMotorDatabase:
    """
    FastAPI dependency to get database instance.
    Usage: db: AsyncIOMotorDatabase = Depends(get_db)
    """
    return Database.get_database()

# Initialize global db instance (called during startup)
def init_db():
    """Initialize global database instance."""
    global db
    db = Database.get_database()
    return db

