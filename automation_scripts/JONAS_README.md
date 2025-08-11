# Jonas Premier OData Connection Script

This script connects to Jonas Premier's OData API and allows you to extract data for analysis.

## Issues Fixed

1. **Fixed typo**: `proprties()` → `properties()` on line 129
2. **Added connection testing**: Progressive testing from basic HTTP to full OData
3. **Interactive credentials**: Prompts for credentials if environment variables not set
4. **Better error handling**: More detailed error messages and fallback options
5. **Sample data extraction**: Tests actual data retrieval with small samples
6. **Alternative HTTP method**: Fallback if pyodata client fails

## Installation

1. Install dependencies:
```bash
pip install -r requirements_jonas.txt
```

## Usage

### Method 1: Environment Variables (Recommended)
```bash
export JONAS_PREMIER_ODATA_URL="https://your-domain.jonas-premier.com/odata"
export JONAS_PREMIER_USERNAME="your_username"
export JONAS_PREMIER_PASSWORD="your_password"

python jonas.py
```

### Method 2: Interactive Mode
```bash
python jonas.py
# Script will prompt for credentials
```

### Method 3: Quick Test
```bash
python test_jonas_connection.py
# Simplified test with prompts
```

## What the Script Does

1. **Step 1**: Tests basic HTTP connectivity to the OData endpoint
2. **Step 2**: Retrieves service information and available endpoints
3. **Step 3**: Attempts to connect with the OData client
4. **Step 4**: Lists available entities (data tables)
5. **Step 5**: Tests data extraction from the first few entities

## Common Jonas Premier OData Endpoints

Based on research, Jonas Premier typically provides these entity types:
- Projects/Jobs
- Transactions
- Companies/Vendors
- Employees
- Equipment
- Purchase Orders
- Change Orders

## Expected Output

```
Jonas Premier OData Connection Tester
========================================
Connecting to: https://your-domain.jonas-premier.com/odata
Username: your_username

Step 1: Testing basic HTTP connectivity...
✅ Basic HTTP connectivity successful

Step 2: Getting service information...
Service Status: connected
Content Type: application/xml
Metadata Size: 12345 bytes
Available Endpoints: 15
  - Projects
  - Transactions
  - Companies
  ...

Step 3: Testing OData client connection...
✅ OData client connection successful

Step 4: Getting available entities...
Found 15 entities:
  1. Projects
  2. Transactions
  3. Companies
  ...

Step 5: Testing data extraction from first few entities...
Testing entity: Projects
✅ Successfully extracted sample data from Projects
```

## Troubleshooting

### Common Issues:

1. **Authentication Error**: 
   - Verify username/password
   - Check if account has API access permissions

2. **Connection Timeout**:
   - Check firewall/network settings
   - Verify the OData URL is correct

3. **SSL/Certificate Issues**:
   - Add SSL verification bypass for testing (not recommended for production)

4. **No Entities Found**:
   - Account may not have permission to access entities
   - OData service may not be enabled

### If pyodata fails:
The script includes a fallback HTTP method that makes direct REST calls to the OData endpoints.

## Security Notes

- Never commit credentials to version control
- Use environment variables for production
- Consider using service accounts for API access
- The script includes basic authentication - ensure HTTPS is used

## Next Steps

Once connection is verified:
1. Identify the entities you need (Projects, Transactions, etc.)
2. Modify the extraction methods for your specific needs
3. Add filtering and date ranges for production use
4. Set up automated scheduling if needed

## Support

Check the log file `jonas_premier_automation.log` for detailed error information. 