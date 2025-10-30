"""
Email service using smtplib for sending emails.
"""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr, make_msgid

from src.config import settings


WORKFLOW_TYPE_LABELS = {
    "checkout": "체크아웃",
    "checkin": "체크인",
    "transfer": "양도",
    "maintenance": "유지보수",
    "rental": "대여",
    "return": "반납",
    "disposal": "불용",
}


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
        to: list[str],
        subject: str,
        body: str,
        html_body: str | None = None,
        cc: list[str] | None = None,
        bcc: list[str] | None = None,
    ) -> MIMEMultipart:
        """Create email message."""
        message = MIMEMultipart("alternative")
        message["From"] = formataddr((self.from_name, self.from_email))
        message["To"] = ", ".join(to)
        message["Subject"] = subject
        message["Message-ID"] = make_msgid(domain=self.from_email.split("@")[-1])

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
        to: list[str],
        subject: str,
        body: str,
        html_body: str | None = None,
        cc: list[str] | None = None,
        bcc: list[str] | None = None,
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
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=30) as server:
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

    def send_workflow_notification(
        self,
        workflow_type: str,
        requester_name: str,
        requester_email: str,
        requester_department: str | None,
        asset_name: str,
        asset_tag: str,
        asset_model: str | None,
        reason: str | None,
        manager_emails: list[str],
    ) -> tuple[bool, str, str | None]:
        """
        Send workflow notification email to managers.

        Args:
            workflow_type: Type of workflow (checkout/checkin/transfer/...)
            requester_name: Name of the requester
            requester_email: Email of the requester
            requester_department: Department of the requester
            asset_name: Name of the asset
            asset_tag: Asset tag
            asset_model: Model of the asset
            reason: Reason for the request
            manager_emails: List of manager email addresses

        Returns:
            Tuple of (success, message, message_id)
        """
        workflow_type_value = str(workflow_type)

        if workflow_type_value.startswith("WorkflowType."):
            workflow_type_value = workflow_type_value.split(".", 1)[1]

        workflow_type_key = workflow_type_value.lower()

        workflow_type_ko = WORKFLOW_TYPE_LABELS.get(
            workflow_type_key,
            workflow_type_value.capitalize(),
        )
        
        # Build subject
        subject = f"{requester_name}로부터 {workflow_type_ko} 요청이 발생했습니다"
        
        # Build plain text body
        body_lines = [
            f"새로운 {workflow_type_ko} 요청이 발생했습니다.",
            "",
            "=== 요청자 정보 ===",
            f"이름: {requester_name}",
            f"이메일: {requester_email}",
        ]
        
        if requester_department:
            body_lines.append(f"부서: {requester_department}")
        
        body_lines.extend([
            "",
            "=== 자산 정보 ===",
            f"자산명: {asset_name}",
            f"자산태그: {asset_tag}",
        ])
        
        if asset_model:
            body_lines.append(f"모델: {asset_model}")
        
        body_lines.extend([
            "",
            "=== 요청 정보 ===",
            f"요청 타입: {workflow_type_ko}",
        ])
        
        if reason:
            body_lines.append(f"사유: {reason}")
        else:
            body_lines.append("사유: (미입력)")
        
        body_lines.extend([
            "",
            "자산관리시스템에 로그인하여 요청을 승인 또는 거절해 주세요.",
        ])
        
        body = "\n".join(body_lines)
        
        # Build HTML body
        html_body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4a90e2; color: white; padding: 20px; border-radius: 5px 5px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }}
                .section {{ margin-bottom: 20px; }}
                .section-title {{ font-weight: bold; color: #4a90e2; margin-bottom: 10px; font-size: 16px; }}
                .info-row {{ margin: 5px 0; }}
                .label {{ font-weight: bold; display: inline-block; width: 100px; }}
                .footer {{ margin-top: 20px; padding: 15px; background-color: #f0f0f0; border-radius: 0 0 5px 5px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2 style="margin: 0;">새로운 {workflow_type_ko} 요청</h2>
                </div>
                <div class="content">
                    <p>새로운 {workflow_type_ko} 요청이 발생했습니다. 자산관리시스템에서 확인하여 승인 또는 거절해 주세요.</p>
                    
                    <div class="section">
                        <div class="section-title">📋 요청자 정보</div>
                        <div class="info-row"><span class="label">이름:</span> {requester_name}</div>
                        <div class="info-row"><span class="label">이메일:</span> {requester_email}</div>
                        {f'<div class="info-row"><span class="label">부서:</span> {requester_department}</div>' if requester_department else ''}
                    </div>
                    
                    <div class="section">
                        <div class="section-title">🖥️ 자산 정보</div>
                        <div class="info-row"><span class="label">자산명:</span> {asset_name}</div>
                        <div class="info-row"><span class="label">자산태그:</span> {asset_tag}</div>
                        {f'<div class="info-row"><span class="label">모델:</span> {asset_model}</div>' if asset_model else ''}
                    </div>
                    
                    <div class="section">
                        <div class="section-title">📝 요청 정보</div>
                        <div class="info-row"><span class="label">요청 타입:</span> {workflow_type_ko}</div>
                        <div class="info-row"><span class="label">사유:</span> {reason or '(미입력)'}</div>
                    </div>
                </div>
                <div class="footer">
                    자산관리시스템 자동 발송 이메일입니다.
                </div>
            </div>
        </body>
        </html>
        """
        
        # Send email
        return self.send_email(
            to=manager_emails,
            subject=subject,
            body=body,
            html_body=html_body,
        )

    def send_workflow_decision_notification(
        self,
        requester_email: str,
        requester_name: str,
        workflow_type: str,
        decision: str,
        asset_name: str,
        asset_tag: str,
        asset_model: str | None,
        approver_name: str,
        reason: str | None = None,
        expected_return_date: str | None = None,
        comment: str | None = None,
    ) -> tuple[bool, str, str | None]:
        """Send workflow decision notification (approval/rejection) to requester."""

        workflow_type_value = str(workflow_type)

        if workflow_type_value.startswith("WorkflowType."):
            workflow_type_value = workflow_type_value.split(".", 1)[1]

        workflow_type_key = workflow_type_value.lower()

        workflow_type_ko = WORKFLOW_TYPE_LABELS.get(
            workflow_type_key,
            workflow_type_value.capitalize(),
        )

        decision_key = decision.lower()
        decision_labels = {
            "approved": "승인",
            "rejected": "반려",
            "cancelled": "취소",
        }
        decision_ko = decision_labels.get(decision_key, decision.capitalize())

        subject = f"[{decision_ko}] {workflow_type_ko} 요청이 {decision_ko}되었습니다"

        body_lines = [
            f"{requester_name}님,",
            "",
            f"귀하의 {workflow_type_ko} 요청이 {decision_ko}되었습니다.",
            "",
            "=== 요청 정보 ===",
            f"요청 타입: {workflow_type_ko}",
        ]

        if reason:
            body_lines.append(f"사유: {reason}")
        else:
            body_lines.append("사유: (미입력)")

        if expected_return_date:
            body_lines.append(f"반납 예정일: {expected_return_date}")

        body_lines.extend(
            [
                "",
                "=== 자산 정보 ===",
                f"자산명: {asset_name}",
                f"자산태그: {asset_tag}",
            ]
        )

        if asset_model:
            body_lines.append(f"모델: {asset_model}")

        body_lines.extend(
            [
                "",
                "=== 승인 정보 ===",
                f"승인자: {approver_name}",
            ]
        )

        if comment:
            body_lines.append(f"승인자 메모: {comment}")

        body_lines.extend(
            [
                "",
                "자산관리시스템에서 상세 내용을 확인해 주세요.",
            ]
        )

        body = "\n".join(body_lines)

        html_body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4a90e2; color: white; padding: 20px; border-radius: 5px 5px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }}
                .section {{ margin-bottom: 20px; }}
                .section-title {{ font-weight: bold; color: #4a90e2; margin-bottom: 10px; font-size: 16px; }}
                .info-row {{ margin: 5px 0; }}
                .label {{ font-weight: bold; display: inline-block; width: 110px; }}
                .footer {{ margin-top: 20px; padding: 15px; background-color: #f0f0f0; border-radius: 0 0 5px 5px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2 style="margin: 0;">{workflow_type_ko} 요청 {decision_ko} 안내</h2>
                </div>
                <div class="content">
                    <p>{requester_name}님, 귀하의 {workflow_type_ko} 요청이 {decision_ko}되었습니다.</p>

                    <div class="section">
                        <div class="section-title">📝 요청 정보</div>
                        <div class="info-row"><span class="label">요청 타입:</span> {workflow_type_ko}</div>
                        <div class="info-row"><span class="label">사유:</span> {reason or '(미입력)'} </div>
                        {f'<div class="info-row"><span class="label">반납 예정일:</span> {expected_return_date}</div>' if expected_return_date else ''}
                    </div>

                    <div class="section">
                        <div class="section-title">🖥️ 자산 정보</div>
                        <div class="info-row"><span class="label">자산명:</span> {asset_name}</div>
                        <div class="info-row"><span class="label">자산태그:</span> {asset_tag}</div>
                        {f'<div class="info-row"><span class="label">모델:</span> {asset_model}</div>' if asset_model else ''}
                    </div>

                    <div class="section">
                        <div class="section-title">✅ 승인 정보</div>
                        <div class="info-row"><span class="label">승인자:</span> {approver_name}</div>
                        {f'<div class="info-row"><span class="label">승인자 메모:</span> {comment}</div>' if comment else ''}
                    </div>
                </div>
                <div class="footer">
                    자산관리시스템 자동 발송 이메일입니다.
                </div>
            </div>
        </body>
        </html>
        """

        return self.send_email(
            to=[requester_email],
            subject=subject,
            body=body,
            html_body=html_body,
        )


# Global email service instance
email_service = EmailService()

