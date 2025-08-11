#!/usr/bin/env python3
"""
Standalone email test script for Jonas Browser automation.
This script tests only the email functionality without playwright dependencies.
"""

import os
import pandas as pd
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from typing import List

def send_email_with_attachment(recipient_email: str, files: List[str], report_type: str):
    """
    Send email with downloaded report files as attachments.
    
    Args:
        recipient_email: Email address to send to
        files: List of file paths to attach
        report_type: Type of report (Vendor or Account)
    """
    # Email configuration - PLEASE UPDATE THESE SETTINGS
    smtp_server = "smtp.gmail.com"  # Change this to your SMTP server
    smtp_port = 587
    sender_email = "UPDATE_WITH_YOUR_EMAIL@gmail.com"  # Change this to your email
    sender_password = "UPDATE_WITH_YOUR_APP_PASSWORD"  # Use app password for Gmail
    
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = f"Jonas Premier {report_type} Report"
        
        # Email body
        if len(files) == 1:
            body = f"""
Hello,

Please find the attached {report_type} report from Jonas Premier.

Report generated on: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}

Best regards,
Jonas Automation System
"""
        else:
            body = f"""
Hello,

Please find the attached {report_type} reports from Jonas Premier.

Number of files: {len(files)}
Report generated on: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}

Files included:
"""
            for i, file_path in enumerate(files, 1):
                filename = os.path.basename(file_path)
                body += f"  {i}. {filename}\n"
            
            body += "\nBest regards,\nJonas Automation System"
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Attach files
        for file_path in files:
            if os.path.exists(file_path):
                filename = os.path.basename(file_path)
                
                with open(file_path, "rb") as attachment:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment.read())
                
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {filename}',
                )
                msg.attach(part)
                print(f"  SUCCESS: Attached: {filename}")
            else:
                print(f"  ERROR: File not found: {file_path}")
        
        # Send email
        print(f"Connecting to SMTP server...")
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        
        text = msg.as_string()
        server.sendmail(sender_email, recipient_email, text)
        server.quit()
        
        print(f"SUCCESS: Email sent successfully to {recipient_email}")
        return True
        
    except Exception as e:
        print(f"ERROR: Failed to send email: {e}")
        print("Please check your email configuration in the send_email_with_attachment function")
        return False

def main():
    print("=== Jonas Email Test (Standalone) ===")
    
    # Ask user who to email the report to
    print("Who do you want to email the test report to?")
    print("1. tliang@aspenpower.com")
    print("2. mkajoshaj@aspenpower.com")
    
    email_options = {
        '1': 'tliang@aspenpower.com',
        '2': 'mkajoshaj@aspenpower.com'
    }
    
    while True:
        email_choice = input("Enter your choice (1 or 2): ").strip()
        if email_choice in email_options:
            recipient_email = email_options[email_choice]
            print(f"Selected email: {recipient_email}")
            break
        print("Invalid choice. Please enter 1 or 2.")
    
    # List available test files
    output_dir = "output"
    if not os.path.exists(output_dir):
        print(f"Output directory '{output_dir}' not found!")
        return
    
    files = [f for f in os.listdir(output_dir) if f.endswith(('.html', '.xlsx'))]
    
    if not files:
        print("No test files found in output directory!")
        return
    
    print(f"\nAvailable test files:")
    for i, file in enumerate(files, 1):
        file_path = os.path.join(output_dir, file)
        file_size = os.path.getsize(file_path)
        print(f"  {i}. {file} ({file_size:,} bytes)")
    
    # Let user choose file or use default
    print(f"\nUsing vendor_output.html for test...")
    test_file = os.path.join(output_dir, "vendor_output.html")
    
    if not os.path.exists(test_file):
        # Use first available file
        test_file = os.path.join(output_dir, files[0])
        print(f"vendor_output.html not found, using {files[0]} instead")
    
    print(f"Test file: {test_file}")
    print(f"File exists: {os.path.exists(test_file)}")
    
    if os.path.exists(test_file):
        file_size = os.path.getsize(test_file)
        print(f"File size: {file_size:,} bytes ({file_size/1024/1024:.1f} MB)")
        
        print(f"\n=== Email Configuration Required ===")
        print("IMPORTANT: You need to update the email settings in this script:")
        print(f"  Line 32: sender_email = \"YOUR_EMAIL@gmail.com\"")
        print(f"  Line 33: sender_password = \"YOUR_APP_PASSWORD\"")
        print("\nFor Gmail users:")
        print("  1. Enable 2-factor authentication")
        print("  2. Go to Google Account settings > Security > App passwords")
        print("  3. Generate an App Password for 'Mail'")
        print("  4. Use the 16-character App Password (not your regular password)")
        print("\nFor other email providers:")
        print("  - Outlook: smtp-mail.outlook.com, port 587")
        print("  - Yahoo: smtp.mail.yahoo.com, port 587")
        
        proceed = input("\nHave you updated the email configuration in this script? (y/n): ").strip().lower()
        if proceed != 'y':
            print("\nPlease edit this script and update lines 32-33 with your email credentials.")
            return
        
        # Send test email
        print(f"\n=== Sending Test Email ===")
        print(f"To: {recipient_email}")
        print(f"File: {os.path.basename(test_file)}")
        
        email_success = send_email_with_attachment(recipient_email, [test_file], "Vendor")
        
        if email_success:
            print(f"\nSUCCESS: SUCCESS: Test email sent to {recipient_email}")
            print("Check the recipient's inbox (and spam folder)")
        else:
            print(f"\nERROR: FAILED: Could not send email")
            print("\nTroubleshooting tips:")
            print("  1. Double-check email and password in this script")
            print("  2. For Gmail: Use App Password, not regular password")
            print("  3. Check if 2-factor authentication is enabled")
            print("  4. Try a different SMTP server (Outlook, Yahoo, etc.)")
            print("  5. Check firewall/antivirus blocking SMTP")
    else:
        print(f"ERROR: Test file not found: {test_file}")

if __name__ == "__main__":
    main() 