"""
HIPAA Audit Logging Middleware
Tracks all PHI access and modifications for compliance.
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime
from typing import Callable
import logging
import json
from app.config import settings
from app.database import Database

logger = logging.getLogger(__name__)


class AuditLogMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all API requests for HIPAA compliance.
    Tracks: who accessed what data, when, and what they did.
    """
    
    # PHI-sensitive endpoints that require detailed logging
    PHI_ENDPOINTS = [
        "/api/patients",
        "/api/appointments",
        "/api/prescriptions",
        "/api/recordings",
        "/api/clinical-notes",
    ]
    
    # Methods that modify data (require extra logging)
    WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and log audit trail."""
        
        # Skip health check and docs endpoints
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)
        
        # Extract request metadata
        start_time = datetime.utcnow()
        user_id = None
        user_role = None
        
        # Extract user from JWT token if present
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                # User info will be extracted from token in auth middleware
                user_id = request.state.user_id if hasattr(request.state, "user_id") else None
                user_role = request.state.user_role if hasattr(request.state, "user_role") else None
            except:
                pass
        
        # Check if this is a PHI-sensitive endpoint
        is_phi_endpoint = any(phi_path in request.url.path for phi_path in self.PHI_ENDPOINTS)
        
        # Process the request
        response = await call_next(request)
        
        # Calculate response time
        end_time = datetime.utcnow()
        response_time_ms = (end_time - start_time).total_seconds() * 1000
        
        # Log audit trail for PHI endpoints or write operations
        if is_phi_endpoint or request.method in self.WRITE_METHODS:
            try:
                await self.log_audit_trail(
                    request=request,
                    response=response,
                    user_id=user_id,
                    user_role=user_role,
                    response_time_ms=response_time_ms,
                    timestamp=start_time
                )
            except Exception as e:
                # Silently fail audit logging in test environments or when DB unavailable
                logger.warning(f"Failed to create audit log: {e}")
                pass
        
        return response
    
    async def log_audit_trail(
        self,
        request: Request,
        response: Response,
        user_id: str,
        user_role: str,
        response_time_ms: float,
        timestamp: datetime
    ):
        """
        Create detailed audit log entry in database.
        HIPAA requires: who, what, when, where, and outcome.
        """
        
        if not settings.audit_log_enabled:
            return
        
        try:
            # Extract resource information from URL
            resource_type, resource_id = self._extract_resource_info(request.url.path)
            
            # Create audit log entry
            audit_entry = {
                "timestamp": timestamp,
                "userId": user_id,
                "userRole": user_role,
                "action": request.method,
                "resourceType": resource_type,
                "resourceId": resource_id,
                "endpoint": request.url.path,
                "method": request.method,
                "statusCode": response.status_code,
                "ipAddress": request.client.host if request.client else None,
                "userAgent": request.headers.get("user-agent"),
                "responseTimeMs": response_time_ms,
                "success": 200 <= response.status_code < 400,
                "queryParams": dict(request.query_params) if request.query_params else {},
                "requestId": request.headers.get("X-Request-ID", ""),
            }
            
            # Store in database
            db = Database.get_database()
            await db.audit_logs.insert_one(audit_entry)
            
            # Also log to application logger for immediate visibility
            logger.info(
                f"AUDIT: {request.method} {request.url.path} "
                f"- User: {user_id} ({user_role}) "
                f"- Status: {response.status_code} "
                f"- Time: {response_time_ms:.2f}ms"
            )
            
        except Exception as e:
            # Never fail request due to audit logging issues
            logger.error(f"Failed to create audit log: {e}")
    
    def _extract_resource_info(self, path: str) -> tuple:
        """
        Extract resource type and ID from URL path.
        Examples:
          /api/patients/123 -> ("patient", "123")
          /api/appointments -> ("appointment", None)
        """
        parts = path.strip("/").split("/")
        
        resource_type = None
        resource_id = None
        
        if len(parts) >= 2:
            resource_type = parts[1]  # e.g., "patients", "appointments"
            
        if len(parts) >= 3:
            # Check if third part is an ID (not a sub-resource)
            potential_id = parts[2]
            if not potential_id in ["search", "statistics", "export"]:
                resource_id = potential_id
        
        return resource_type, resource_id


async def get_audit_logs(
    user_id: str = None,
    resource_type: str = None,
    action: str = None,
    start_date: datetime = None,
    end_date: datetime = None,
    limit: int = 100,
    skip: int = 0
):
    """
    Query audit logs for compliance reporting.
    Used by admins to generate HIPAA compliance reports.
    """
    db = Database.get_database()
    
    # Build query filter
    query = {}
    
    if user_id:
        query["userId"] = user_id
    
    if resource_type:
        query["resourceType"] = resource_type
    
    if action:
        query["action"] = action
    
    if start_date or end_date:
        query["timestamp"] = {}
        if start_date:
            query["timestamp"]["$gte"] = start_date
        if end_date:
            query["timestamp"]["$lte"] = end_date
    
    # Query with pagination
    cursor = db.audit_logs.find(query).sort("timestamp", -1).skip(skip).limit(limit)
    logs = await cursor.to_list(length=limit)
    
    # Get total count
    total = await db.audit_logs.count_documents(query)
    
    return {
        "logs": logs,
        "total": total,
        "limit": limit,
        "skip": skip
    }

