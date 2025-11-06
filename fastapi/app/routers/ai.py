"""
General AI assistant endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.middleware.auth import require_any_role
from app.services.ai_service import ai_service
from app.utils.response import success_response

router = APIRouter()


class AIChatRequest(BaseModel):
    """Request payload for assistant chat."""

    prompt: str = Field(..., min_length=3, max_length=4000)
    context: str | None = Field(
        default=None,
        max_length=6000,
        description="Optional patient/clinical context that should remain private",
    )


@router.post(
    "/assistant",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def ai_assistant_chat(
    payload: AIChatRequest,
    current_user: dict = Depends(require_any_role),
):
    """
    Clinician-facing AI assistant chat endpoint.

    Requires authentication (doctor, receptionist, admin). Returns text response.
    """
    if not ai_service.provider:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured. Please set OPENAI_API_KEY or GEMINI_API_KEY",
        )

    response = await ai_service.chat(
        prompt=payload.prompt,
        context=payload.context,
    )
    return success_response(
        message="AI response generated successfully",
        data={"response": response},
    )


