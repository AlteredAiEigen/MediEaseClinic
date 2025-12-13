"""
General AI assistant endpoints.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.middleware.auth import require_any_role
from app.services.ai_service import ai_service
from app.utils.response import success_response

router = APIRouter()


class AIChatRequest(BaseModel):
    """Request payload for assistant chat."""

    prompt: str = Field(..., min_length=3, max_length=4000)
    context: Optional[str] = Field(
        default=None,
        max_length=6000,
        description="Optional patient/clinical context that should remain private",
    )


@router.post("/chat")
async def chat_with_assistant(request: AIChatRequest, user=Depends(require_any_role)):
    """Chat with AI assistant for clinical queries."""
    try:
        response = await ai_service.chat(request.prompt, request.context)
        return success_response(data={"response": response})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
