#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Warmup script to pre-import heavy modules and cache them in memory.
This reduces the startup time for subsequent Python scripts.
"""

import sys
import time
import os

def warmup():
    """Pre-import all heavy modules used by Jonas automation."""
    start_time = time.time()
    
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Starting Python warmup...")
    
    # Import standard libraries
    print("Importing standard libraries...")
    import json
    import re
    import io
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from email.mime.base import MIMEBase
    from email import encoders
    
    print(f"  Standard libraries imported ({time.time() - start_time:.1f}s)")
    
    # Import heavy third-party libraries
    print("Importing pandas...")
    pandas_start = time.time()
    import pandas as pd
    print(f"  Pandas imported ({time.time() - pandas_start:.1f}s)")
    
    print("Importing Playwright...")
    playwright_start = time.time()
    from playwright.sync_api import sync_playwright, expect
    print(f"  Playwright imported ({time.time() - playwright_start:.1f}s)")
    
    # Try to import BeautifulSoup if available
    try:
        print("Importing BeautifulSoup...")
        bs_start = time.time()
        from bs4 import BeautifulSoup
        print(f"  BeautifulSoup imported ({time.time() - bs_start:.1f}s)")
    except ImportError:
        print("  BeautifulSoup not available (optional)")
    
    # Pre-compile some regex patterns
    print("Pre-compiling regex patterns...")
    patterns = [
        re.compile(r"excel|export|download", re.IGNORECASE),
        re.compile(r"SUCCESS: Saved HTML file to: (.+\.html)"),
        re.compile(r"SUCCESS: Successfully converted HTML to Excel: (.+\.xlsx)"),
    ]
    
    # Initialize Playwright to trigger any lazy loading
    print("Initializing Playwright...")
    playwright_init_start = time.time()
    try:
        with sync_playwright() as p:
            # Launch a browser to fully initialize Playwright
            print("  Launching Chromium browser for full initialization...")
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto("about:blank")
            page.close()
            browser.close()
            print(f"  Playwright fully initialized with browser launch ({time.time() - playwright_init_start:.1f}s)")
    except Exception as e:
        print(f"  Playwright initialization failed: {e}")
    
    # Import the Jonas browser module to pre-load it
    try:
        print("Pre-loading Jonas automation modules...")
        jonas_start = time.time()
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'jonas'))
        from jonas_browser import JonasBrowser
        print(f"  Jonas modules loaded ({time.time() - jonas_start:.1f}s)")
    except Exception as e:
        print(f"  Could not pre-load Jonas modules: {e}")
    
    total_time = time.time() - start_time
    print(f"\n[{time.strftime('%Y-%m-%d %H:%M:%S')}] Warmup completed in {total_time:.1f} seconds")
    print("="*60)
    
    return True

if __name__ == "__main__":
    # Run warmup
    success = warmup()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)