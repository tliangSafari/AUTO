#!/usr/bin/env python3
"""
Multi-Site Locus Energy Data Download Script

This script demonstrates how to use the generalized Playwright solution
to download data from multiple Locus Energy sites with automatic inverter selection.

Usage:
    python run_multi_site.py
"""

from datetime import datetime
from locus_main import run_generalized_locus_download
import logging
import os

# Get the logger (it will use the same configuration as locus_main)
logger = logging.getLogger(__name__)

def main():
    """
    Configure and run data download for multiple Locus Energy sites
    """
    
    # CONFIGURATION - Modify these values for your needs
    
    # List of Locus Energy site IDs to process
    sites = [
        "123456",  # Replace with your actual Locus Energy site IDs
        # Add more site IDs here as needed
        # "789012",
        # "345678",
    ]
    
    # Date range for data collection
    start_date = datetime(2024, 1, 1)   # Start date
    end_date = datetime(2024, 12, 31)   # End date
    
    # Output directory for downloaded data
    data_directory = "locus_downloaded_data"
    
    # API credentials (RECOMMENDED - much more reliable than web scraping)
    # Contact your Locus Energy account manager to get these credentials
    api_credentials = {
        'client_id': 'YOUR_CLIENT_ID',        # Replace with actual client ID
        'client_secret': 'YOUR_CLIENT_SECRET', # Replace with actual client secret
        'username': 'YOUR_USERNAME',           # Your SolarNOC username
        'password': 'YOUR_PASSWORD'            # Your SolarNOC password
    }
    
    # Set to None if you don't have API credentials (will use web interface only)
    # api_credentials = None
    
    logger.info("=== Multi-Site Locus Energy Data Download ===")
    logger.info(f"Sites to process: {sites}")
    logger.info(f"Date range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    logger.info(f"Output directory: {data_directory}")
    
    print("=== Multi-Site Locus Energy Data Download ===")
    print(f"Sites to process: {sites}")
    print(f"Date range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    print(f"Output directory: {data_directory}")
    
    if api_credentials and api_credentials['client_id'] != 'YOUR_CLIENT_ID':
        logger.info("Using API-based download (preferred method)")
        print("Using API-based download (preferred method)")
    else:
        logger.info("Using web interface download (fallback method)")
        print("Using web interface download (fallback method)")
        print("Note: You'll need to manually login when the browser opens")
    
    logger.info("Starting download process...")
    print("\nStarting download process...")
    
    # Run the download process
    try:
        run_generalized_locus_download(
            sites=sites,
            start_date=start_date,
            end_date=end_date,
            data_dir=data_directory,
            api_credentials=api_credentials  # or None for web-only
        )
        logger.info("✅ Download process completed successfully!")
        print("\n✅ Download process completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Error during download process: {e}", exc_info=True)
        print(f"\n❌ Error during download process: {e}")
        print("Please check your configuration and try again.")
        print("Check the logs for detailed error information.")

if __name__ == "__main__":
    main() 