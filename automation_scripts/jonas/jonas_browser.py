# -*- coding: utf-8 -*-

# Fix Windows console encoding for Unicode characters
import sys
import os
import io
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    # Force UTF-8 encoding for stdout and stderr
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import re
import pandas as pd
import smtplib
import time
import json
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from playwright.sync_api import Playwright, sync_playwright, expect
from typing import Optional, List

try:
    from bs4 import BeautifulSoup
    BEAUTIFULSOUP_AVAILABLE = True
except ImportError:
    BEAUTIFULSOUP_AVAILABLE = False
    print("Warning: BeautifulSoup not available. HTML to Excel conversion will be limited.")


class JonasBrowser:
    """Browser automation class for Jonas Premier cloud application."""
    
    def __init__(self, playwright: Playwright, headless: bool = False):
        self.playwright = playwright
        self.headless = headless
        self.browser = None
        self.context = None
        self.page = None
        # Generate unique timestamp for this session
        self.timestamp = str(int(time.time() * 1000))
        # Load credentials from config file
        self.credentials = self._load_credentials()
        self.start_browser()
        
    def _load_credentials(self):
        """Load credentials from the centralized config file."""
        try:
            config_path = os.path.join(os.path.dirname(__file__), 'jonas_credentials.json')
            with open(config_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print("Warning: jonas_credentials.json not found, using fallback defaults")
            return {
                "clientId": "121297",
                "username": "SLiu", 
                "password": "AspenPower123-"
            }
        except Exception as e:
            print(f"Warning: Error loading credentials: {e}, using fallback defaults")
            return {
                "clientId": "121297",
                "username": "SLiu", 
                "password": "AspenPower123-"
            }
        
    def start_browser(self):
        """Initialize browser, context and page."""
        self.browser = self.playwright.chromium.launch(headless=self.headless)
        self.context = self.browser.new_context()
        self.page = self.context.new_page()
        
    def cleanup(self):
        """Clean up browser resources."""
        if self.context:
            self.context.close()
        if self.browser:
            self.browser.close()
            
    def login(self, client_id: str = None, username: str = None, password: str = None):
        """
        Login to Jonas Premier cloud application.
        
        Args:
            client_id: Client ID for login (uses config if None)
            username: Username for login (uses config if None)
            password: Password for login (uses config if None)
        """
        # Use provided credentials or fall back to config
        client_id = client_id or self.credentials["clientId"]
        username = username or self.credentials["username"]
        password = password or self.credentials["password"]
        self.page.goto("https://cloud.jonas-premier.com/")
        
        # Fill login form
        login_frame = self.page.locator("#loginContainer").content_frame
        login_frame.get_by_role("textbox", name="Client ID").fill(client_id)
        login_frame.get_by_role("textbox", name="Username").fill(username)
        login_frame.get_by_role("textbox", name="Password").fill(password)
        login_frame.get_by_role("button", name="Log in").click()
        
        # Navigate to processing section
        app_frame = self.page.locator("#appContainer").content_frame
        app_frame.locator("#UserPlugin").click()
        app_frame.get_by_role("listitem", name="Processing").get_by_role("img").click()
        
    def get_vendors(self, vendor_names: List[str]) -> Optional[str]:
        """
        Navigate to vendor inquiry and download vendor data for multiple vendors.
        
        Args:
            vendor_names: List of vendor names to search for and select
            
        Returns:
            Path to downloaded file if successful
        """
        app_frame = self.page.locator("#appContainer").content_frame
        
        # Navigate to vendor inquiry - Fixed search menu timing issue
        search_menu = app_frame.get_by_role("textbox", name="Search Menu")
        search_menu.click()
        search_menu.fill("")  # Clear first
        search_menu.type("vendor", delay=100)  # Type slowly to trigger search
        
        # Wait for the dropdown to populate and option to appear
        try:
            # Wait for the AP-Vendor Inquiry option to be visible
            vendor_option = app_frame.get_by_role("option", name="AP-Vendor Inquiry")
            vendor_option.wait_for(state="visible", timeout=10000)
            vendor_option.click()
        except Exception as e:
            print(f"First attempt failed: {e}")
            # Retry by typing again
            search_menu.fill("")
            search_menu.type("vendor", delay=150)
            vendor_option = app_frame.get_by_role("option", name="AP-Vendor Inquiry")
            vendor_option.wait_for(state="visible", timeout=10000)
            vendor_option.click()
        
        # Click on the vendor selection area (this opens the vendor selection dialog)
        try:
            vendor_link = app_frame.get_by_role("gridcell", name="Also Energy").locator("a")
            vendor_link.wait_for(state="visible", timeout=5000)
            vendor_link.click()
        except Exception as e:
            print(f"Could not find 'Also Energy' link, trying alternative approach: {e}")
            # Try to find any vendor link to open the dialog
            vendor_links = app_frame.locator("a").filter(has_text="")
            if vendor_links.count() > 0:
                vendor_links.first.click()
            else:
                raise Exception("Could not find any vendor link to open selection dialog")
        
        # Process each vendor
        vendors_selected = []
        print(f"\nStarting vendor selection process for {len(vendor_names)} vendors")
        for vendor_index, vendor_name in enumerate(vendor_names):
            print(f"\nProcessing vendor {vendor_index + 1}/{len(vendor_names)}: '{vendor_name}'")
            
            try:
                # Clear search box and search for current vendor
                search_box = app_frame.locator("#VendorId_searchbox")
                search_box.wait_for(state="visible", timeout=5000)
                search_box.click()
                search_box.fill("")  # Clear first
                
                # Type vendor name slowly to ensure search triggers
                # Try searching with original case first
                search_box.type(vendor_name, delay=50)
                
                # Wait for search results to populate
                try:
                    self.page.wait_for_timeout(1500)  # Give more time for search results
                except Exception:
                    # Page might have navigated, continue anyway
                    pass
                
                # Try to find and select the vendor checkbox
                # More flexible approach to find the vendor row
                vendor_row = None
                
                # Debug: Show available vendors in search results
                try:
                    print(f"  Searching for vendor: '{vendor_name}'")
                    available_rows = app_frame.locator("tr[role='row'], tr.k-grid-row, tr").all()
                    print(f"  Found {len(available_rows)} rows in search results")
                    if len(available_rows) > 1:  # Skip header row
                        print(f"  Available vendors in search results:")
                        for i, row in enumerate(available_rows[:10]):  # Show first 10
                            try:
                                row_text = row.text_content()
                                if row_text and len(row_text.strip()) > 0:
                                    print(f"    Row {i}: {row_text.strip()[:150]}")
                            except:
                                pass
                except Exception as debug_e:
                    print(f"  Could not list available vendors: {debug_e}")
                
                # Try multiple approaches to find the vendor
                # 1. Exact name match
                vendor_row = app_frame.get_by_role("row", name=vendor_name)
                
                # 2. Case-insensitive partial match
                if vendor_row.count() == 0:
                    vendor_row = app_frame.locator("tr").filter(has_text=vendor_name)
                
                # 3. Try with different case variations
                if vendor_row.count() == 0:
                    for variation in [vendor_name.upper(), vendor_name.title()]:
                        vendor_row = app_frame.locator("tr").filter(has_text=variation)
                        if vendor_row.count() > 0:
                            break
                
                # 4. Try partial match with just first word
                if vendor_row.count() == 0:
                    first_word = vendor_name.split()[0]
                    vendor_row = app_frame.locator("tr").filter(has_text=first_word)
                
                if vendor_row.count() > 0:
                    try:
                        checkbox = vendor_row.first.get_by_role("checkbox")
                        checkbox.wait_for(state="visible", timeout=2000)
                        checkbox.check()
                        vendors_selected.append(vendor_name)
                        print(f"SUCCESS: Selected vendor: {vendor_name}")
                    except Exception as cb_error:
                        print(f"ERROR: Error checking checkbox for {vendor_name}: {cb_error}")
                else:
                    print(f"ERROR: Could not find vendor: {vendor_name}")
                    
            except Exception as e:
                print(f"ERROR: Error processing vendor {vendor_name}: {e}")
                # Continue with next vendor
        
        print(f"\nVENDOR SELECTION SUMMARY:")
        print(f"  Total vendors requested: {len(vendor_names)}")
        print(f"  Successfully selected: {len(vendors_selected)}")
        print(f"  Selected vendors: {vendors_selected}")
        if len(vendors_selected) < len(vendor_names):
            failed_vendors = [v for v in vendor_names if v not in vendors_selected]
            print(f"  Failed to find: {failed_vendors}")
        
        if not vendors_selected:
            print("\nNo vendors were selected. Aborting download.")
            return None
        
        # Configure report settings
        app_frame.locator("#FromDate").click()
        
        # Handle checkboxes with more robust approach
        try:
            # Check ShowPendingNotsentInvoices
            pending_not_sent = app_frame.locator("#ShowPendingNotsentInvoices")
            if not pending_not_sent.is_checked():
                pending_not_sent.click()
                self.page.wait_for_timeout(500)  # Small wait for state change
        except Exception as e:
            print(f"Warning: Could not check ShowPendingNotsentInvoices: {e}")
        
        try:
            # Check ShowPendingApprovalInvoices
            pending_approval = app_frame.locator("#ShowPendingApprovalInvoices")
            if not pending_approval.is_checked():
                pending_approval.click()
                self.page.wait_for_timeout(500)  # Small wait for state change
        except Exception as e:
            print(f"Warning: Could not check ShowPendingApprovalInvoices: {e}")
            # Try alternative click method
            try:
                app_frame.locator("#ShowPendingApprovalInvoices").dispatch_event("click")
            except:
                print("Alternative click method also failed")
        
        app_frame.get_by_role("button", name="View Report").click()
        
        # Wait for the report to load before trying to export
        try:
            # First, wait for any loading masks to disappear
            print("Waiting for report to load...")
            try:
                loading_mask = app_frame.locator(".k-loading-mask, .k-loading-image")
                loading_mask.wait_for(state="hidden", timeout=45000)
                print("Loading mask cleared")
            except:
                print("No loading mask found or already cleared")
            
            # Additional wait to ensure report is fully rendered
            self.page.wait_for_timeout(2000)
            
            # Wait for the Excel button to be available and stable
            excel_button = app_frame.get_by_role("button", name="Excel")
            excel_button.wait_for(state="visible", timeout=30000)
            
            # # Wait for report data to actually load - look for table or data indicators
            # try:
            #     # Try to wait for some data to appear in the report
            #     app_frame.locator("table, .k-grid-content, .report-content").first.wait_for(state="visible", timeout=10000)
            #     print("Report data appears to be loaded")
            # except:
            #     print("Could not detect report data loading, proceeding anyway")
            
            # self.page.wait_for_timeout(5000)  # Additional wait for report to fully load
        except Exception as e:
            print(f"Warning: Could not verify Excel button availability: {e}")
        
        # Download Excel report
        try:
            # Create output directory if it doesn't exist
            # Use absolute path to avoid nested directory creation
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            output_dir = os.path.join(project_root, "automation_scripts", "jonas", "output")
            os.makedirs(output_dir, exist_ok=True)
            
            # Debug: Check what export buttons are available
            print("Checking available export options...")
            export_buttons = app_frame.locator("button").filter(has_text=re.compile(r"excel|export|download", re.IGNORECASE))
            count = export_buttons.count()
            print(f"Found {count} potential export buttons")
            for i in range(count):
                try:
                    btn_text = export_buttons.nth(i).text_content()
                    # Clean the text - remove newlines and extra spaces
                    btn_text = ' '.join(btn_text.split())
                    print(f"  Button {i}: '{btn_text}'")
                except Exception as e:
                    print(f"  Button {i}: Could not read text")
            
            # Try the Excel export
            print("Attempting Excel export...")
            
            # First, try right-clicking the Excel button to see if there are save options
            excel_button = app_frame.get_by_role("button", name="Excel")
            try:
                # Make sure no loading mask is blocking
                try:
                    loading_check = app_frame.locator(".k-loading-mask:visible")
                    if loading_check.count() > 0:
                        print("Loading mask still visible, waiting...")
                        loading_check.wait_for(state="hidden", timeout=30000)
                except:
                    pass
                
                # Try a simple click first
                with self.page.expect_download(timeout=45000) as download_info:
                    excel_button.click()
                    print("Excel button clicked, waiting for download...")
                
                download = download_info.value
                temp_path = download.path()
                print(f"Download received: {temp_path}")
                
                # Check if the downloaded file is actually HTML (common issue with web exports)
                with open(temp_path, 'r', encoding='utf-8', errors='ignore') as f:
                    first_line = f.readline().strip().lower()
                    if first_line.startswith('<html') or '<html>' in first_line:
                        print("Downloaded file appears to be HTML instead of Excel")
                        
                        # Save the HTML file first (original format)
                        html_output_path = os.path.join(output_dir, f"vendor_output_{self.timestamp}.html")
                        download.save_as(html_output_path)
                        print(f"SUCCESS: Saved HTML file to: {html_output_path}")
                        
                        # Try to convert HTML table to Excel using pandas
                        try:
                            print("Attempting to convert HTML table to Excel...")
                            
                            # Try to read all tables from HTML and find the right one
                            tables = pd.read_html(temp_path, header=0)
                            print(f"Found {len(tables)} table(s) in HTML")
                            
                            # Find the largest table (likely to be the main data table)
                            if len(tables) == 0:
                                raise Exception("No tables found in HTML")
                            
                            # Select the table with the most rows and columns
                            main_table = max(tables, key=lambda x: x.shape[0] * x.shape[1])
                            print(f"Selected table with shape: {main_table.shape}")
                            
                            # Clean up the data
                            # Remove completely empty rows
                            main_table = main_table.dropna(how='all')
                            
                            # Clean up column names - remove any HTML artifacts
                            if not main_table.empty:
                                main_table.columns = main_table.columns.astype(str)
                                # Replace any NaN or problematic column names
                                new_columns = []
                                for i, col in enumerate(main_table.columns):
                                    if pd.isna(col) or col == 'nan' or str(col).strip() == '':
                                        new_columns.append(f'Column_{i+1}')
                                    else:
                                        # Clean column name
                                        clean_col = str(col).strip().replace('\n', ' ').replace('\r', '')
                                        new_columns.append(clean_col)
                                main_table.columns = new_columns
                            
                            excel_output_path = os.path.join(output_dir, f"vendor_output_{self.timestamp}.xlsx")
                            
                            # Save with proper formatting
                            with pd.ExcelWriter(excel_output_path, engine='openpyxl') as writer:
                                main_table.to_excel(writer, sheet_name='Vendor_Data', index=False)
                                
                                # Auto-adjust column widths
                                worksheet = writer.sheets['Vendor_Data']
                                for column in worksheet.columns:
                                    max_length = 0
                                    column_letter = column[0].column_letter
                                    for cell in column:
                                        try:
                                            if len(str(cell.value)) > max_length:
                                                max_length = len(str(cell.value))
                                        except:
                                            pass
                                    adjusted_width = min(max_length + 2, 50)  # Cap at 50 chars
                                    worksheet.column_dimensions[column_letter].width = adjusted_width
                            
                            print(f"SUCCESS: Successfully converted HTML to Excel: {excel_output_path}")
                            print(f"SUCCESS: Table dimensions: {main_table.shape[0]} rows x {main_table.shape[1]} columns")
                            print("\nBoth files saved:")
                            print(f"  - HTML (original): {html_output_path}")
                            print(f"  - Excel (converted): {excel_output_path}")
                            print("You can compare both formats and use whichever works better.")
                            return excel_output_path  # Return Excel path as primary
                            
                        except Exception as convert_error:
                            print(f"Could not convert HTML to Excel: {convert_error}")
                            print("Attempting alternative conversion method...")
                            
                            # Alternative conversion using BeautifulSoup for more control
                            try:
                                if not BEAUTIFULSOUP_AVAILABLE:
                                    raise ImportError("BeautifulSoup not available")
                                
                                with open(temp_path, 'r', encoding='utf-8', errors='ignore') as f:
                                    soup = BeautifulSoup(f.read(), 'html.parser')
                                
                                # Find all tables
                                tables = soup.find_all('table')
                                print(f"Found {len(tables)} table(s) using BeautifulSoup")
                                
                                if tables:
                                    # Get the largest table
                                    largest_table = max(tables, key=lambda t: len(t.find_all('tr')))
                                    
                                    # Extract data
                                    rows = []
                                    for tr in largest_table.find_all('tr'):
                                        row = []
                                        for td in tr.find_all(['td', 'th']):
                                            # Clean cell text
                                            cell_text = td.get_text(strip=True).replace('\n', ' ').replace('\r', '')
                                            row.append(cell_text)
                                        if row:  # Only add non-empty rows
                                            rows.append(row)
                                    
                                    if rows:
                                        # Create DataFrame
                                        df = pd.DataFrame(rows[1:], columns=rows[0] if rows else None)
                                        
                                        excel_output_path = os.path.join(output_dir, f"vendor_output_{self.timestamp}.xlsx")
                                        df.to_excel(excel_output_path, index=False)
                                        
                                        print(f"SUCCESS: Successfully converted HTML to Excel using alternative method: {excel_output_path}")
                                        print(f"SUCCESS: Table dimensions: {df.shape[0]} rows x {df.shape[1]} columns")
                                        return excel_output_path
                                    
                            except ImportError:
                                print("BeautifulSoup not available for alternative conversion")
                            except Exception as alt_error:
                                print(f"Alternative conversion also failed: {alt_error}")
                            
                            print("Only HTML file is available - you can open it in a browser and copy/paste the data.")
                            return html_output_path
                
                # Save to the desired location with the specified filename
                output_path = os.path.join(output_dir, f"vendor_output_{self.timestamp}.xlsx")
                download.save_as(output_path)
                
                print(f"Downloaded vendor report to: {output_path}")
                return output_path
                
            except Exception as click_error:
                print(f"Excel button click failed: {click_error}")
                # Try alternative approach with popup handling
                try:
                    print("Trying alternative approach with popup handling...")
                    with self.page.expect_popup() as page1_info:
                        excel_button.click()
                    page1 = page1_info.value
                    
                    # Try to download from the popup
                    with page1.expect_download() as download_info:
                        page1.wait_for_timeout(2000)  # Wait for popup to load
                    
                    download = download_info.value
                    output_path = os.path.join(output_dir, f"vendor_output_{self.timestamp}.xlsx")
                    download.save_as(output_path)
                    page1.close()
                    
                    print(f"Downloaded vendor report from popup to: {output_path}")
                    return output_path
                    
                except Exception as popup_error:
                    print(f"Popup approach failed: {popup_error}")
                    return None
            
        except Exception as e:
            # Handle encoding errors specifically
            error_msg = str(e)
            if 'codec' in error_msg and 'encode' in error_msg:
                print(f"Failed to download vendor report due to encoding error")
                print(f"ERROR: {error_msg}")
                print("This typically happens when the report contains special characters")
            else:
                print(f"Failed to download vendor report: {error_msg}")
            return None
        
    def get_accounts(self, account_code: str = "401005", start_date: str = "05-01-2025", end_date: str = "06-01-2025", skip_navigation: bool = False) -> Optional[str]:
        """
        Navigate to GL transactions and download account data.
        
        Args:
            account_code: GL account code to query
            start_date: Start date for transaction range (MM-DD-YYYY)
            end_date: End date for transaction range (MM-DD-YYYY)
            skip_navigation: If True, skips the General Ledger navigation (for subsequent accounts)
            
        Returns:
            Path to downloaded file if successful
        """
        app_frame = self.page.locator("#appContainer").content_frame
        
        # Navigate to GL transactions (only if not skipping)
        if not skip_navigation:
            print("Navigating to GL Transactions...")
            try:
                app_frame.get_by_role("listitem", name="Processing").locator("path").click()
                app_frame.get_by_text("General Ledger").click()
                # Use first() to avoid strict mode violation when multiple elements exist
                app_frame.get_by_text("GL Transactions").first.click()
                
                # Wait for the GL Transactions page to fully load
                print("Waiting for GL Transactions page to load...")
                self.page.wait_for_timeout(3000)  # Give extra time for first page load
                
                # Wait for the form elements to be available
                try:
                    app_frame.locator("#GLBudgetTransaction").wait_for(state="visible", timeout=10000)
                    print("GL Transactions form is now visible")
                except Exception as form_wait_e:
                    print(f"Warning: GL form may not be fully loaded: {form_wait_e}")
                    
            except Exception as nav_e:
                print(f"Error during navigation: {nav_e}")
                raise
        else:
            print("Skipping GL navigation - already on GL Transactions page")
        
        # Set account code with enhanced debugging and fallback strategies
        print(f"Setting account code to: {account_code}")
        
        try:
            # First, try to find and clear the account combobox
            print("Looking for account combobox...")
            comboboxes = app_frame.get_by_role("combobox")
            combobox_count = comboboxes.count()
            print(f"Found {combobox_count} comboboxes")
            
            if combobox_count > 1:
                account_combobox = comboboxes.nth(1)  # Usually the second one
            elif combobox_count > 0:
                account_combobox = comboboxes.first
            else:
                print("No comboboxes found, trying alternative selectors...")
                # Try alternative selectors for account input
                account_combobox = app_frame.locator("input[role='combobox']").nth(1)
            
            print("Clicking and clearing account combobox...")
            account_combobox.click()
            account_combobox.fill("")  # Clear first
            
            print(f"Typing account code: {account_code}")
            account_combobox.type(str(account_code), delay=150)  # Type a bit slower
            
            # Wait longer for autocomplete dropdown to populate
            print("Waiting for dropdown to populate...")
            self.page.wait_for_timeout(2000)
            
            # Try multiple strategies to select the account from dropdown
            account_selected = False
            
            # Strategy 1: Look for exact text match with better visibility check
            print("Strategy 1: Looking for exact text match...")
            try:
                dropdown_options = app_frame.get_by_text(str(account_code))
                option_count = dropdown_options.count()
                print(f"Found {option_count} options with text '{account_code}'")
                
                for i in range(option_count):
                    try:
                        option = dropdown_options.nth(i)
                        # Check if option is visible
                        if option.is_visible():
                            print(f"Option {i} is visible, attempting click...")
                            option.click()
                            account_selected = True
                            print(f"SUCCESS: Successfully selected account via strategy 1")
                            break
                        else:
                            print(f"Option {i} is not visible")
                    except Exception as opt_e:
                        print(f"Option {i} click failed: {opt_e}")
                        continue
                        
            except Exception as s1_e:
                print(f"Strategy 1 failed: {s1_e}")
            
            # Strategy 2: Try to find dropdown options by role
            if not account_selected:
                print("Strategy 2: Looking for dropdown options by role...")
                try:
                    options = app_frame.get_by_role("option")
                    option_count = options.count()
                    print(f"Found {option_count} dropdown options")
                    
                    for i in range(option_count):
                        try:
                            option = options.nth(i)
                            option_text = option.text_content()
                            print(f"Option {i}: '{option_text}'")
                            
                            if str(account_code) in option_text and option.is_visible():
                                print(f"Found matching option {i}, clicking...")
                                option.click()
                                account_selected = True
                                print(f"SUCCESS: Successfully selected account via strategy 2")
                                break
                        except Exception as opt_e:
                            print(f"Option {i} processing failed: {opt_e}")
                            continue
                            
                except Exception as s2_e:
                    print(f"Strategy 2 failed: {s2_e}")
            
            # Strategy 3: Try pressing Enter to accept the typed value
            if not account_selected:
                print("Strategy 3: Pressing Enter to accept typed value...")
                try:
                    account_combobox.press("Enter")
                    account_selected = True
                    print(f"SUCCESS: Pressed Enter - hoping typed value is accepted")
                except Exception as s3_e:
                    print(f"Strategy 3 failed: {s3_e}")
            
            # Strategy 4: Try pressing Tab to move to next field (might auto-accept)
            if not account_selected:
                print("Strategy 4: Pressing Tab to move to next field...")
                try:
                    account_combobox.press("Tab")
                    account_selected = True
                    print(f"SUCCESS: Pressed Tab - hoping typed value is accepted")
                except Exception as s4_e:
                    print(f"Strategy 4 failed: {s4_e}")
            
            # Strategy 5: Click elsewhere to close dropdown and check if value stuck
            if not account_selected:
                print("Strategy 5: Clicking elsewhere to close dropdown...")
                try:
                    # Click on a label or safe area to close dropdown
                    app_frame.locator("label").first.click()
                    self.page.wait_for_timeout(500)
                    
                    # Check if the account code value is still in the combobox
                    current_value = account_combobox.input_value()
                    print(f"Current combobox value after clicking away: '{current_value}'")
                    
                    if str(account_code) in current_value:
                        account_selected = True
                        print(f"SUCCESS: Account code appears to be set correctly")
                    
                except Exception as s5_e:
                    print(f"Strategy 5 failed: {s5_e}")
            
            if not account_selected:
                print(f"⚠️ Warning: Could not confirm account selection, but typed value might be sufficient")
                print(f"Proceeding with current value in combobox...")
            else:
                print(f"SUCCESS: Account {account_code} successfully selected!")
            
            # Final validation: Check if account code is actually in the combobox
            try:
                final_value = account_combobox.input_value()
                print(f"Final combobox value: '{final_value}'")
                if not final_value or str(account_code) not in final_value:
                    print(f"❌ Account code validation failed! Expected '{account_code}', got '{final_value}'")
                    print("This will likely cause the download to fail - no data for this account")
                    return None
                else:
                    print(f"SUCCESS: Account code validation passed: '{final_value}'")
            except Exception as val_e:
                print(f"Could not validate final account value: {val_e}")
                 
        except Exception as e:
            print(f"❌ Error in account selection process: {e}")
            print("Attempting to continue anyway...")
        
        # Use more reliable selectors based on the GLBudgetTransaction container
        try:
            print("Looking for date inputs...")
            
            # Strategy 1: Use the GLBudgetTransaction container as anchor
            gl_container = app_frame.locator("#GLBudgetTransaction")
            
            # Find all date inputs within the GL container
            date_inputs = gl_container.locator("input.k-input")
            date_input_count = date_inputs.count()
            print(f"Found {date_input_count} date inputs in GL container")
            
            if date_input_count >= 2:
                # First date input should be start date
                start_date_input = date_inputs.nth(0)
                start_date_input.click()
                start_date_input.fill("")  # Clear first
                start_date_input.fill(start_date)
                print(f"Set start date to: {start_date}")
                
                # Second date input should be end date  
                end_date_input = date_inputs.nth(1)
                end_date_input.click()
                end_date_input.fill("")  # Clear first
                end_date_input.fill(end_date)
                print(f"Set end date to: {end_date}")
                
            else:
                print("Not enough date inputs found, trying alternative selectors...")
                
                # Strategy 2: Use CSS selectors based on the structure you provided
                selectors_to_try = [
                    "#GLBudgetTransaction > div.premier-form.expand.clearfix > div > div:nth-child(1) > span > span > input",  # Start date
                    "#GLBudgetTransaction > div.premier-form.expand.clearfix > div > div:nth-child(3) > span > span > input",  # End date (try 3rd child)
                    "#GLBudgetTransaction > div.premier-form.expand.clearfix > div > div:nth-child(2) > span > span > input",  # End date (try 2nd child)
                ]
                
                # Try to find start date
                start_date_set = False
                for i, selector in enumerate(selectors_to_try):
                    try:
                        input_elem = app_frame.locator(selector)
                        input_elem.wait_for(state="visible", timeout=3000)
                        input_elem.click()
                        input_elem.fill("")
                        input_elem.fill(start_date if i == 0 else end_date)
                        print(f"Successfully used selector {i}: {selector}")
                        if i == 0:
                            start_date_set = True
                        break
                    except Exception as sel_e:
                        print(f"Selector {i} failed: {sel_e}")
                        continue
                
                # Strategy 3: Try XPath with GLBudgetTransaction as anchor
                if not start_date_set:
                    xpath_selectors = [
                        "//*[@id='GLBudgetTransaction']//input[@class='k-input xm is-already-selected']",
                        "//*[@id='GLBudgetTransaction']//input[contains(@class,'k-input')]",
                        "//*[@id='GLBudgetTransaction']/div[1]/div/div[1]/span/span/input",  # From your example
                    ]
                    
                    for xpath in xpath_selectors:
                        try:
                            inputs = app_frame.locator(f"xpath={xpath}")
                            input_count = inputs.count()
                            print(f"XPath {xpath} found {input_count} inputs")
                            
                            if input_count >= 1:
                                # Set start date
                                inputs.nth(0).click()
                                inputs.nth(0).fill("")
                                inputs.nth(0).fill(start_date)
                                print(f"Set start date via XPath: {start_date}")
                                
                                if input_count >= 2:
                                    # Set end date
                                    inputs.nth(1).click() 
                                    inputs.nth(1).fill("")
                                    inputs.nth(1).fill(end_date)
                                    print(f"Set end date via XPath: {end_date}")
                                break
                                
                        except Exception as xpath_e:
                            print(f"XPath {xpath} failed: {xpath_e}")
                            continue
                            
        except Exception as date_e:
            print(f"Error setting dates: {date_e}")
            print("Attempting final fallback with dynamic XPath...")
            
            # Final fallback: Try to find any date inputs on the page
            try:
                all_date_inputs = app_frame.locator("input.k-input")
                total_inputs = all_date_inputs.count()
                print(f"Found {total_inputs} total k-input elements on page")
                
                # Look for the last 2 date inputs (likely to be the ones we want)
                if total_inputs >= 2:
                    start_idx = max(0, total_inputs - 2)
                    end_idx = total_inputs - 1
                    
                    all_date_inputs.nth(start_idx).click()
                    all_date_inputs.nth(start_idx).fill(start_date)
                    print(f"Fallback: Set start date at index {start_idx}")
                    
                    all_date_inputs.nth(end_idx).click()
                    all_date_inputs.nth(end_idx).fill(end_date)
                    print(f"Fallback: Set end date at index {end_idx}")
                    
            except Exception as fallback_e:
                print(f"Final fallback also failed: {fallback_e}")
                # Continue anyway - maybe the form already has correct dates
        
        # Configure and export with better validation
        print("Configuring report settings...")
        app_frame.locator("#GLBudgetTransaction").click()
        
        # Wait a moment for the form to settle
        self.page.wait_for_timeout(1000)
        
        # Check if Export button is available and enabled
        print("Checking Export to Excel button availability...")
        try:
            export_button = app_frame.get_by_role("button", name="Export to Excel")
            export_button.wait_for(state="visible", timeout=10000)
            
            # Check if button is enabled (not disabled)
            if export_button.is_enabled():
                print("SUCCESS: Export button is available and enabled")
            else:
                print("⚠️ Export button is disabled - this might indicate form issues")
                
        except Exception as btn_e:
            print(f"❌ Export button not found or not available: {btn_e}")
            print("This likely means the form is not properly filled out")
            return None
        
        # Create output directory if it doesn't exist
        # Use absolute path to avoid nested directory creation
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        output_dir = os.path.join(project_root, "automation_scripts", "jonas", "output")
        os.makedirs(output_dir, exist_ok=True)
        
        print("Attempting to download report...")
        try:
            with self.page.expect_download(timeout=45000) as download_info:  # Increased timeout
                export_button.click()
                print("Export button clicked, waiting for download...")
            
            download = download_info.value
            print(f"SUCCESS: Download received successfully")
            
            # Save to proper output directory
            output_path = os.path.join(output_dir, f"account_{account_code}_output.xlsx")
            download.save_as(output_path)
            
            print(f"Downloaded account report to: {output_path}")
            return output_path
            
        except Exception as download_e:
            print(f"❌ Download failed: {download_e}")
            print("This usually means:")
            print("  - Account code was not properly set")
            print("  - No data exists for the specified account/date range")
            print("  - Form validation failed")
            return None


def read_excel_data(file_path: str) -> tuple:
    """
    Read vendor names and account data from Excel file.
    
    Args:
        file_path: Path to the Excel file
        
    Returns:
        Tuple of (vendor_names, account_data)
        where account_data is a list of dicts with keys: 'code', 'start_date', 'end_date'
    """
    try:
        # Read vendor names from sheet (corrected sheet name)
        vendor_df = pd.read_excel(file_path, sheet_name='Vendor Name Example')
        vendor_names = vendor_df.iloc[:, 0].dropna().tolist()  # First column
        
        # Read account data from sheet (account code, start date, end date)
        account_df = pd.read_excel(file_path, sheet_name='Account Code Example')
        account_data = []
        
        for index, row in account_df.iterrows():
            if pd.notna(row.iloc[0]):  # Check if account code exists
                # Handle date columns more carefully - they might be formatted as dates
                start_date = "05-01-2025"  # Default
                end_date = "06-01-2025"    # Default
                
                # Try to get start date from column 1 (second column)
                if len(row) > 1 and pd.notna(row.iloc[1]):
                    try:
                        # If it's a datetime, format it
                        if isinstance(row.iloc[1], pd.Timestamp):
                            start_date = row.iloc[1].strftime("%m-%d-%Y")
                        else:
                            # Try to parse as string
                            start_date = str(row.iloc[1])
                            # If it looks like a description, use default
                            if len(start_date) > 20 or any(char.isalpha() for char in start_date[:5]):
                                start_date = "05-01-2025"
                    except:
                        start_date = "05-01-2025"
                
                # Try to get end date from column 2 (third column)  
                if len(row) > 2 and pd.notna(row.iloc[2]):
                    try:
                        # If it's a datetime, format it
                        if isinstance(row.iloc[2], pd.Timestamp):
                            end_date = row.iloc[2].strftime("%m-%d-%Y")
                        else:
                            # Try to parse as string
                            end_date = str(row.iloc[2])
                            # If it looks like a description, use default
                            if len(end_date) > 20 or any(char.isalpha() for char in end_date[:5]):
                                end_date = "06-01-2025"
                    except:
                        end_date = "06-01-2025"
                
                account_info = {
                    'code': row.iloc[0],  # First column: account code
                    'start_date': start_date,
                    'end_date': end_date
                }
                account_data.append(account_info)
        
        return vendor_names, account_data
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        return [], []


def send_email_with_attachment(recipient_email: str, files: List[str], report_type: str):
    """
    Send email with downloaded report files as attachments.
    
    Args:
        recipient_email: Email address to send to
        files: List of file paths to attach
        report_type: Type of report (Vendor or Account)
    """
    # Email configuration - PLEASE UPDATE THESE SETTINGS
    smtp_server = "smtp.gmail.com"  # Change this to your SMTP server
    smtp_port = 587
    sender_email = "UPDATE_WITH_YOUR_EMAIL@gmail.com"  # Change this to your email
    sender_password = "UPDATE_WITH_YOUR_APP_PASSWORD"  # Use app password for Gmail
    
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = f"Jonas Premier {report_type} Report"
        
        # Email body
        if len(files) == 1:
            body = f"""
Hello,

Please find the attached {report_type} report from Jonas Premier.

Report generated on: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}

Best regards,
Jonas Automation System
"""
        else:
            body = f"""
Hello,

Please find the attached {report_type} reports from Jonas Premier.

Number of files: {len(files)}
Report generated on: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}

Files included:
"""
            for i, file_path in enumerate(files, 1):
                filename = os.path.basename(file_path)
                body += f"  {i}. {filename}\n"
            
            body += "\nBest regards,\nJonas Automation System"
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Attach files
        for file_path in files:
            if os.path.exists(file_path):
                filename = os.path.basename(file_path)
                
                with open(file_path, "rb") as attachment:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment.read())
                
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {filename}',
                )
                msg.attach(part)
                print(f"  SUCCESS: Attached: {filename}")
            else:
                print(f"  ERROR: File not found: {file_path}")
        
        # Send email
        print(f"Connecting to SMTP server...")
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        
        text = msg.as_string()
        server.sendmail(sender_email, recipient_email, text)
        server.quit()
        
        print(f"SUCCESS: Email sent successfully to {recipient_email}")
        return True
        
    except Exception as e:
        print(f"ERROR: Failed to send email: {e}")
        print("Please check your email configuration in the send_email_with_attachment function")
        return False


def main(playwright: Playwright):
    """Main function to process vendors or accounts from Excel file."""
    excel_file = "playwright/jonas/request/Name Examples.xlsx"
    
    # Ask user what they want to process
    print("=== Jonas Browser Automation ===")
    print("What would you like to process?")
    print("1. Vendors (AP-Vendor Inquiry)")
    print("2. Accounts (GL Transactions)")
    
    while True:
        choice = input("Enter your choice (1 or 2): ").strip()
        if choice in ['1', '2']:
            break
        print("Invalid choice. Please enter 1 or 2.")
    
    # Ask user who to email the report to
    print("\nWho do you want to email the report to?")
    print("1. tliang@aspenpower.com")
    print("2. mkajoshaj@aspenpower.com")
    
    email_options = {
        '1': 'tliang@aspenpower.com',
        '2': 'mkajoshaj@aspenpower.com'
    }
    
    while True:
        email_choice = input("Enter your choice (1 or 2): ").strip()
        if email_choice in email_options:
            recipient_email = email_options[email_choice]
            print(f"Selected email: {recipient_email}")
            break
        print("Invalid choice. Please enter 1 or 2.")
    
    # Read data from Excel file
    vendor_names, account_data = read_excel_data(excel_file)
    
    # Initialize browser
    jonas = JonasBrowser(playwright, headless=False)
    
    try:
        # Login
        print("\nLogging in...")
        jonas.login()
        
        downloaded_files = []
        
        if choice == '1':
            # Process vendors
            print(f"\n=== Processing Vendors ===")
            print(f"Found {len(vendor_names)} vendors to process:")
            for i, vendor in enumerate(vendor_names):
                print(f"  {i+1}. {vendor}")
            
            if not vendor_names:
                print("No vendor names found in Excel file")
                return
            
            print(f"\nStarting vendor processing...")
            download_file = jonas.get_vendors(vendor_names)
            
            if download_file:
                downloaded_files.append(download_file)
                print(f"SUCCESS: Successfully downloaded vendor report: {download_file}")
            else:
                print("ERROR: Failed to download vendor report")
        
        elif choice == '2':
            # Process accounts
            print(f"\n=== Processing Accounts ===")
            print(f"Found {len(account_data)} accounts to process:")
            for i, account in enumerate(account_data):
                print(f"  {i+1}. Account: {account['code']}, Start: {account['start_date']}, End: {account['end_date']}")
            
            if not account_data:
                print("No account data found in Excel file")
                return
            
            # Process each account with its specific dates
            for i, account in enumerate(account_data):
                print(f"\n--- Processing account {i+1}/{len(account_data)} ---")
                print(f"Account: {account['code']}")
                print(f"Date range: {account['start_date']} to {account['end_date']}")
                
                try:
                    # Skip navigation for accounts after the first one
                    skip_nav = i > 0
                    download_file = jonas.get_accounts(
                        account_code=account['code'],
                        start_date=str(account['start_date']),
                        end_date=str(account['end_date']),
                        skip_navigation=skip_nav
                    )
                    
                    if download_file:
                        downloaded_files.append(download_file)
                        print(f"SUCCESS: Successfully downloaded: {download_file}")
                    else:
                        print(f"ERROR: Failed to download account {account['code']}")
                    
                    # Add delay between accounts to let UI settle
                    if i < len(account_data) - 1:  # Don't wait after the last account
                        print("Waiting 3 seconds before next account...")
                        jonas.page.wait_for_timeout(3000)
                        
                except Exception as e:
                    print(f"ERROR: Error processing account {account['code']}: {e}")
                    # Add delay even on error to let UI recover
                    if i < len(account_data) - 1:
                        jonas.page.wait_for_timeout(2000)
                    # Continue with next account
            
            print(f"\n=== Account Processing Complete ===")
            print(f"Successfully processed {len(downloaded_files)}/{len(account_data)} accounts")
            for file in downloaded_files:
                print(f"  - {file}")
        
        # ===== EMAIL FUNCTIONALITY (COMMENTED OUT FOR DEMO) =====
        # Send email with downloaded files
        if downloaded_files:
            print(f"\n=== Email Feature Available ===")
            report_type = "Vendor" if choice == '1' else "Account"
            print(f"Email feature configured to send {len(downloaded_files)} {report_type.lower()} report(s) to {recipient_email}")
            print("Email functionality is currently disabled for demonstration purposes.")
            print("To enable email sending, uncomment the email code section below.")
            
            # ===== COMMENTED OUT EMAIL SENDING =====
            """
            print(f"Sending {len(downloaded_files)} {report_type.lower()} report(s) to {recipient_email}...")
            
            email_success = send_email_with_attachment(recipient_email, downloaded_files, report_type)
            
            if email_success:
                print(f"SUCCESS: All reports successfully emailed to {recipient_email}")
            else:
                print(f"ERROR: Failed to send email. Files are still available locally:")
                for file in downloaded_files:
                    print(f"  - {file}")
            """
            
            print("\nFiles are available locally:")
            for file in downloaded_files:
                print(f"  - {file}")
        else:
            print("\n=== No Reports to Email ===")
            print("No files were successfully downloaded, so no email would be sent.")
                
    finally:
        jonas.cleanup()


if __name__ == "__main__":
    with sync_playwright() as playwright:
        main(playwright)
