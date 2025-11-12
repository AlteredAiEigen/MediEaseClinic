"""
Standardized API response utilities.
"""

from typing import Any, Optional, Dict
from fastapi.responses import JSONResponse


def success_response(
    message: str,
    data: Any = None,
    status_code: int = 200
) -> Dict:
    """
    Create standardized success response.
    
    Args:
        message: Success message
        data: Response data
        status_code: HTTP status code
    
    Returns:
        Standardized response dictionary
    """
    response = {
        "success": True,
        "message": message
    }
    
    if data is not None:
        response["data"] = data
    
    return response


def error_response(
    message: str,
    errors: Optional[Any] = None,
    status_code: int = 400
) -> JSONResponse:
    """
    Create standardized error response.

    Args:
        message: Error message
        errors: Additional error details
        status_code: HTTP status code

    Returns:
        JSON response with error
    """
    response = {
        "success": False,
        "message": message
    }

    if errors:
        response["errors"] = errors

    return JSONResponse(
        status_code=status_code,
        content=response
    )


def error_response_ws(message: str, status_code: int = 1008) -> str:
    """
    Create standardized WebSocket error response.

    Args:
        message: Error message
        status_code: WebSocket close code

    Returns:
        JSON string for WebSocket error
    """
    import json
    response = {
        "success": False,
        "message": message,
        "code": status_code
    }

    return json.dumps(response)


def paginated_response(
    message: str,
    data: list,
    total: int,
    page: int,
    limit: int
) -> Dict:
    """
    Create paginated response.
    
    Args:
        message: Success message
        data: List of items
        total: Total count of items
        page: Current page number
        limit: Items per page
    
    Returns:
        Paginated response with metadata
    """
    total_pages = (total + limit - 1) // limit  # Ceiling division
    
    return {
        "success": True,
        "message": message,
        "data": data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": total_pages,
            "hasNext": page < total_pages,
            "hasPrev": page > 1
        }
    }

