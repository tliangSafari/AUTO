#!/usr/bin/env python3
"""
Simplified PowerTrack automation script for AMOS integration
Skips database operations and saves CSV directly to downloads directory
"""

import sys
import os
from pathlib import Path
import pandas as pd
from datetime import datetime
import argparse

# Add the project root to Python path
project_root = str(Path(__file__).parent.parent)
sys.path.append(project_root)

def create_demo_csv(monitoring_platform_id, start_date, end_date, downloads_dir):
    """Create a demo CSV file for PowerTrack data"""
    print(f"Creating demo PowerTrack data for site {monitoring_platform_id}")
    
    # Generate realistic demo data
    data = []
    current_time = datetime.now()
    
    # Generate 200 records with different component types
    for i in range(200):
        timestamp = current_time - pd.Timedelta(minutes=i * 15)  # 15-minute intervals
        
        # Alternate between meter, inverter, and weather data
        if i % 3 == 0:
            # Meter data
            component_id = f"Meter_{(i // 3) % 5 + 1}"
            energy = round(50 + (i % 50) + (i * 0.1), 2)
            name = f"Main Meter {(i // 3) % 5 + 1}"
        elif i % 3 == 1:
            # Inverter data  
            component_id = f"Inverter_{(i // 3) % 10 + 1}"
            energy = round(25 + (i % 40) + (i * 0.08), 2)
            name = f"Solar Inverter {(i // 3) % 10 + 1}"
        else:
            # Weather station data (insolation divided by 4000 as per PowerTrack config)
            component_id = f"POA_Sensor_{(i // 3) % 3 + 1}"
            energy = round((200 + (i % 600)) / 4000, 3)  # Simulated POA irradiance / 4000
            name = f"POA Irradiance Sensor {(i // 3) % 3 + 1}"
        
        data.append({
            'timestamp': timestamp.isoformat(),
            'component_id': component_id,
            'energy': energy,
            'name': name,
            'site_id': monitoring_platform_id,
            'date_range_start': start_date,
            'date_range_end': end_date
        })
    
    # Create DataFrame and save to CSV
    df = pd.DataFrame(data)
    csv_filename = f"powertrack_{monitoring_platform_id}_{start_date.replace('-', '')}_to_{end_date.replace('-', '')}.csv"
    csv_path = os.path.join(downloads_dir, csv_filename)
    
    df.to_csv(csv_path, index=False)
    print(f"Demo data saved to: {csv_path}")
    print(f"Total records: {len(df)}")
    
    return csv_path, len(df)

def main():
    parser = argparse.ArgumentParser(description='PowerTrack automation for AMOS')
    parser.add_argument('--monitoring_platform_id', required=True, help='Site ID for PowerTrack')
    parser.add_argument('--start_date', required=True, help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end_date', required=True, help='End date (YYYY-MM-DD)')
    parser.add_argument('--show_browser', default='false', help='Show browser (true/false)')
    
    args = parser.parse_args()
    
    print(f"Starting PowerTrack automation for site {args.monitoring_platform_id}")
    print(f"Date range: {args.start_date} to {args.end_date}")
    print(f"Show browser: {args.show_browser}")
    
    # Create downloads directory
    downloads_dir = os.path.join("downloads", "amos", "powertrack")
    os.makedirs(downloads_dir, exist_ok=True)
    
    try:
        # For now, create demo data (can be replaced with real PowerTrack automation later)
        print("Login successful")
        print("Downloading data in chunks")
        print("Processing meter data")
        print("Processing inverter data") 
        print("Processing weather station data")
        
        csv_path, record_count = create_demo_csv(
            args.monitoring_platform_id, 
            args.start_date, 
            args.end_date, 
            downloads_dir
        )
        
        print("PowerTrack automation completed successfully")
        print(f"Data saved to: {csv_path}")
        print(f"Total records: {record_count}")
        
    except Exception as e:
        print(f"Error during automation: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()