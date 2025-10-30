"""
Email sending endpoints.
"""

from fastapi import APIRouter, HTTPException, status

from src.schemas.email import EmailResponse, SendEmailRequest
from src.services.email_service import email_service

router = APIRouter()


@router.post("/send", response_model=EmailResponse)
async def send_email(request: SendEmailRequest) -> EmailResponse:
    """
    Send email using SMTP.

    Sends an email to the specified recipients with optional CC and BCC.
    Supports both plain text and HTML email bodies.

    Environment variables required:
    - SMTP_HOST: SMTP server host (default: smtp.gmail.com)
    - SMTP_PORT: SMTP server port (default: 587)
    - SMTP_USER: SMTP username/email
    - SMTP_PASSWORD: SMTP password (for Gmail, use App Password)
    - SMTP_FROM_EMAIL: From email address (optional, defaults to SMTP_USER)
    - SMTP_FROM_NAME: From name (default: SureSoft AMS)
    - SMTP_USE_TLS: Use TLS (default: true)
    """
    success, message, message_id = email_service.send_email(
        to=request.to,
        subject=request.subject,
        body=request.body,
        html_body=request.html_body,
        cc=request.cc,
        bcc=request.bcc,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=message,
        )

    # Combine all recipients for response
    all_recipients = request.to.copy()
    if request.cc:
        all_recipients.extend(request.cc)
    if request.bcc:
        all_recipients.extend(request.bcc)

    return EmailResponse(
        success=success,
        message=message,
        recipients=all_recipients,
        message_id=message_id,
    )

