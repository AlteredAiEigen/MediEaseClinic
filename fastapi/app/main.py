"""
MediEaseClinic FastAPI Application
HIPAA-compliant healthcare management system.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import time

from app.config import settings
from app.database import Database, init_db
from app.middleware.audit_log import AuditLogMiddleware
from app.services.queue_service import QueueService
from app.services.appointment_notification_service import AppointmentNotificationScheduler

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.audit_log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Environment: {settings.environment}")
    
    notification_scheduler = None

    try:

        # Connect to MongoDB
        await Database.connect_db()
        logger.info("Database connection established")

        # Initialize global database instance
        init_db()
        logger.info("Global database instance initialized")

        # Cleanup stale queue entries and old checked-in appointments
        try:
            db = Database.get_database()
            queue_service = QueueService(db)
            await queue_service.cleanup_all_stale_entries()
            logger.info("Startup cleanup completed successfully")

            notification_scheduler = AppointmentNotificationScheduler(db)
            await notification_scheduler.start()
        except Exception as cleanup_error:
            logger.error(f"Startup cleanup failed: {cleanup_error}")
        
        yield
        
    finally:
        # Shutdown
        logger.info("Shutting down application...")
        try:
            if notification_scheduler:
                await notification_scheduler.stop()
        except Exception as scheduler_error:
            logger.error("Failed to stop notification scheduler: %s", scheduler_error)
        await Database.close_db()
        logger.info("Application shutdown complete")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="HIPAA-compliant Healthcare Management System API",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan
)

# CORS Configuration
# Note: CORS middleware must be added before other middleware to handle preflight and redirects
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Add HIPAA Audit Logging Middleware
app.add_middleware(AuditLogMiddleware)


# Request ID middleware for tracking
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add unique request ID to each request for tracking."""
    request_id = f"{int(time.time() * 1000)}-{id(request)}"
    request.state.request_id = request_id
    
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Handle unexpected exceptions gracefully.
    HIPAA Compliance: Don't expose sensitive error details to clients.
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "An internal server error occurred",
            "requestId": getattr(request.state, "request_id", None)
        }
    )


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint for monitoring.
    Returns application status and version.
    """
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "timestamp": time.time()
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "docs": "/docs" if settings.debug else "Documentation disabled in production",
        "health": "/health"
    }


# Import and register routers
from app.routers import (
    auth,
    ai,
    patients,
    patient_vitals,
    appointments,
    prescriptions,
    recordings,
    clinical_notes,
    queue,
    doctors,
    receptionists,
    admin,
    lab_reports,
    messages,
    websocket,
    whatsapp,
    patient_insurances,
    insurance_coverage,
    patient_reviews,
    patient_medical_history,
    mailgun,
    s3_reports,
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI Assistant"])
app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])
app.include_router(patient_vitals.router, prefix="/api/patient-vitals", tags=["Patient Vitals"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["Appointments"])
app.include_router(prescriptions.router, prefix="/api/prescriptions", tags=["Prescriptions"])
app.include_router(recordings.router, prefix="/api/recordings", tags=["Recordings"])
app.include_router(clinical_notes.router, prefix="/api/clinical-notes", tags=["Clinical Notes"])
app.include_router(queue.router, prefix="/api/queue", tags=["Queue"])
app.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])
app.include_router(doctors.router, prefix="/api/doctors", tags=["Doctors"])
app.include_router(receptionists.router, prefix="/api/receptionists", tags=["Receptionists"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(lab_reports.router, prefix="/api/lab-reports", tags=["Lab Reports"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])
app.include_router(whatsapp.router, prefix="/api/whatsapp", tags=["WhatsApp"])
app.include_router(
    patient_insurances.router,
    prefix="/api/patient-insurances",
    tags=["Patient Insurance"],
)
app.include_router(
    insurance_coverage.router,
    prefix="/api/insurance-coverage",
    tags=["Insurance Coverage"],
)
app.include_router(
    patient_reviews.router,
    prefix="/api/patient-reviews",
    tags=["Patient Reviews"],
)
app.include_router(
    patient_medical_history.router,
    prefix="/api/patient-medical-history",
    tags=["Patient Medical History"],
)
app.include_router(mailgun.router, tags=["Mailgun"])
app.include_router(s3_reports.router, prefix="/api/s3-reports", tags=["S3 Reports"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )

