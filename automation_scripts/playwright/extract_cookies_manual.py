#!/usr/bin/env python3
"""
Manual Cookie Extraction Script
Opens a browser where you can manually login to any website, then extracts cookies.
"""

from playwright.sync_api import sync_playwright
import json
import os

def extract_cookies_manually():
    """Open browser for manual login and extract cookies"""
    with sync_playwright() as p:
        # Launch browser with GUI
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        
        print("=" * 60)
        print("MANUAL COOKIE EXTRACTION")
        print("=" * 60)
        print("1. A browser window will open")
        print("2. Navigate to your Lenovo site and login manually")
        print("3. Complete all login steps including 2FA if needed")
        print("4. Come back here and press Enter when fully logged in")
        print("=" * 60)
        
        # Open to about:blank first
        page.goto("about:blank")
        
        # Wait for user to manually login
        input("\nPress Enter after you have successfully logged in...")
        
        # Extract cookies from current context
        cookies = context.cookies()
        
        # Save cookies to file
        cookies_file = "playwright/lenovo_cookies.json"
        with open(cookies_file, 'w') as f:
            json.dump(cookies, f, indent=2)
        
        print(f"\n✓ Cookies extracted and saved to: {cookies_file}")
        print(f"✓ Found {len(cookies)} cookies")
        
        # Show current page URL for verification
        current_url = page.url
        print(f"✓ Current page: {current_url}")
        
        context.close()
        browser.close()
        
        return cookies_file

if __name__ == "__main__":
    extract_cookies_manually() 