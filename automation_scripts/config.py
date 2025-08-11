# Locus Energy Automation Configuration

# Login credentials
LOGIN_EMAIL = "jhao@aspenpower.com"
LOGIN_PASSWORD = "Aspen2025"

# Default site settings
DEFAULT_SITE = "USG1"

# Browser settings
HEADLESS_MODE = False  # Set to True to run without browser window
SLOW_MO = 500  # Milliseconds delay between actions (0 for fastest)

# Timeout settings (in milliseconds)
PAGE_LOAD_TIMEOUT = 30000
ELEMENT_WAIT_TIMEOUT = 5000

# Data selection preferences
DATA_FIELD = "AC Energy (kWh)"  # The specific data field to download

# File naming
CSV_FILENAME_TEMPLATE = "{site}_ac_energy_data_{timestamp}.csv"
LOG_FILENAME_TEMPLATE = "automation_{timestamp}.log"

# Directories
LOGS_BASE_DIR = "locus_automation" 