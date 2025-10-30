"""
Email schemas for API requests and responses.
"""

from pydantic import BaseModel, EmailStr, Field


class EmailRecipient(BaseModel):
    """Single email recipient."""

    email: EmailStr
    name: str | None = None


class SendEmailRequest(BaseModel):
    """Request schema for sending email."""

    to: list[EmailStr] = Field(..., min_length=1, description="List of recipient email addresses")
    subject: str = Field(..., min_length=1, max_length=200, description="Email subject")
    body: str = Field(..., min_length=1, description="Email body (plain text)")
    html_body: str | None = Field(None, description="Email body (HTML)")
    cc: list[EmailStr] | None = Field(None, description="CC recipients")
    bcc: list[EmailStr] | None = Field(None, description="BCC recipients")


class EmailResponse(BaseModel):
    """Response schema for email sending."""

    success: bool
    message: str
    recipients: list[str]
    message_id: str | None = None

