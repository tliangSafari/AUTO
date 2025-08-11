#!/usr/bin/env python3
"""
Test Cookie Authentication
Simple script to test if extracted cookies work for authentication.
"""

import json
from playwright.sync_api import sync_playwright

def test_cookies(cookies_file="playwright/lenovo_cookies.json", test_url=None):
    """Test if cookies work for authentication"""
    
    # Load cookies
    try:
        with open(cookies_file, 'r') as f:
            cookies = json.load(f)
    except FileNotFoundError:
        print(f"❌ Cookie file not found: {cookies_file}")
        print("Run extract_cookies_manual.py first!")
        return False
    
    print(f"✓ Loaded {len(cookies)} cookies")
    
    # Determine test URL from cookies if not provided
    if not test_url:
        domains = set(cookie.get('domain', '').lstrip('.') for cookie in cookies)
        domains = [d for d in domains if d and 'lenovo' in d.lower()]
        if domains:
            test_url = f"https://{domains[0]}"
        else:
            test_url = "https://www.lenovo.com"
    
    print(f"✓ Testing authentication at: {test_url}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        
        # Add cookies
        context.add_cookies(cookies)
        
        page = context.new_page()
        page.goto(test_url)
        
        print(f"✓ Navigated to: {page.url}")
        print(f"✓ Page title: {page.title()}")
        
        # Take a screenshot for verification
        screenshot_path = "playwright/cookie_test_screenshot.png"
        page.screenshot(path=screenshot_path)
        print(f"✓ Screenshot saved: {screenshot_path}")
        
        # Check if we seem to be logged in (look for common login indicators)
        is_logged_in = False
        
        # Common logout/account indicators
        logout_indicators = [
            "logout", "sign out", "account", "profile", "dashboard",
            "my account", "welcome", "settings"
        ]
        
        page_content = page.content().lower()
        for indicator in logout_indicators:
            if indicator in page_content:
                is_logged_in = True
                print(f"✓ Found login indicator: '{indicator}'")
                break
        
        if is_logged_in:
            print("✅ Cookies appear to be working - you seem logged in!")
        else:
            print("⚠️  Cannot confirm login status - please check manually")
        
        input("\nPress Enter to close browser...")
        
        context.close()
        browser.close()
        
        return is_logged_in

if __name__ == "__main__":
    test_url = input("Enter URL to test (or press Enter for auto-detect): ").strip()
    if not test_url:
        test_url = None
    
    test_cookies(test_url=test_url) 