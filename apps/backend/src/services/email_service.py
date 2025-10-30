"""
Email service using smtplib for sending emails.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
from typing import List

from src.config import settings


class EmailService:
    """Service for sending emails using SMTP."""

    def __init__(self):
        """Initialize email service with configuration."""
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
        self.from_name = settings.SMTP_FROM_NAME
        self.use_tls = settings.SMTP_USE_TLS

    def _create_message(
        self,
        to: List[str],
        subject: str,
        body: str,
        html_body: str | None = None,
        cc: List[str] | None = None,
        bcc: List[str] | None = None,
    ) -> MIMEMultipart:
        """Create email message."""
        message = MIMEMultipart("alternative")
        message["From"] = formataddr((self.from_name, self.from_email))
        message["To"] = ", ".join(to)
        message["Subject"] = subject

        if cc:
            message["Cc"] = ", ".join(cc)

        # Attach plain text body
        message.attach(MIMEText(body, "plain", "utf-8"))

        # Attach HTML body if provided
        if html_body:
            message.attach(MIMEText(html_body, "html", "utf-8"))

        return message

    def send_email(
        self,
        to: List[str],
        subject: str,
        body: str,
        html_body: str | None = None,
        cc: List[str] | None = None,
        bcc: List[str] | None = None,
    ) -> tuple[bool, str, str | None]:
        """
        Send email using SMTP.

        Args:
            to: List of recipient email addresses
            subject: Email subject
            body: Plain text email body
            html_body: HTML email body (optional)
            cc: CC recipients (optional)
            bcc: BCC recipients (optional)

        Returns:
            Tuple of (success, message, message_id)
        """
        try:
            # Validate configuration
            if not self.smtp_user or not self.smtp_password:
                return (
                    False,
                    "SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD in environment variables.",
                    None,
                )

            if not self.from_email:
                return (
                    False,
                    "From email not configured. Please set SMTP_FROM_EMAIL in environment variables.",
                    None,
                )

            # Create message
            message = self._create_message(to, subject, body, html_body, cc, bcc)

            # All recipients (including CC and BCC)
            all_recipients = to.copy()
            if cc:
                all_recipients.extend(cc)
            if bcc:
                all_recipients.extend(bcc)

            # Connect to SMTP server and send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls()

                server.login(self.smtp_user, self.smtp_password)
                server.send_message(message)

                message_id = message.get("Message-ID")

                return (
                    True,
                    f"Email sent successfully to {len(all_recipients)} recipient(s)",
                    message_id,
                )

        except smtplib.SMTPAuthenticationError:
            return (
                False,
                "SMTP authentication failed. Please check your credentials.",
                None,
            )
        except smtplib.SMTPException as e:
            return (False, f"SMTP error occurred: {str(e)}", None)
        except Exception as e:
            return (False, f"Failed to send email: {str(e)}", None)


# Global email service instance
email_service = EmailService()

