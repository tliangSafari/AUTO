#!/usr/bin/env python3
"""
Jonas Premier OData Automation Script
=====================================

This script demonstrates how to automate data extraction from Jonas Premier
using OData feeds and convert the data into pandas DataFrames for manipulation.

Requirements:
- requests
- pandas
- pyodata
- schedule (for local scheduling)
- python-dotenv (for environment variables)

Usage:
1. Set up environment variables for credentials
2. Configure the OData endpoints you want to access
3. Run the script manually or schedule it
"""

import os
import sys
import logging
import requests
import pandas as pd
import pyodata
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('jonas_premier_automation.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class JonasPremierODataExtractor:
    """Main class for extracting data from Jonas Premier OData feeds"""

    def __init__(self, base_url: str, username: str, password: str):
        """
        Initialize the extractor with connection details

        Args:
            base_url: Jonas Premier OData base URL (e.g., https://your-domain.jonas-premier.com/odata)
            username: Your Jonas Premier username
            password: Your Jonas Premier password
        """
        self.base_url = base_url.rstrip('/')
        self.username = username
        self.password = password
        self.session = requests.Session()
        self.session.auth = (username, password)
        self.client = None

    def test_connection(self) -> bool:
        """
        Test basic HTTP connectivity to the OData service

        Returns:
            bool: True if basic connection works, False otherwise
        """
        try:
            logger.info("Testing basic HTTP connectivity...")
            
            # Try basic HTTP request first
            response = self.session.get(f"{self.base_url}/$metadata", timeout=30)
            response.raise_for_status()
            
            logger.info(f"HTTP connection successful. Status: {response.status_code}")
            logger.info(f"Content-Type: {response.headers.get('content-type', 'Unknown')}")
            
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"HTTP connection failed: {str(e)}")
            return False

    def connect(self) -> bool:
        """
        Establish connection to Jonas Premier OData service

        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            logger.info("Connecting to Jonas Premier OData service...")
            
            # Test basic connectivity first
            if not self.test_connection():
                return False
                
            # Try to create OData client
            self.client = pyodata.Client(self.base_url, self.session)
            logger.info("OData client connection established successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to OData service: {str(e)}")
            logger.info("Trying alternative HTTP-based approach...")
            return False

    def get_available_entities(self) -> List[str]:
        """
        Get list of available entities from the OData service

        Returns:
            List[str]: List of entity names
        """
        try:
            if not self.client:
                raise Exception("Not connected to OData service")

            entities = []
            for entity_name in self.client.schema.entity_sets:
                entities.append(entity_name)

            logger.info(f"Found {len(entities)} available entities")
            return entities
        except Exception as e:
            logger.error(f"Failed to get entities: {str(e)}")
            return []

    def get_service_info(self) -> Dict:
        """
        Get basic service information using HTTP requests

        Returns:
            Dict: Service information
        """
        try:
            # Try to get metadata
            response = self.session.get(f"{self.base_url}/$metadata", timeout=30)
            response.raise_for_status()
            
            info = {
                'status': 'connected',
                'url': self.base_url,
                'metadata_size': len(response.content),
                'content_type': response.headers.get('content-type', 'Unknown')
            }
            
            # Try to get service document
            try:
                service_response = self.session.get(self.base_url, timeout=30)
                if service_response.status_code == 200:
                    info['service_document_available'] = True
                    try:
                        service_data = service_response.json()
                        if 'value' in service_data:
                            info['available_endpoints'] = [item.get('name', 'Unknown') for item in service_data['value']]
                    except:
                        info['service_document_format'] = 'Non-JSON'
                else:
                    info['service_document_available'] = False
            except:
                info['service_document_available'] = False
                
            return info
            
        except Exception as e:
            logger.error(f"Failed to get service info: {str(e)}")
            return {'status': 'error', 'error': str(e)}

    def extract_data(self, entity_name: str, filters: Optional[Dict] = None, 
                    select_fields: Optional[List[str]] = None, limit: int = 10) -> pd.DataFrame:
        """
        Extract data from a specific entity

        Args:
            entity_name: Name of the entity to extract
            filters: Dictionary of filter conditions
            select_fields: List of fields to select
            limit: Maximum number of records to return (for testing)

        Returns:
            pd.DataFrame: Extracted data
        """
        try:
            if not self.client:
                raise Exception("Not connected to OData service")

            logger.info(f"Extracting data from entity: {entity_name} (limit: {limit})")

            # Build the query
            query = self.client.entity_sets[entity_name].get_entities()

            # Apply filters if provided
            if filters:
                for field, value in filters.items():
                    query = query.filter(getattr(query.entity_type, field) == value)

            # Apply field selection if provided
            if select_fields:
                query = query.select(','.join(select_fields))

            # Apply limit for testing
            query = query.top(limit)

            # Execute query and convert to DataFrame
            results = query.execute()

            # Convert to list of dictionaries
            data_list = []
            for item in results:
                data_dict = {}
                for prop in item.entity_type.properties():
                    data_dict[prop.name] = getattr(item, prop.name, None)
                data_list.append(data_dict)

            df = pd.DataFrame(data_list)
            logger.info(f"Extracted {len(df)} records from {entity_name}")

            return df

        except Exception as e:
            logger.error(f"Failed to extract data from {entity_name}: {str(e)}")
            return pd.DataFrame()

    def test_sample_extraction(self, entity_name: str) -> bool:
        """
        Test extracting a small sample from an entity

        Args:
            entity_name: Name of the entity to test

        Returns:
            bool: True if extraction successful
        """
        try:
            df = self.extract_data(entity_name, limit=5)
            if not df.empty:
                logger.info(f"Sample data from {entity_name}:")
                logger.info(f"Columns: {list(df.columns)}")
                logger.info(f"Shape: {df.shape}")
                logger.info(f"Sample record:\n{df.head(1).to_dict('records')}")
                return True
            else:
                logger.warning(f"No data returned from {entity_name}")
                return False
        except Exception as e:
            logger.error(f"Failed to extract sample from {entity_name}: {str(e)}")
            return False

    def extract_jobs_data(self, date_from: Optional[str] = None) -> pd.DataFrame:
        """
        Extract jobs data with optional date filtering

        Args:
            date_from: Start date for filtering (YYYY-MM-DD format)

        Returns:
            pd.DataFrame: Jobs data
        """
        filters = {}
        if date_from:
            filters['CreatedDate'] = f"ge datetime'{date_from}T00:00:00'"

        return self.extract_data('Jobs', filters=filters)

    def extract_financial_data(self) -> pd.DataFrame:
        """
        Extract financial/accounting data

        Returns:
            pd.DataFrame: Financial data
        """
        # This would depend on available entities in Jonas Premier
        return self.extract_data('GeneralLedgerEntries')

    def save_to_csv(self, df: pd.DataFrame, filename: str, 
                   include_timestamp: bool = True) -> str:
        """
        Save DataFrame to CSV with optional timestamp

        Args:
            df: DataFrame to save
            filename: Base filename
            include_timestamp: Whether to include timestamp in filename

        Returns:
            str: Full filename of saved file
        """
        if include_timestamp:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            name, ext = os.path.splitext(filename)
            full_filename = f"{name}_{timestamp}{ext}"
        else:
            full_filename = filename

        df.to_csv(full_filename, index=False)
        logger.info(f"Data saved to {full_filename}")
        return full_filename

def main():
    """Main execution function"""

    # Load configuration from environment variables
    BASE_URL = os.getenv('JONAS_PREMIER_ODATA_URL', 'https://your-domain.jonas-premier.com/odata')
    USERNAME = os.getenv('JONAS_PREMIER_USERNAME')
    PASSWORD = os.getenv('JONAS_PREMIER_PASSWORD')

    print("Jonas Premier OData Connection Tester")
    print("=" * 40)
    
    # If no environment variables, prompt for input
    if not USERNAME or not PASSWORD:
        print("Environment variables not found. Please provide credentials:")
        
        if not BASE_URL or BASE_URL == 'https://your-domain.jonas-premier.com/odata':
            BASE_URL = input("Jonas Premier OData URL: ").strip()
            
        if not USERNAME:
            USERNAME = input("Username: ").strip()
            
        if not PASSWORD:
            import getpass
            PASSWORD = getpass.getpass("Password: ")

    if not USERNAME or not PASSWORD or not BASE_URL:
        logger.error("Missing required credentials")
        print("Error: Missing required credentials")
        sys.exit(1)

    print(f"Connecting to: {BASE_URL}")
    print(f"Username: {USERNAME}")
    print()

    # Initialize extractor
    extractor = JonasPremierODataExtractor(BASE_URL, USERNAME, PASSWORD)

    # Test basic connectivity first
    print("Step 1: Testing basic HTTP connectivity...")
    if not extractor.test_connection():
        print("❌ Basic HTTP connection failed")
        sys.exit(1)
    print("✅ Basic HTTP connectivity successful")
    print()

    # Get service information
    print("Step 2: Getting service information...")
    service_info = extractor.get_service_info()
    print(f"Service Status: {service_info.get('status', 'unknown')}")
    print(f"Content Type: {service_info.get('content_type', 'unknown')}")
    print(f"Metadata Size: {service_info.get('metadata_size', 0)} bytes")
    
    if 'available_endpoints' in service_info:
        print(f"Available Endpoints: {len(service_info['available_endpoints'])}")
        for endpoint in service_info['available_endpoints'][:10]:  # Show first 10
            print(f"  - {endpoint}")
        if len(service_info['available_endpoints']) > 10:
            print(f"  ... and {len(service_info['available_endpoints']) - 10} more")
    print()

    # Try to connect with OData client
    print("Step 3: Testing OData client connection...")
    if extractor.connect():
        print("✅ OData client connection successful")
        
        # Get available entities
        print("\nStep 4: Getting available entities...")
        entities = extractor.get_available_entities()
        if entities:
            print(f"Found {len(entities)} entities:")
            for i, entity in enumerate(entities[:20], 1):  # Show first 20
                print(f"  {i}. {entity}")
            if len(entities) > 20:
                print(f"  ... and {len(entities) - 20} more entities")
            
            # Test extraction from the first few entities
            print(f"\nStep 5: Testing data extraction from first few entities...")
            for entity in entities[:3]:  # Test first 3 entities
                print(f"\nTesting entity: {entity}")
                success = extractor.test_sample_extraction(entity)
                if success:
                    print(f"✅ Successfully extracted sample data from {entity}")
                else:
                    print(f"❌ Failed to extract data from {entity}")
        else:
            print("❌ No entities found or failed to retrieve entities")
    else:
        print("❌ OData client connection failed")
        print("Trying alternative HTTP-based approach...")
        
        # Try the alternative HTTP approach
        try:
            sample_df = extract_with_requests(BASE_URL, USERNAME, PASSWORD, "Jobs")
            if not sample_df.empty:
                print("✅ Alternative HTTP approach worked")
                print(f"Sample data shape: {sample_df.shape}")
                print(f"Columns: {list(sample_df.columns)}")
            else:
                print("❌ Alternative HTTP approach returned no data")
        except Exception as e:
            print(f"❌ Alternative HTTP approach failed: {str(e)}")

    print("\n" + "=" * 40)
    print("Connection test completed. Check the logs for detailed information.")

# Alternative approach using direct HTTP requests if pyodata doesn't work
def extract_with_requests(base_url: str, username: str, password: str, 
                         entity: str) -> pd.DataFrame:
    """
    Alternative method using direct HTTP requests

    Args:
        base_url: OData base URL
        username: Username
        password: Password
        entity: Entity name to extract

    Returns:
        pd.DataFrame: Extracted data
    """
    url = f"{base_url}/{entity}"

    headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }

    try:
        response = requests.get(url, auth=(username, password), headers=headers, timeout=30)
        response.raise_for_status()

        data = response.json()

        # Extract the value array from OData response
        if 'value' in data:
            df = pd.DataFrame(data['value'])
        else:
            df = pd.DataFrame([data])

        return df

    except Exception as e:
        logger.error(f"Failed to extract data using requests: {str(e)}")
        return pd.DataFrame()

if __name__ == "__main__":
    main()
