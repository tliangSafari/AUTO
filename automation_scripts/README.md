# Locus Energy Data Automation

A clean, simple, and modular automation system for downloading AC Energy data from Locus Energy sites.

## Features

✅ **Automatic Login** - Logs into Locus Energy automatically  
✅ **Smart Inverter Selection** - Finds and selects all available inverters without hardcoding  
✅ **AC Energy Data** - Specifically selects AC Energy (kWh) data (not reactive or apparent power)  
✅ **CSV Download** - Automatically downloads data as CSV  
✅ **Multi-Site Support** - Process multiple sites in batch  
✅ **Clean Logging** - Comprehensive logs with screenshots  
✅ **Modular Design** - Easy to customize and extend  

## Quick Start

### Single Site
```bash
python locus_automation.py
```

### Multiple Sites (Batch)
```bash
python batch_automation.py
```

## Files

- **`locus_automation.py`** - Main automation script (single site)
- **`batch_automation.py`** - Batch processing for multiple sites  
- **`config.py`** - Configuration settings
- **`README.md`** - This documentation

## Configuration

Edit `config.py` to customize:

```python
# Login credentials
LOGIN_EMAIL = "your-email@example.com"
LOGIN_PASSWORD = "your-password"

# Default site
DEFAULT_SITE = "USG1"

# Browser settings
HEADLESS_MODE = False  # Set True to run without browser window
```

## Usage Examples

### Basic Usage
```python
from locus_automation import LocusEnergyAutomation

# Create automation instance
automation = LocusEnergyAutomation(site_name="USG1")

# Run automation
success = automation.run_automation()
```

### Custom Configuration
```python
# Run in headless mode for a different site
automation = LocusEnergyAutomation(
    site_name="EAGLE_CREEK", 
    headless=True
)
success = automation.run_automation(
    email="custom@email.com",
    password="custom_password"
)
```

### Batch Processing
```python
from batch_automation import run_batch_automation

sites = ["USG1", "USG2", "EAGLE_CREEK"]
results = run_batch_automation(sites, headless=True)
```

## Output

The automation creates timestamped directories with:

```
locus_automation/
└── logs_20250527_175018/
    ├── automation_20250527_175018.log    # Detailed logs
    ├── usg1_ac_energy_data_20250527_175018.csv  # Downloaded data
    ├── 01_site_loaded.png                # Screenshots
    ├── 02_inverters_selected.png
    ├── 03_ac_energy_selected.png
    ├── 04_added_to_chart.png
    └── 05_csv_downloaded.png
```

## Process Flow

1. **🔐 Login** - Automatic login to Locus Energy
2. **🎯 Navigate** - Go to site-specific charting page  
3. **⚡ Select Inverters** - Find and select all available inverters
4. **🔋 Select AC Energy** - Choose AC Energy (kWh) data field
5. **➕ Add to Chart** - Add selection to chart
6. **📥 Download CSV** - Export and save data

## Error Handling

- Comprehensive error logging
- Screenshots at each step for debugging
- Graceful failure handling
- Detailed success/failure reporting

## Requirements

- Python 3.7+
- Playwright
- Valid Locus Energy credentials

## Installation

```bash
pip install playwright
playwright install chromium
```

## Troubleshooting

1. **Login Issues**: Check credentials in `config.py`
2. **Site Not Found**: Verify site name is correct
3. **No Inverters**: Check if site has inverters or try different site
4. **Download Fails**: Ensure sufficient permissions for file creation

## Advanced Usage

### Custom Data Fields

To select different data fields, modify the `select_ac_energy()` method:

```python
def select_custom_data(self, page, data_field="DC Power (kW)"):
    # Custom implementation for different data fields
    pass
```

### Different Date Ranges

Modify the URL construction in `navigate_to_site()`:

```python
site_url = f"https://locusnoc.datareadings.com/charting?start=2024-01-01T00-00-00&end=2024-12-31T23-59-59&q={self.site_name.lower()}"
```

## Success Rate

The automation has been tested and works reliably with:
- ✅ USG1 site (8 inverters)
- ✅ AC Energy (kWh) data selection
- ✅ CSV download functionality
- ✅ Comprehensive error handling

---

**Note**: This automation replaces the previous complex `test_tree_expansion.py` and `locus_main.py` with a clean, simple, and maintainable solution. 