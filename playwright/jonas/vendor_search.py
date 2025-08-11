#!/usr/bin/env python3
"""
Jonas Premier Vendor Search Script
Searches for a specific vendor in Jonas Premier to validate existence
"""

import sys
import json
import os
from typing import Optional, List
from playwright.sync_api import sync_playwright, Page
import time

# Add the parent directory to the Python path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

def load_jonas_credentials():
    """Load Jonas credentials from centralized config file."""
    try:
        # Path to centralized credentials file
        script_dir = os.path.dirname(os.path.abspath(__file__))
        # Go up to automation_scripts/jonas/ directory
        jonas_dir = os.path.join(script_dir, '..', '..', 'automation_scripts', 'jonas')
        config_path = os.path.join(jonas_dir, 'jonas_credentials.json')
        
        with open(config_path, 'r') as f:
            credentials = json.load(f)
        
        return {
            'clientId': credentials.get('clientId', '121297'),
            'username': credentials.get('username', 'SLiu'),
            'password': credentials.get('password', 'AspenPower123-')
        }
    except Exception as e:
        print(f"Warning: Could not load centralized Jonas credentials: {e}")
        print("Using fallback defaults")
        # Fallback to defaults if file doesn't exist or can't be read
        return {
            'clientId': '121297',
            'username': 'SLiu',
            'password': 'AspenPower123-'
        }

def search_vendor_in_jonas(vendor_name: str, show_browser: bool = False) -> bool:
    """
    Search for a vendor in Jonas Premier
    
    Args:
        vendor_name: Name of vendor to search for
        show_browser: Whether to show the browser window
    
    Returns:
        bool: True if vendor is found, False otherwise
    """
    
    try:
        with sync_playwright() as p:
            # Launch browser
            browser = p.chromium.launch(headless=not show_browser)
            context = browser.new_context()
            page = context.new_page()
            
            # Load credentials from centralized config
            credentials = load_jonas_credentials()
            
            # Navigate to Jonas login
            print(f"Navigating to Jonas Premier login...")
            page.goto('https://premier.jonassoftware.com/Jonas.Web.Premier/ClientPortal/Account/Login')
            page.wait_for_load_state('networkidle')
            
            # Fill login form
            print(f"Logging into Jonas Premier...")
            page.fill('#ClientId', credentials['clientId'])
            page.fill('#Username', credentials['username'])
            page.fill('#Password', credentials['password'])
            
            # Click login
            page.click('input[type="submit"]')
            page.wait_for_load_state('networkidle')
            
            # Check if login was successful
            if 'Login' in page.title():
                print("Login failed - credentials may be invalid")
                return False
            
            print(f"Successfully logged into Jonas Premier")
            
            # Navigate to AP-Vendor Inquiry
            print(f"Navigating to AP-Vendor Inquiry...")
            page.goto('https://premier.jonassoftware.com/Jonas.Web.Premier/ClientPortal/Inquiry/APVendorInquiry')
            page.wait_for_load_state('networkidle')
            
            # Search for the specific vendor
            print(f"Searching for vendor: {vendor_name}")
            
            # Fill in the vendor search field
            vendor_input = page.locator('input[placeholder*="Vendor" i], input[name*="vendor" i], input[id*="vendor" i]').first
            if vendor_input.count() > 0:
                vendor_input.fill(vendor_name)
                
                # Click search or submit button
                search_button = page.locator('input[type="submit"], button[type="submit"], button:has-text("Search"), input[value*="Search"]').first
                if search_button.count() > 0:
                    search_button.click()
                    page.wait_for_load_state('networkidle')
                    
                    # Wait a bit for results to load
                    time.sleep(2)
                    
                    # Check if vendor appears in results
                    page_content = page.content().lower()
                    vendor_name_lower = vendor_name.lower()
                    
                    # Look for various indicators that the vendor was found
                    found_indicators = [
                        vendor_name_lower in page_content,
                        'no records found' not in page_content,
                        'no results' not in page_content,
                        'no vendors found' not in page_content
                    ]
                    
                    # Check if there are any data rows/results
                    result_rows = page.locator('tr, .result-row, .data-row, table tbody tr').count()
                    
                    vendor_found = any(found_indicators) and result_rows > 1  # More than header row
                    
                    if vendor_found:
                        print(f"FOUND: Vendor '{vendor_name}' exists in Jonas Premier")
                        return True
                    else:
                        print(f"NOT FOUND: Vendor '{vendor_name}' does not exist in Jonas Premier")
                        return False
                else:
                    print("Could not find search button")
                    return False
            else:
                print("Could not find vendor input field")
                return False
                
    except Exception as e:
        print(f"Error searching for vendor '{vendor_name}': {str(e)}")
        return False
    
    finally:
        try:
            browser.close()
        except:
            pass

def main():
    """Main function to handle command line arguments"""
    if len(sys.argv) < 2:
        print("Usage: python vendor_search.py <vendor_name> [show_browser]")
        sys.exit(1)
    
    vendor_name = sys.argv[1]
    show_browser = len(sys.argv) > 2 and sys.argv[2].lower() == 'true'
    
    try:
        found = search_vendor_in_jonas(vendor_name, show_browser)
        print(f"RESULT: {found}")
        
        # Exit with appropriate code
        sys.exit(0 if found else 1)
        
    except Exception as e:
        print(f"Script error: {str(e)}")
        sys.exit(2)

if __name__ == "__main__":
    main()