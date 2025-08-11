#!/usr/bin/env python3
"""
Simple email test script for Jonas Browser automation.
This script tests only the email functionality using existing files.
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from jonas_browser import send_email_with_attachment

def main():
    print("=== Jonas Email Test ===")
    
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
        
        print(f"\n=== Email Configuration Reminder ===")
        print("IMPORTANT: Make sure you've updated the email settings in jonas_browser.py:")
        print("  - sender_email: Replace 'UPDATE_WITH_YOUR_EMAIL@gmail.com'")
        print("  - sender_password: Replace 'UPDATE_WITH_YOUR_APP_PASSWORD'")
        print("\nFor Gmail users:")
        print("  1. Enable 2-factor authentication")
        print("  2. Go to Google Account settings > Security > App passwords")
        print("  3. Generate an App Password for 'Mail'")
        print("  4. Use the 16-character App Password (not your regular password)")
        
        proceed = input("\nHave you updated the email configuration? (y/n): ").strip().lower()
        if proceed != 'y':
            print("\nPlease update the email configuration in jonas_browser.py first:")
            print("  Line ~252: sender_email = \"YOUR_EMAIL@gmail.com\"")
            print("  Line ~253: sender_password = \"YOUR_APP_PASSWORD\"")
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
            print("  1. Double-check email and password in jonas_browser.py")
            print("  2. For Gmail: Use App Password, not regular password")
            print("  3. Check if 2-factor authentication is enabled")
            print("  4. Try a different SMTP server (Outlook, Yahoo, etc.)")
            print("  5. Check firewall/antivirus blocking SMTP")
    else:
        print(f"ERROR: Test file not found: {test_file}")

if __name__ == "__main__":
    main() 