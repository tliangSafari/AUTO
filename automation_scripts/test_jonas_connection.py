#!/usr/bin/env python3
"""
Simple test script for Jonas Premier OData connection
"""

import sys
import os

# Add current directory to path to import jonas module
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from jonas import JonasPremierODataExtractor, extract_with_requests
    import logging
    
    # Set up logging for this test
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    logger = logging.getLogger(__name__)
    
    def quick_test():
        """Quick connection test"""
        print("Jonas Premier OData Quick Connection Test")
        print("=" * 45)
        
        # Get credentials
        base_url = input("Enter Jonas Premier OData URL: ").strip()
        username = input("Enter Username: ").strip()
        
        import getpass
        password = getpass.getpass("Enter Password: ")
        
        if not all([base_url, username, password]):
            print("Error: All fields are required")
            return
        
        print("\nTesting connection...")
        
        # Create extractor
        extractor = JonasPremierODataExtractor(base_url, username, password)
        
        # Test basic connectivity
        if extractor.test_connection():
            print("✅ Basic HTTP connection successful")
            
            # Get service info
            info = extractor.get_service_info()
            print(f"Service status: {info.get('status', 'unknown')}")
            print(f"Metadata size: {info.get('metadata_size', 0)} bytes")
            
            # Try OData client
            if extractor.connect():
                print("✅ OData client connection successful")
                
                entities = extractor.get_available_entities()
                if entities:
                    print(f"Found {len(entities)} entities:")
                    for i, entity in enumerate(entities[:10], 1):
                        print(f"  {i}. {entity}")
                    if len(entities) > 10:
                        print(f"  ... and {len(entities) - 10} more")
                else:
                    print("❌ No entities found")
            else:
                print("❌ OData client connection failed")
        else:
            print("❌ Basic HTTP connection failed")
        
        print("\nTest completed!")
    
    if __name__ == "__main__":
        quick_test()
        
except ImportError as e:
    print(f"Error importing modules: {e}")
    print("Make sure to install requirements: pip install -r requirements_jonas.txt")
except Exception as e:
    print(f"Error running test: {e}") 