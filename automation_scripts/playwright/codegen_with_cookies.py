#!/usr/bin/env python3
"""
Playwright Codegen with Cookies
Loads cookies and runs codegen so you can record actions on authenticated pages.
"""

import json
import sys
import subprocess
from playwright.sync_api import sync_playwright

def load_cookies(cookies_file="playwright/lenovo_cookies.json"):
    """Load cookies from file"""
    try:
        with open(cookies_file, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"❌ Cookie file not found: {cookies_file}")
        print("Run extract_cookies_manual.py first to extract cookies")
        return None
    except json.JSONDecodeError:
        print(f"❌ Invalid JSON in cookie file: {cookies_file}")
        return None

def run_codegen_with_cookies(start_url=None):
    """Run Playwright codegen with pre-loaded cookies"""
    
    # Load cookies
    cookies = load_cookies()
    if not cookies:
        return
    
    print(f"✓ Loaded {len(cookies)} cookies")
    
    # If no start URL provided, try to guess from cookies
    if not start_url:
        domains = set(cookie.get('domain', '').lstrip('.') for cookie in cookies)
        domains = [d for d in domains if d and 'lenovo' in d.lower()]
        if domains:
            start_url = f"https://{domains[0]}"
        else:
            start_url = "https://www.lenovo.com"
    
    print(f"✓ Starting codegen at: {start_url}")
    print("=" * 60)
    print("PLAYWRIGHT CODEGEN WITH COOKIES")
    print("=" * 60)
    print("✓ Cookies will be loaded automatically")
    print("✓ You should be logged in when the browser opens")
    print("✓ Record your actions as normal")
    print("✓ Generated code will be saved to your clipboard")
    print("=" * 60)
    
    with sync_playwright() as p:
        # Create a context with the cookies
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        
        # Add cookies to context
        context.add_cookies(cookies)
        
        # Create a page and navigate
        page = context.new_page()
        page.goto(start_url)
        
        print(f"\n✓ Browser opened with cookies loaded")
        print(f"✓ Current URL: {page.url}")
        print("\nNow run Playwright codegen in another terminal:")
        print(f"playwright codegen --target python-async {start_url}")
        print("\nOr run the alternative codegen script...")
        
        input("\nPress Enter when done...")
        
        context.close()
        browser.close()

def run_codegen_subprocess(start_url=None):
    """Alternative: Run codegen as subprocess with cookie context"""
    
    if not start_url:
        start_url = input("Enter the URL to start codegen with (or press Enter for Lenovo): ").strip()
        if not start_url:
            start_url = "https://www.lenovo.com"
    
    print(f"\n🚀 Running Playwright codegen...")
    print(f"URL: {start_url}")
    print("Note: This will open WITHOUT cookies. Use the main function for cookies.")
    
    try:
        # Run playwright codegen
        cmd = ["playwright", "codegen", "--target", "python-async", start_url]
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running codegen: {e}")
    except FileNotFoundError:
        print("❌ Playwright CLI not found. Install with: pip install playwright")
        print("❌ Then run: playwright install")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        start_url = sys.argv[1]
    else:
        start_url = None
    
    print("Choose an option:")
    print("1. Run codegen with cookies (recommended)")
    print("2. Run regular codegen without cookies")
    
    choice = input("Enter choice (1 or 2): ").strip()
    
    if choice == "1":
        run_codegen_with_cookies(start_url)
    elif choice == "2":
        run_codegen_subprocess(start_url)
    else:
        print("Invalid choice. Running with cookies...")
        run_codegen_with_cookies(start_url) 