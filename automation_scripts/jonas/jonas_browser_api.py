#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Jonas Browser API - Modified version for API integration
This script accepts configuration via command line arguments and runs headlessly by default.
"""

# Log immediately to see if Python is starting
print(f"[STARTUP] Python process started at {__import__('time').strftime('%Y-%m-%d %H:%M:%S')}", flush=True)

# Fix Windows console encoding for Unicode characters
import sys
import os
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

print(f"[STARTUP] Starting imports at {__import__('time').strftime('%Y-%m-%d %H:%M:%S')}", flush=True)
import argparse
import json
import sys
import os
print(f"[STARTUP] Basic imports done, importing playwright at {__import__('time').strftime('%Y-%m-%d %H:%M:%S')}", flush=True)
from playwright.sync_api import sync_playwright
print(f"[STARTUP] Playwright imported, importing jonas_browser at {__import__('time').strftime('%Y-%m-%d %H:%M:%S')}", flush=True)
from jonas_browser import JonasBrowser, read_excel_data, send_email_with_attachment
print(f"[STARTUP] All imports complete at {__import__('time').strftime('%Y-%m-%d %H:%M:%S')}", flush=True)

def process_config(config_path):
    """Process the configuration file and run the appropriate automation."""
    import time
    start_time = time.time()
    
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Python script started")
    
    try:
        # Read configuration
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Reading config file: {config_path}")
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Config loaded ({time.time() - start_time:.1f}s)")
        print(f"Processing {config['type']} request...")
        
        # Extract credentials from config, with fallback to centralized config
        credentials = config.get('credentials', {})
        
        # Load centralized credentials as fallback
        try:
            script_dir = os.path.dirname(__file__)
            centralized_config_path = os.path.join(script_dir, 'jonas_credentials.json')
            with open(centralized_config_path, 'r') as f:
                centralized_creds = json.load(f)
        except Exception as e:
            print(f"Warning: Could not load centralized credentials: {e}")
            centralized_creds = {
                "clientId": "121297",
                "username": "SLiu", 
                "password": "AspenPower123-"
            }
        
        # Use config credentials if provided, otherwise use centralized config
        client_id = credentials.get('clientId') or centralized_creds.get('clientId', '121297')
        username = credentials.get('username') or centralized_creds.get('username', 'SLiu')
        password = credentials.get('password') or centralized_creds.get('password', 'AspenPower123-')
        
        # Extract email config
        email_config = config.get('email', {})
        recipient_email = email_config.get('recipient', '')
        send_email = email_config.get('send', False)
        
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Starting Playwright... ({time.time() - start_time:.1f}s)")
        with sync_playwright() as playwright:
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Playwright started ({time.time() - start_time:.1f}s)")
            
            # Initialize browser - headless mode configurable via config
            show_browser = config.get('showBrowser', False)
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Launching browser (headless={not show_browser})... ({time.time() - start_time:.1f}s)")
            jonas = JonasBrowser(playwright, headless=not show_browser)
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Browser launched ({time.time() - start_time:.1f}s)")
            
            try:
                # Login
                print("Logging in to Jonas Premier...")
                jonas.login(client_id=client_id, username=username, password=password)
                print("Login successful")
                
                downloaded_files = []
                
                if config['type'] == 'vendors':
                    # Process vendors
                    vendors = config.get('vendors', [])
                    print(f"Processing {len(vendors)} vendors...")
                    print("Vendor list from config:")
                    for i, vendor in enumerate(vendors):
                        print(f"   {i+1}. '{vendor}'")
                    
                    download_file = jonas.get_vendors(vendors)
                    if download_file:
                        downloaded_files.append(download_file)
                        print(f"SUCCESS: Downloaded vendor report: {download_file}")
                    else:
                        print("ERROR: Failed to download vendor report")
                        sys.exit(1)
                
                elif config['type'] == 'accounts':
                    # Process accounts
                    accounts = config.get('accounts', [])
                    print(f"Processing {len(accounts)} accounts...")
                    
                    for i, account in enumerate(accounts):
                        print(f"\nProcessing account {i+1}/{len(accounts)}: {account['code']}")
                        
                        # Convert date format if needed
                        start_date = account['startDate']
                        end_date = account['endDate']
                        
                        # Convert from YYYY-MM-DD to MM-DD-YYYY if needed
                        if '-' in start_date and len(start_date.split('-')[0]) == 4:
                            parts = start_date.split('-')
                            start_date = f"{parts[1]}-{parts[2]}-{parts[0]}"
                        
                        if '-' in end_date and len(end_date.split('-')[0]) == 4:
                            parts = end_date.split('-')
                            end_date = f"{parts[1]}-{parts[2]}-{parts[0]}"
                        
                        skip_nav = i > 0  # Skip navigation after first account
                        download_file = jonas.get_accounts(
                            account_code=account['code'],
                            start_date=start_date,
                            end_date=end_date,
                            skip_navigation=skip_nav
                        )
                        
                        if download_file:
                            downloaded_files.append(download_file)
                            print(f"SUCCESS: Downloaded: {download_file}")
                        else:
                            print(f"ERROR: Failed to download account {account['code']}")
                        
                        # Add delay between accounts
                        if i < len(accounts) - 1:
                            jonas.page.wait_for_timeout(3000)
                
                # Handle email if configured
                if send_email and recipient_email and downloaded_files:
                    print(f"\nSending email to {recipient_email}...")
                    report_type = "Vendor" if config['type'] == 'vendors' else "Account"
                    
                    # Note: Email functionality is disabled by default in jonas_browser.py
                    # You would need to configure SMTP settings and enable it
                    print(f"Email feature configured but not sent (demo mode)")
                    print(f"Would send {len(downloaded_files)} files to {recipient_email}")
                
                # Print summary
                print(f"\n=== Summary ===")
                print(f"Successfully processed {len(downloaded_files)} reports")
                for file in downloaded_files:
                    print(f"  - {file}")
                
                # Return success
                return 0
                
            finally:
                jonas.cleanup()
                
    except FileNotFoundError:
        print(f"Error: Configuration file not found: {config_path}")
        return 1
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in configuration file: {config_path}")
        return 1
    except Exception as e:
        print(f"Error: {str(e)}")
        return 1

def main():
    parser = argparse.ArgumentParser(description='Jonas Browser API - Automated data extraction')
    parser.add_argument('--config', required=True, help='Path to configuration JSON file')
    parser.add_argument('--headless', action='store_true', help='Run browser in headless mode (overrides config)')
    parser.add_argument('--show-browser', action='store_true', help='Show browser window (overrides config)')
    
    args = parser.parse_args()
    
    # Override config with command line arguments
    try:
        with open(args.config, 'r') as f:
            config = json.load(f)
        
        # Command line arguments override config file
        if args.headless:
            config['showBrowser'] = False
        elif args.show_browser:
            config['showBrowser'] = True
        
        # Write back the modified config
        with open(args.config, 'w') as f:
            json.dump(config, f, indent=2)
            
    except Exception as e:
        print(f"Warning: Could not modify config file: {e}")
    
    # Process the configuration and run automation
    exit_code = process_config(args.config)
    sys.exit(exit_code)

if __name__ == "__main__":
    main()