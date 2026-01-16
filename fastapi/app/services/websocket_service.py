"""
WebSocket service for real-time updates.
Manages WebSocket connections and broadcasts queue updates.
"""

import json
import logging
from typing import Dict, List, Set
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections and broadcasts messages."""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {
            "queue_updates": set(),
            "doctor_queue": {},  # doctor_id -> set of websockets
        }

    async def connect(self, websocket: WebSocket, channel: str = "queue_updates", doctor_id: str = None):
        """Connect a WebSocket to a channel."""
        await websocket.accept()

        if channel == "doctor_queue" and doctor_id:
            if doctor_id not in self.active_connections["doctor_queue"]:
                self.active_connections["doctor_queue"][doctor_id] = set()
            self.active_connections["doctor_queue"][doctor_id].add(websocket)
            logger.info(f"WebSocket connected to doctor_queue channel for doctor {doctor_id}")
        else:
            self.active_connections[channel].add(websocket)
            logger.info(f"WebSocket connected to {channel} channel")

    def disconnect(self, websocket: WebSocket, channel: str = "queue_updates", doctor_id: str = None):
        """Disconnect a WebSocket from a channel."""
        if channel == "doctor_queue" and doctor_id:
            if doctor_id in self.active_connections["doctor_queue"]:
                self.active_connections["doctor_queue"][doctor_id].discard(websocket)
                if not self.active_connections["doctor_queue"][doctor_id]:
                    del self.active_connections["doctor_queue"][doctor_id]
                logger.info(f"WebSocket disconnected from doctor_queue channel for doctor {doctor_id}")
        else:
            self.active_connections[channel].discard(websocket)
            logger.info(f"WebSocket disconnected from {channel} channel")

    async def broadcast_to_channel(self, message: dict, channel: str = "queue_updates", doctor_id: str = None):
        """Broadcast message to all connections in a channel."""
        try:
            message_data = json.dumps(message, default=str)

            if channel == "doctor_queue" and doctor_id:
                # Send to specific doctor's queue channel
                if doctor_id in self.active_connections["doctor_queue"]:
                    connections = self.active_connections["doctor_queue"][doctor_id]
                    for connection in list(connections):
                        try:
                            await connection.send_text(message_data)
                        except Exception as e:
                            logger.warning(f"Failed to send message to doctor {doctor_id}: {e}")
                            connections.discard(connection)
            else:
                # Send to general channel
                connections = self.active_connections.get(channel, set())
                for connection in list(connections):
                    try:
                        await connection.send_text(message_data)
                    except Exception as e:
                        logger.warning(f"Failed to send message to connection: {e}")
                        connections.discard(connection)

        except Exception as e:
            logger.error(f"Error broadcasting message: {e}")

    async def broadcast_queue_update(self, queue_data: dict, doctor_id: str = None):
        """Broadcast queue update to appropriate channels."""
        message = {
            "type": "queue_update",
            "timestamp": datetime.utcnow().isoformat(),
            "data": queue_data
        }

        # Broadcast to general queue updates channel
        await self.broadcast_to_channel(message, "queue_updates")

        # If doctor_id is provided, also broadcast to doctor's specific channel
        if doctor_id:
            await self.broadcast_to_channel(message, "doctor_queue", doctor_id)


# Global connection manager instance
connection_manager = ConnectionManager()


class WebSocketService:
    """Service for WebSocket operations."""

    def __init__(self):
        self.connection_manager = connection_manager

    async def handle_queue_connection(self, websocket: WebSocket, doctor_id: str = None):
        """Handle WebSocket connection for queue updates."""
        channel = "doctor_queue" if doctor_id else "queue_updates"
        await self.connection_manager.connect(websocket, channel, doctor_id)

        try:
            while True:
                # Keep connection alive and listen for client messages
                data = await websocket.receive_text()
                # For now, we just keep the connection alive
                # In the future, we could handle client commands here
                logger.debug(f"Received message from client: {data}")

        except WebSocketDisconnect:
            self.connection_manager.disconnect(websocket, channel, doctor_id)

    async def broadcast_queue_change(self, change_type: str, queue_data: dict, affected_doctor_ids: List[str] = None):
        """Broadcast queue changes to connected clients."""
        try:
            message = {
                "type": change_type,
                "timestamp": datetime.utcnow().isoformat(),
                "data": queue_data
            }

            # Broadcast to general queue channel
            await self.connection_manager.broadcast_to_channel(message, "queue_updates")

            # Broadcast to specific doctor channels if provided
            if affected_doctor_ids:
                for doctor_id in affected_doctor_ids:
                    await self.connection_manager.broadcast_to_channel(message, "doctor_queue", doctor_id)

            logger.info(f"Broadcasted {change_type} to {len(affected_doctor_ids) if affected_doctor_ids else 'all'} clients")

        except Exception as e:
            logger.error(f"Error broadcasting queue change: {e}")

    async def broadcast_patient_checked_in(self, queue_entry: dict):
        """Broadcast when a patient is checked in."""
        doctor_id = queue_entry.get("doctor", {}).get("_id") if isinstance(queue_entry.get("doctor"), dict) else queue_entry.get("doctor")
        await self.broadcast_queue_change(
            "patient_checked_in",
            {"queue_entry": queue_entry},
            [doctor_id] if doctor_id else None
        )

    async def broadcast_patient_status_updated(self, queue_entry: dict):
        """Broadcast when a patient's queue status is updated."""
        doctor_id = queue_entry.get("doctor", {}).get("_id") if isinstance(queue_entry.get("doctor"), dict) else queue_entry.get("doctor")
        await self.broadcast_queue_change(
            "patient_status_updated",
            {"queue_entry": queue_entry},
            [doctor_id] if doctor_id else None
        )

    async def broadcast_queue_reordered(self, doctor_id: str, updated_queue: list):
        """Broadcast when queue is reordered.
        
        Sends to BOTH the general queue_updates channel (for receptionists)
        AND the doctor-specific channel.
        """
        message = {
            "type": "queue_reordered",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {"doctor_id": doctor_id, "queue": updated_queue}
        }
        
        # Broadcast to general queue_updates channel for receptionists
        await self.connection_manager.broadcast_to_channel(message, "queue_updates")
        
        # Also broadcast to doctor's specific channel
        await self.connection_manager.broadcast_to_channel(message, "doctor_queue", doctor_id)

    async def broadcast_appointment_status_update(self, appointment: dict):
        """Broadcast when appointment status is updated."""
        try:
            message = {
                "type": "appointment_status_updated",
                "timestamp": datetime.utcnow().isoformat(),
                "data": {
                    "appointment": appointment,
                    "appointmentId": str(appointment.get("_id", "")),
                    "status": appointment.get("status"),
                    "doctorId": appointment.get("doctorId")
                }
            }

            # Broadcast to general channel for all clients to receive appointment updates
            await self.connection_manager.broadcast_to_channel(message, "queue_updates")

            # Also broadcast to doctor's specific channel if doctorId is available
            doctor_id = appointment.get("doctorId")
            if doctor_id:
                await self.connection_manager.broadcast_to_channel(message, "doctor_queue", str(doctor_id))

        except Exception as e:
            logger.error(f"Error broadcasting appointment status update: {e}")

    async def broadcast_appointment_created(self, appointment: dict):
        """Broadcast when an appointment is created (scheduled)."""
        try:
            message = {
                "type": "appointment_created",
                "timestamp": datetime.utcnow().isoformat(),
                "data": {
                    "appointment": appointment,
                    "appointmentId": str(appointment.get("_id", "")),
                    "doctorId": appointment.get("doctorId"),
                },
            }

            # Broadcast to general channel for all clients to receive appointment updates
            await self.connection_manager.broadcast_to_channel(message, "queue_updates")

            # Also broadcast to doctor's specific channel if doctorId is available
            doctor_id = appointment.get("doctorId")
            if doctor_id:
                await self.connection_manager.broadcast_to_channel(message, "doctor_queue", str(doctor_id))
        except Exception as e:
            logger.error(f"Error broadcasting appointment created: {e}")

    async def broadcast_whatsapp_message_update(self, message_data: dict, patient_id: str = None):
        """Broadcast when a WhatsApp message is sent or received."""
        try:
            message = {
                "type": "whatsapp_message_update",
                "timestamp": datetime.utcnow().isoformat(),
                "data": {
                    "message": message_data,
                    "patient_id": patient_id,
                },
            }

            # Broadcast to general channel for all clients
            await self.connection_manager.broadcast_to_channel(message, "queue_updates")
            
            logger.info(f"Broadcasted WhatsApp message update for patient {patient_id}")
        except Exception as e:
            logger.error(f"Error broadcasting WhatsApp message update: {e}")
