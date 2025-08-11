from playwright.sync_api import Playwright, sync_playwright
import os
import pandas as pd
from datetime import datetime, timedelta
import time
import io
import json

def daterange_chunks(start_date, end_date, months=3):
    # Generate a list of period start dates
    starts = pd.date_range(start=start_date, end=end_date, freq=f'{months}MS')
    # Add the end date if not already included
    if starts[-1] < pd.to_datetime(end_date):
        starts = starts.append(pd.DatetimeIndex([pd.to_datetime(end_date)]))
    # Create (start, end) tuples
    ranges = []
    for i in range(len(starts) - 1):
        chunk_start = starts[i]
        chunk_end = starts[i+1] - pd.Timedelta(days=1)
        if chunk_end > pd.to_datetime(end_date):
            chunk_end = pd.to_datetime(end_date)
        ranges.append((chunk_start, chunk_end))
    return ranges

def extract_cookies(playwright: Playwright) -> dict:
    browser = playwright.chromium.launch(headless=False, slow_mo=500)
    context = browser.new_context()
    page = context.new_page()

    # Login process
    page.goto("https://login.stem.com/u/login/identifier")
    page.get_by_role("textbox", name="Email address").fill("Assetmanagement@safarienergy.com")
    page.get_by_role("button", name="Continue").click()
    page.wait_for_selector("input[type='password']")
    page.get_by_role("textbox", name="Password").fill("Aspensafari12345")
    page.get_by_role("button", name="Continue").click()
    page.wait_for_load_state("networkidle", timeout=60000)

    # Extract cookies
    cookies = context.cookies()
    
    # Save cookies to file
    with open('cookies.json', 'w') as f:
        json.dump(cookies, f, indent=2)
    
    # Clean up
    context.close()
    browser.close()
    
    return cookies

def load_cookies() -> list:
    with open('cookies.json', 'r') as f:
        return json.load(f)

def use_cookies(playwright: Playwright, cookies: list) -> None:
    browser = playwright.chromium.launch(headless=False, slow_mo=500)
    context = browser.new_context(
        accept_downloads=True,
    )
    print(f'cookies: {cookies}')
    # Add cookies to the context
    context.add_cookies(cookies)
    
    page = context.new_page()
    
    # Test if cookies work by going to a protected page
    page.goto("https://portal.stem.com")
    print("Current URL after using cookies:", page.url)
    page.screenshot(path="after_cookies.png")
    
    # If you want to test the full functionality, you can add your date range code here
    # ... rest of your code ...
    
    input("Press Enter to exit and close the browser...")
    context.close()
    browser.close()

def run(playwright: Playwright) -> None:
    browser = playwright.chromium.launch(headless=False, slow_mo=500)
    context = browser.new_context(
        accept_downloads=True,
    )
    page = context.new_page()

    # Set your date range here
    start_date = datetime(2023, 1, 1)
    end_date = datetime(2025, 4, 30)
    site_id = "S58481"
    data_dir = os.path.join("data", site_id)
    os.makedirs(data_dir, exist_ok=True)
    all_dfs = []

    # # 1. Go to login page
    page.goto("https://login.stem.com/u/login/identifier")
    page.get_by_role("textbox", name="Email address").fill("Assetmanagement@safarienergy.com")
    page.get_by_role("button", name="Continue").click()
    page.wait_for_selector("input[type='password']")
    page.get_by_role("textbox", name="Password").fill("Aspensafari12345")
    page.get_by_role("button", name="Continue").click()
    page.wait_for_load_state("networkidle", timeout=60000)
    print("Current URL after login:", page.url)
    page.screenshot(path="after_login.png")

    # # 2. Loop through date ranges
    for chunk_start, chunk_end in daterange_chunks(start_date, end_date, months=3):
        start_str = chunk_start.strftime("%Y-%m-%d")
        end_str = chunk_end.strftime("%Y-%m-%d")
        print(f"Processing {start_str} to {end_str}")
        url = f"https://apps.alsoenergy.com/powertrack/{site_id}/analysis/chartbuilder?start={start_str}&end={end_str}&d=custom&bin=15&k=%7B~measurements~%3A%5B2%2C4%5D%7D&m=k&a=0&i=%7B~aggregationMode~%3A3%2C~useInsolation~%3Atrue%7D&h=1*2*5&c=257&s=4"
        print(f"Navigating to: {url}")
        page.goto(url)
        try:
            page.get_by_label("Export Data").locator("svg").click()
            with page.expect_download() as download_info:
                page.get_by_text("Full Data (CSV)").click()
            print(f'Downloaded file')
            download = download_info.value
            
            # Create a temporary file path
            temp_path = download.path()
            # Read the CSV directly into memory
            df = pd.read_csv(temp_path)
            all_dfs.append(df)
            print(f"Processed data for {start_str} to {end_str}")
        except Exception as e:
            print(f"Failed to download for {start_str} to {end_str}: {e}")

    # 3. Concatenate all dataframes and save final result
    if all_dfs:
        final_df = pd.concat(all_dfs, ignore_index=True)
        final_csv_path = os.path.join(data_dir, "all_data.csv")
        final_df.to_csv(final_csv_path, index=False)
        print(f"All data saved to {final_csv_path}")
        print(final_df)
    else:
        print("No data downloaded.")

    input("Press Enter to exit and close the browser...")
    context.close()
    browser.close()

with sync_playwright() as playwright:
    try:
        # Load cookies from file
        run(playwright)
        cookies = load_cookies()
        print("Successfully loaded cookies from file")
        
        # Use the loaded cookies
        use_cookies(playwright, cookies)
    except FileNotFoundError:
        print("No cookies.json file found. Please run extract_cookies first.")
    except json.JSONDecodeError:
        print("Error reading cookies.json file. The file might be corrupted.")
