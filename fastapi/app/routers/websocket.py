"""
WebSocket router for real-time updates.
"""

from fastapi import APIRouter, WebSocket, Depends, Query
from app.services.websocket_service import WebSocketService
from app.middleware.auth import get_current_user_ws
from app.utils.response import error_response_ws

router = APIRouter()


@router.websocket("/queue")
async def queue_websocket(
    websocket: WebSocket,
    token: str = Query(..., description="JWT token for authentication")
):
    """WebSocket endpoint for general queue updates."""
    try:
        # Authenticate user
        current_user = await get_current_user_ws(token)
        if not current_user:
            await websocket.close(code=1008, reason="Authentication failed")
            return

        websocket_service = WebSocketService()
        await websocket_service.handle_queue_connection(websocket)

    except Exception as e:
        await websocket.close(code=1011, reason="Internal server error")
        return


@router.websocket("/queue/doctor/{doctor_id}")
async def doctor_queue_websocket(
    websocket: WebSocket,
    doctor_id: str,
    token: str = Query(..., description="JWT token for authentication")
):
    """WebSocket endpoint for doctor-specific queue updates."""
    try:
        # Authenticate user
        current_user = await get_current_user_ws(token)
        if not current_user:
            await websocket.close(code=1008, reason="Authentication failed")
            return

        # Verify user has access to this doctor's queue
        # Doctors can only access their own queue, admins/receptionists can access any
        user_role = current_user.get("role")
        user_id = current_user.get("_id")

        if user_role == "doctor" and str(user_id) != doctor_id:
            await websocket.close(code=1008, reason="Access denied")
            return

        websocket_service = WebSocketService()
        await websocket_service.handle_queue_connection(websocket, doctor_id)

    except Exception as e:
        await websocket.close(code=1011, reason="Internal server error")
        return
