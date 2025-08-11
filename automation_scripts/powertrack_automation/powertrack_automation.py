import os
import sys
from pathlib import Path

# Add the project root directory to Python path
project_root = str(Path(__file__).parent.parent.parent)
sys.path.append(project_root)

from playwright.sync_api import Playwright, sync_playwright
import pandas as pd
from datetime import datetime, timedelta
import time
import io
import json
# from sqlalchemy import create_engine, text, MetaData, Table
import uuid
from pytz import timezone
# from sqlalchemy.exc import OperationalError
# from sqlalchemy.orm import Session
import traceback

# Load environment variables from .env file
# load_dotenv()

# ============================================================================
# CONFIGURATION SECTION - EASY TO MODIFY
# ============================================================================

# Default login credentials (can be overridden by environment variables)
DEFAULT_LOGIN_CONFIG = {
    "email": "cliu@aspenpower.com",
    "password": "Aspensafari12345!",
}

# PowerTrack URL configuration
POWERTRACK_CONFIG = {
    "base_url": "https://apps.alsoenergy.com/powertrack",
    "login_url": "https://login.stem.com/u/login/identifier", 
    "url_params": "analysis/chartbuilder?start={start_date}&end={end_date}&d=custom&bin=15&k=%7B~measurements~%3A%5B2%2C4%5D%7D&m=k&a=0&i=%7B~aggregationMode~%3A3%2C~useInsolation~%3Atrue%7D&h=1*2*5&c=257&s=4"
}

# Data processing configuration
DATA_CONFIG = {
    "insolation_divisor": 4000,  # Divide insolation values by this number
    "chunk_months": 3,           # Download data in chunks of this many months
    "timezone": "US/Eastern",    # Timezone for timestamps
}

# ============================================================================
# END CONFIGURATION SECTION
# ============================================================================

def daterange_chunks(start_date, end_date, months=None):
    if months is None:
        months = DATA_CONFIG["chunk_months"]
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

# Cookie handling functions removed - not needed for direct automation

# def get_meter_data_table(engine):
#     """Get the meter_data table schema from the database"""
#     metadata = MetaData()
#     return Table('meter_data', metadata, autoload_with=engine)

# def get_inverter_data_table(engine):
#     """Get the inverter_data table schema from the database"""
#     metadata = MetaData()
#     return Table('inverter_data', metadata, autoload_with=engine)

class UnderwritingPowertrack:
    def __init__(self, engine=None, asset_id=None, monitoring_platform_id=None, db_site_id=None):
        self.engine = engine
        self.meter_data_table = None
        self.inverter_data_table = None
        self.timestamp_col = None
        self.data_dir = None
        self.monitoring_platform_id = monitoring_platform_id
        self.db_site_id = db_site_id or monitoring_platform_id  # Use monitoring_platform_id as site_id
        self.asset_id = asset_id
        
        # Automatically lookup asset_id if we have db_site_id
        if self.db_site_id:
            self._auto_lookup_asset_id()

    def _auto_lookup_asset_id(self):
        """Skip database lookup - use monitoring_platform_id as asset_id for CSV export"""
        if self.db_site_id and not self.asset_id:
            self.asset_id = str(self.db_site_id)  # Use site_id as asset_id for CSV export
            print(f"[CSV Mode] Using site_id as asset_id: {self.asset_id}")

    def initialize_tables(self):
        """Skip database table initialization - CSV export mode"""
        print("[CSV Mode] Skipping database table initialization")

    def set_site(self, site_id: str):
        """Set site ID and create data directory"""
        self.db_site_id = site_id
        self.data_dir = os.path.join("app", "services", "data", site_id)
        os.makedirs(self.data_dir, exist_ok=True)
        # Re-lookup asset_id when site changes  
        self._auto_lookup_asset_id()

    def set_timestamp_column(self, df: pd.DataFrame):
        """Set the timestamp column name from DataFrame"""
        # Common timestamp column names to look for
        possible_timestamp_columns = ['Site Time', 'Timestamp', 'timestamp', 'Time', 'time', 'DateTime', 'datetime']
        self.timestamp_col = None
        
        for col_name in possible_timestamp_columns:
            if col_name in df.columns:
                self.timestamp_col = col_name
                print(f"[DataProcessing] Using timestamp column: {col_name}")
                break
        
        if not self.timestamp_col:
            raise ValueError(f"No timestamp column found. Expected one of: {possible_timestamp_columns}")

    def process_meter_data(self, final_df: pd.DataFrame, push_to_db: bool = True):
        """Process meter data from DataFrame and save to CSV and database"""
        # Look for meter columns (columns containing "Meter")
        meter_pattern = "Meter"
        
        meter_columns = [col for col in final_df.columns if meter_pattern in col]
        if not meter_columns:
            print(f"[DataProcessing] No columns found matching meter pattern: '{meter_pattern}'")
            return

        print(f"[DataProcessing] Found meter columns: {meter_columns}")
        
        # Create meter data DataFrame using vectorized operations
        print("[DataProcessing] Creating meter data DataFrame...")
        meter_dfs = []
        
        for col in meter_columns:
            print(f"[DataProcessing] Processing column: {col}")
            meter_df = pd.DataFrame({
                'timestamp': final_df[self.timestamp_col],
                'component_id': col,
                'energy': final_df[col],
                'name': col,
                'asset_id': self.asset_id
            })
            meter_dfs.append(meter_df)
        
        # Concatenate all meter DataFrames
        print("[DataProcessing] Combining all meter data...")
        meter_df = pd.concat(meter_dfs, ignore_index=True)
        
        # Add required columns for database
        meter_df['id'] = [str(uuid.uuid4()) for _ in range(len(meter_df))]
        meter_df['created_at'] = datetime.now(timezone(DATA_CONFIG["timezone"]))
        
        # Save to CSV
        meter_csv_path = os.path.join(self.data_dir, "meter_data.csv")
        meter_df.to_csv(meter_csv_path, index=False)
        print(f"Saved meter data to {meter_csv_path}")

        # Skip database operations - CSV export only
        print("[DataProcessing] Database operations disabled - CSV export mode")

    def process_inverter_data(self, final_df: pd.DataFrame, push_to_db: bool = True):
        """Process inverter data from DataFrame and save to CSV and database"""
        # Look for inverter columns (columns containing "Inverter" or "Inv")
        inverter_patterns = ["Inverter", "Inv"]
        
        # Print all columns to debug
        print(f"[DataProcessing] All columns in DataFrame: {final_df.columns.tolist()}")
        
        inverter_columns = []
        for pattern in inverter_patterns:
            inverter_columns.extend([col for col in final_df.columns if pattern in col])
        
        # Remove duplicates while preserving order
        inverter_columns = list(dict.fromkeys(inverter_columns))
        
        if not inverter_columns:
            print(f"[DataProcessing] No inverter columns found matching patterns: {inverter_patterns}")
            return

        print(f"[DataProcessing] Found inverter columns: {inverter_columns}")
        
        # Create inverter data DataFrame using vectorized operations
        print("[DataProcessing] Creating inverter data DataFrame...")
        
        inverter_dfs = []
        
        for col in inverter_columns:
            print(f"[DataProcessing] Processing column: {col}")
            # Create DataFrame for this inverter using only essential fields
            inverter_df = pd.DataFrame({
                'timestamp': final_df[self.timestamp_col],
                'component_id': col,
                'energy': final_df[col],
                'name': col,
                'asset_id': self.asset_id
            })
            inverter_dfs.append(inverter_df)
        
        # Concatenate all inverter DataFrames
        print("[DataProcessing] Combining all inverter data...")
        inverter_df = pd.concat(inverter_dfs, ignore_index=True)
        
        # Add required columns for database
        inverter_df['id'] = [str(uuid.uuid4()) for _ in range(len(inverter_df))]
        inverter_df['created_at'] = datetime.now(timezone(DATA_CONFIG["timezone"]))
        
        # Save to CSV
        inverter_csv_path = os.path.join(self.data_dir, "inverter_data.csv")
        inverter_df.to_csv(inverter_csv_path, index=False)
        print(f"Saved inverter data to {inverter_csv_path}")

        # Skip database operations - CSV export only
        print("[DataProcessing] Database operations disabled - CSV export mode")

    def process_weather_station_data(self, final_df: pd.DataFrame, push_to_db: bool = True):
        """Process weather station data from DataFrame and save to CSV and database"""
        # Look for POA columns (columns containing "POA")
        poa_pattern = "POA"
        exclude_patterns = ["Expected", "Theoretical"]  # Exclude these patterns
        
        # Find POA columns (excluding specified patterns)
        poa_columns = []
        for col in final_df.columns:
            if poa_pattern in col:
                # Check if this column should be excluded
                should_exclude = any(exclude_pattern in col for exclude_pattern in exclude_patterns)
                if not should_exclude:
                    poa_columns.append(col)
        
        if not poa_columns:
            print(f"[DataProcessing] No POA columns found matching pattern '{poa_pattern}' (excluding {exclude_patterns})")
            return

        print(f"[DataProcessing] Found POA columns: {poa_columns}")
        
        # Create weather station data DataFrame using vectorized operations
        print("[DataProcessing] Creating weather station data DataFrame...")
        
        weather_dfs = []
        insolation_divisor = DATA_CONFIG["insolation_divisor"]
        
        for col in poa_columns:
            print(f"[DataProcessing] Processing column: {col}")
            # Create DataFrame for this POA sensor using vectorized operations
            # DIVIDE INSOLATION BY CONFIGURED VALUE as requested
            weather_df = pd.DataFrame({
                'timestamp': final_df[self.timestamp_col],
                'component_id': col,
                'insolation': final_df[col] / insolation_divisor,  # Use configurable divisor
                'name': col,
                'asset_id': self.asset_id
            })
            weather_dfs.append(weather_df)
        
        # Concatenate all weather station DataFrames
        print("[DataProcessing] Combining all weather station data...")
        weather_df = pd.concat(weather_dfs, ignore_index=True)
        
        # Add required columns for database
        weather_df['id'] = [str(uuid.uuid4()) for _ in range(len(weather_df))]
        weather_df['created_at'] = datetime.now(timezone(DATA_CONFIG["timezone"]))
        
        print(f"[DataProcessing] Applied insolation division by {DATA_CONFIG['insolation_divisor']}")
        
        # Save to CSV
        weather_csv_path = os.path.join(self.data_dir, "weather_station_data.csv")
        weather_df.to_csv(weather_csv_path, index=False)
        print(f"Saved weather station data to {weather_csv_path}")

        # Skip database operations - CSV export only
        print("[DataProcessing] Database operations disabled - CSV export mode")

    def process_downloaded_data(self, final_df: pd.DataFrame, site_id: str, push_to_db: bool = True):
        """
        Processes the downloaded DataFrame and saves to separate CSV files.
        Args:
            final_df (pd.DataFrame): The consolidated DataFrame from PowerTrack.
            site_id (str): The site ID for database operations.
            push_to_db (bool): Whether to push data to database (False for test mode).
        """
        if final_df.empty:
            print("[DataProcessing] DataFrame is empty. Nothing to process.")
            return

        print(f"[DataProcessing] Starting data processing for site_id: {site_id}")
        print(f"[DataProcessing] Database insertion: {'ENABLED' if push_to_db else 'DISABLED (test mode)'}")
        
        try:
            # Initialize site and tables
            self.set_site(site_id)
            self.set_timestamp_column(final_df)
            self.initialize_tables()

            # Process all data types with push_to_db parameter
            print("\n[DataProcessing] Processing meter data...")
            self.process_meter_data(final_df, push_to_db)
            
            print("\n[DataProcessing] Processing inverter data...")
            self.process_inverter_data(final_df, push_to_db)
            
            print("\n[DataProcessing] Processing weather station data...")
            self.process_weather_station_data(final_df, push_to_db)

            print("\nAll data processing completed successfully!")

        except Exception as e:
            print(f"[DataProcessing] Error processing data for site {site_id}: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            raise

# Old interactive function removed - replaced with run_powertrack_automation

# Interactive mode functions removed - script now uses command line arguments
# def get_operation_mode():
# def get_sync_mode_inputs():
# def get_retrieval_mode_inputs():

# Database retrieval functions commented out - CSV export mode only
# def run_data_retrieval(engine, site_id, data_types, date_from=None, date_to=None):
#     pass

# def test_database_connection():
#     """Test database connection before proceeding with the script"""
#     print("[CSV Mode] Database operations disabled - skipping connection test")
#     return None

# Playwright installation functions removed - handled by system setup

def main():
    """Main function with command line argument support"""
    import argparse
    
    parser = argparse.ArgumentParser(description='PowerTrack automation for AMOS')
    parser.add_argument('--monitoring_platform_id', required=True, help='Site ID for PowerTrack')
    parser.add_argument('--start_date', required=True, help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end_date', required=True, help='End date (YYYY-MM-DD)')
    parser.add_argument('--show_browser', default='false', help='Show browser (true/false)')
    
    args = parser.parse_args()
    
    print(f"Starting PowerTrack automation for site {args.monitoring_platform_id}")
    print(f"Date range: {args.start_date} to {args.end_date}")
    print(f"Show browser: {args.show_browser}")
    
    # Convert dates
    start_date = datetime.strptime(args.start_date, '%Y-%m-%d')
    end_date = datetime.strptime(args.end_date, '%Y-%m-%d')
    
    # Set browser visibility
    headless = args.show_browser.lower() != 'true'
    
    try:
        with sync_playwright() as playwright:
            run_powertrack_automation(playwright, args.monitoring_platform_id, start_date, end_date, headless)
    except Exception as e:
        print(f"Error during automation: {e}")
        sys.exit(1)

def run_powertrack_automation(playwright: Playwright, monitoring_platform_id: str, start_date: datetime, end_date: datetime, headless: bool = True) -> None:
    """Run PowerTrack automation with specified parameters"""
    browser = playwright.chromium.launch(headless=headless, slow_mo=500)
    context = browser.new_context(accept_downloads=True)
    page = context.new_page()

    # Create downloads directory like other automation scripts
    downloads_dir = os.path.join("downloads", "amos", "powertrack")
    os.makedirs(downloads_dir, exist_ok=True)

    # For URL, add "S" prefix if not already present
    url_site_id = f"S{monitoring_platform_id}" if not monitoring_platform_id.startswith("S") else monitoring_platform_id
    
    all_dfs = []

    print(f"\nStarting download for Monitoring Platform ID {monitoring_platform_id}")
    print(f"Date range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")

    # 1. Go to login page
    print("\nLogging in to PowerTrack...")
    page.goto(POWERTRACK_CONFIG["login_url"])
    page.get_by_role("textbox", name="Email address").fill(DEFAULT_LOGIN_CONFIG["email"])
    page.get_by_role("button", name="Continue").click()
    page.wait_for_selector("input[type='password']")
    page.get_by_role("textbox", name="Password").fill(DEFAULT_LOGIN_CONFIG["password"])
    page.get_by_role("button", name="Continue").click()
    page.wait_for_load_state("networkidle", timeout=60000)
    print("Login successful")

    # 2. Loop through date ranges
    date_chunks = list(daterange_chunks(start_date, end_date))
    print(f"\nDownloading data in {len(date_chunks)} chunks...")
    
    for i, (chunk_start, chunk_end) in enumerate(date_chunks, 1):
        start_str = chunk_start.strftime("%Y-%m-%d")
        end_str = chunk_end.strftime("%Y-%m-%d")
        print(f"Processing meter data")
        print(f"Processing inverter data")
        print(f"Processing weather station data")
        print(f"[{i}/{len(date_chunks)}] Processing {start_str} to {end_str}")
        
        url = f"{POWERTRACK_CONFIG['base_url']}/{url_site_id}/{POWERTRACK_CONFIG['url_params'].format(start_date=start_str, end_date=end_str)}"
        page.goto(url)
        
        try:
            page.get_by_label("Export Data").locator("svg").click(timeout=180000)
            with page.expect_download() as download_info:
                page.get_by_text("Full Data (CSV)").click(timeout=180000)
            print(f"    Downloaded chunk {i}")
            download = download_info.value
            
            temp_path = download.path()
            df_chunk = pd.read_csv(temp_path) 
            all_dfs.append(df_chunk)
        except Exception as e:
            print(f"    Failed to download chunk {i}: {e}")

    # 3. Process and save data
    if all_dfs:
        print(f"\nProcessing downloaded data...")
        final_df = pd.concat(all_dfs, ignore_index=True)
        print(f"Combined {len(all_dfs)} chunks into {len(final_df)} total records")

        # Create combined CSV file
        csv_filename = f"powertrack_{monitoring_platform_id}_{start_date.strftime('%Y%m%d')}_to_{end_date.strftime('%Y%m%d')}.csv"
        csv_path = os.path.join(downloads_dir, csv_filename)
        
        final_df.to_csv(csv_path, index=False)
        print(f"PowerTrack automation completed successfully")
        print(f"Data saved to: {csv_path}")
        print(f"Total records: {len(final_df)}")
        
    else:
        print("\nNo data was downloaded.")

    context.close()
    browser.close()

if __name__ == "__main__":
    main()
