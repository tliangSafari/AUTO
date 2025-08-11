#!/usr/bin/env python3
"""
Locus Energy Data Automation Script

This script automatically:
1. Logs into Locus Energy
2. Selects all available inverters for a site
3. Selects AC Energy (kWh) data
4. Downloads CSV data

Usage:
    python locus_automation.py
"""

from playwright.sync_api import sync_playwright
import os
import logging
from datetime import datetime
import time
import pandas as pd


def daterange_chunks(start_date, end_date, weeks=1):
    """Generate date ranges in weekly chunks to avoid overwhelming the system"""
    starts = pd.date_range(start=start_date, end=end_date, freq=f'{weeks}W')
    if starts[-1] < pd.to_datetime(end_date):
        starts = starts.append(pd.DatetimeIndex([pd.to_datetime(end_date)]))
    
    ranges = []
    for i in range(len(starts) - 1):
        chunk_start = starts[i]
        chunk_end = starts[i+1] - pd.Timedelta(days=1)
        if chunk_end > pd.to_datetime(end_date):
            chunk_end = pd.to_datetime(end_date)
        ranges.append((chunk_start, chunk_end))
    
    return ranges


class LocusEnergyAutomation:
    """Clean and modular Locus Energy automation class"""
    
    def __init__(self, site_name="USG1", start_date=None, end_date=None):
        self.site_name = site_name
        self.start_date = start_date
        self.end_date = end_date
        self.headless = False  # Always visible
        
        # Configurable inverter patterns - you can modify this list
        self.inverter_patterns = [
            'inv', 'inverter', 'solectria'
        ]
        
        self.setup_logging()
        
    def setup_logging(self):
        """Set up logging with timestamped directory"""
        self.logs_dir = os.path.join("locus_automation", f"logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        os.makedirs(self.logs_dir, exist_ok=True)
        
        log_file = os.path.join(self.logs_dir, f"automation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file, encoding='utf-8'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        self.logger.info(f"Automation started for site: {self.site_name}")
        self.logger.info(f"Date range: {self.start_date} to {self.end_date}")
        self.logger.info(f"Logs directory: {self.logs_dir}")

    def login(self, page, email="jhao@aspenpower.com", password="Aspen2025"):
        """Login to Locus Energy"""
        self.logger.info("🔐 Starting login process")
        
        login_url = "https://locusnoc.datareadings.com/login"
        page.goto(login_url)
        page.wait_for_load_state("networkidle", timeout=30000)
        
        # Fill login form
        page.get_by_role("textbox", name="yours@example.com").fill(email)
        page.get_by_role("textbox", name="your password").fill(password)
        page.get_by_role("button", name="Login").click()
        
        # Wait and verify login
        page.wait_for_load_state("networkidle", timeout=30000)
        time.sleep(2)
        
        # Check for successful login
        success_indicators = page.query_selector_all("*:has-text('Fleet'), *:has-text('USG1'), *:has-text('Gypsum')")
        if success_indicators:
            self.logger.info("✅ Login successful")
            return True
        else:
            self.logger.error("❌ Login failed")
            return False

    def navigate_to_site(self, page, start_date, end_date):
        """Navigate to the specific site charting page with date range"""
        self.logger.info(f"🎯 Navigating to {self.site_name} charting page")
        self.logger.info(f"📅 Date range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
        
        # Construct URL for the specific site with date range
        start_str = start_date.strftime('%Y-%m-%d')
        end_str = end_date.strftime('%Y-%m-%d')
        site_url = f"https://locusnoc.datareadings.com/charting?end={end_str}T23-59-59&q={self.site_name.lower()}&start={start_str}T00-00-00&tz=US-Pacific"
        
        page.goto(site_url)
        page.wait_for_load_state("networkidle", timeout=30000)
        time.sleep(3)  # Allow UI to fully load
        
        # Take screenshot
        screenshot_path = os.path.join(self.logs_dir, f"01_site_loaded_{start_str}_to_{end_str}.png")
        page.screenshot(path=screenshot_path)
        self.logger.info(f"📸 Site loaded screenshot: {screenshot_path}")

    def select_inverters(self, page):
        """Select all available inverters - works with any naming convention"""
        self.logger.info("⚡ Selecting all inverters (dynamic detection)")
        
        # Multiple strategies to find inverters with different naming conventions
        inverter_strategies = [
            # Strategy 1: Look for common inverter patterns in selector buttons
            {
                'selector': "button[class*='entity-selector']",
                'patterns': self.inverter_patterns,
                'description': 'Entity selector buttons'
            },
            # Strategy 2: Look for checkboxes with inverter-related values
            {
                'selector': "input[type='checkbox']",
                'patterns': self.inverter_patterns,
                'description': 'Checkbox inputs'
            },
            # Strategy 3: Look for any clickable elements with inverter text
            {
                'selector': "*[class*='clickable'], *[onclick], button, span[class*='select']",
                'patterns': self.inverter_patterns,
                'description': 'General clickable elements'
            }
        ]
        
        selected_inverters = set()
        
        for strategy_num, strategy in enumerate(inverter_strategies, 1):
            if selected_inverters:  # If we already found inverters, stop
                break
                
            self.logger.info(f"  Strategy {strategy_num}: {strategy['description']}")
            
            try:
                elements = page.query_selector_all(strategy['selector'])
                self.logger.info(f"    Found {len(elements)} {strategy['description'].lower()}")
                
                for element in elements:
                    try:
                        if not element.is_visible():
                            continue
                            
                        element_text = element.text_content().strip()
                        element_value = element.get_attribute('value') or ""
                        element_id = element.get_attribute('id') or ""
                        
                        # Check if this element contains any inverter-related patterns
                        all_text = f"{element_text} {element_value} {element_id}".lower()
                        
                        # Look for inverter patterns
                        is_inverter = False
                        inverter_name = None
                        
                        for pattern in strategy['patterns']:
                            if pattern in all_text:
                                # Extract a meaningful name for this inverter
                                if element_text and len(element_text) < 50:
                                    inverter_name = element_text.strip()
                                elif element_value and len(element_value) < 50:
                                    inverter_name = element_value.strip()
                                else:
                                    # Generate a name based on pattern found
                                    inverter_name = f"{pattern.title()} {len(selected_inverters) + 1}"
                                
                                is_inverter = True
                                break
                        
                        # Additional filters to avoid UI elements
                        if is_inverter and inverter_name:
                            # Skip common UI messages
                            ui_messages = ['clear', 'select all', 'deselect', 'show', 'hide', 'expand', 'collapse']
                            if any(msg in inverter_name.lower() for msg in ui_messages):
                                continue
                            
                            # Skip if name is too generic or too long
                            if len(inverter_name) > 100 or len(inverter_name) < 2:
                                continue
                            
                            # Avoid duplicates based on similar names
                            is_duplicate = False
                            for existing in selected_inverters:
                                if (inverter_name.lower() in existing.lower() or 
                                    existing.lower() in inverter_name.lower()):
                                    is_duplicate = True
                                    break
                            
                            if not is_duplicate:
                                try:
                                    self.logger.info(f"    🎯 Selecting: {inverter_name}")
                                    element.click()
                                    selected_inverters.add(inverter_name)
                                    time.sleep(1)  # Brief pause between selections
                                        
                                except Exception as click_e:
                                    self.logger.debug(f"    Failed to click {inverter_name}: {click_e}")
                                    continue
                                    
                    except Exception as e:
                        self.logger.debug(f"    Failed to process element: {e}")
                        continue
                
                if selected_inverters:
                    self.logger.info(f"  ✅ Strategy {strategy_num} successful - found {len(selected_inverters)} inverters")
                    break
                else:
                    self.logger.info(f"  ⏭️ Strategy {strategy_num} found no inverters")
                    
            except Exception as e:
                self.logger.warning(f"  ❌ Strategy {strategy_num} failed: {e}")
                continue
        
        if not selected_inverters:
            # Fallback: Try to find any selectable components
            self.logger.info("  🔄 Fallback: Looking for any selectable components")
            try:
                # Look for any checkbox or button that might be a component
                fallback_elements = page.query_selector_all("input[type='checkbox'], button[class*='select']")
                self.logger.info(f"    Found {len(fallback_elements)} potential components")
                
                for i, element in enumerate(fallback_elements[:10], 1):
                    try:
                        if element.is_visible():
                            element_text = element.text_content().strip()
                            if element_text and len(element_text) < 50:
                                component_name = f"Component {i}: {element_text}"
                                self.logger.info(f"    🎯 Selecting fallback: {component_name}")
                                element.click()
                                selected_inverters.add(component_name)
                                time.sleep(1)
                    except Exception as e:
                        self.logger.debug(f"    Fallback element {i} failed: {e}")
                        continue
                        
            except Exception as e:
                self.logger.warning(f"  Fallback strategy failed: {e}")
        
        if selected_inverters:
            self.logger.info(f"✅ Selected {len(selected_inverters)} inverters/components:")
            for inverter in sorted(selected_inverters):
                self.logger.info(f"  • {inverter}")
        else:
            self.logger.error("❌ No inverters found with any strategy")
        
        return len(selected_inverters)

    def select_ac_energy(self, page):
        """Select AC Energy (kWh) data field"""
        self.logger.info("🔋 Selecting AC Energy (kWh)")
        
        # Wait for data selection UI to appear
        time.sleep(3)
        
        # Look for AC Energy (kWh) specifically - using the working selectors from the original
        ac_energy_selectors = [
            "*:has-text('AC Energy (kWh)'):not(:has(*:has-text('AC Reactive Power'))):not(:has(*:has-text('AC Apparent Power')))",
            "div:has-text('AC Energy (kWh)') input[type='checkbox']",
            "*:has-text('AC Energy (kWh)') button[class*='checkbox']",
        ]
        
        for selector_num, selector in enumerate(ac_energy_selectors, 1):
            try:
                elements = page.query_selector_all(selector)
                self.logger.info(f"  Trying selector {selector_num}: Found {len(elements)} elements")
                
                for element in elements:
                    if element.is_visible():
                        element_text = element.text_content().strip()
                        element_tag = element.evaluate("el => el.tagName")
                        
                        # Verify this is specifically AC Energy (kWh)
                        if ('ac energy (kwh)' in element_text.lower() and 
                            'reactive' not in element_text.lower() and 
                            'apparent' not in element_text.lower()):
                            
                            self.logger.info(f"  ✅ Found AC Energy element: {element_text[:50]}")
                            
                            # Strategy 1: Look for checkbox in the immediate container
                            try:
                                parent_container = element.evaluate("el => el.closest('div[class*=\"field\"], li, tr, .data-field, [class*=\"item\"]')")
                                if parent_container:
                                    checkbox = page.evaluate("""
                                        (container) => {
                                            // Try different checkbox patterns
                                            let checkbox = container.querySelector('input[type="checkbox"]');
                                            if (!checkbox) {
                                                checkbox = container.querySelector('button[class*="checkbox"]');
                                            }
                                            if (!checkbox) {
                                                checkbox = container.querySelector('[role="checkbox"]');
                                            }
                                            return checkbox;
                                        }
                                    """, parent_container)
                                    
                                    if checkbox:
                                        try:
                                            is_checked = page.evaluate("el => el.checked || el.classList.contains('checked') || el.getAttribute('aria-checked') === 'true'", checkbox)
                                            self.logger.info(f"    📋 Found checkbox in AC Energy container, checked: {is_checked}")
                                            
                                            if not is_checked:
                                                self.logger.info(f"    🖱️ Clicking AC Energy checkbox in container")
                                                page.evaluate("el => el.click()", checkbox)
                                                time.sleep(2)
                                                self.logger.info("  ✅ AC Energy checkbox clicked")
                                                return True
                                            else:
                                                self.logger.info(f"    ✅ AC Energy checkbox already selected")
                                                return True
                                        except Exception as check_e:
                                            self.logger.debug(f"    Checkbox check failed: {check_e}")
                                            # Try clicking anyway
                                            try:
                                                page.evaluate("el => el.click()", checkbox)
                                                time.sleep(2)
                                                self.logger.info(f"    ✅ Clicked AC Energy checkbox (fallback)")
                                                return True
                                            except Exception as click_fallback_e:
                                                self.logger.debug(f"    Fallback click failed: {click_fallback_e}")
                                    else:
                                        self.logger.debug(f"    No checkbox found in AC Energy container")
                            except Exception as container_e:
                                self.logger.debug(f"    Container strategy failed: {container_e}")
                            
                            # Strategy 2: Try clicking the text element if it's clickable (like a label)
                            if element_tag in ['LABEL', 'SPAN', 'DIV']:
                                try:
                                    self.logger.info(f"    🖱️ Trying to click AC Energy text element as label")
                                    element.click()
                                    time.sleep(2)
                                    self.logger.info(f"    ✅ Clicked AC Energy text element")
                                    return True
                                except Exception as text_click_e:
                                    self.logger.warning(f"    ⚠️ Text element click failed: {text_click_e}")
                                    
            except Exception as e:
                self.logger.debug(f"Selector {selector_num} failed: {e}")
                continue
        
        self.logger.error("❌ Could not find or select AC Energy")
        return False

    def set_15min_granularity(self, page):
        """Set data granularity to 15 minutes"""
        self.logger.info("📊 Setting data granularity to 15 minutes")
        
        try:
            # Click on granularity dropdown (currently showing "min")
            page.get_by_text("min").click()
            time.sleep(1)
            
            # Select 15 min option
            page.get_by_text("15 min").click()
            time.sleep(1)
            
            # Apply the selection
            page.get_by_role("button", name="APPLY").click()
            time.sleep(2)
            
            self.logger.info("✅ Granularity set to 15 minutes")
            return True
            
        except Exception as e:
            self.logger.warning(f"⚠️ Failed to set 15-minute granularity: {e}")
            return False

    def add_to_chart(self, page):
        """Click Add button to add selection to chart"""
        self.logger.info("➕ Adding selection to chart")
        
        time.sleep(2)  # Wait for UI update
        
        try:
            # Find and click Add button
            add_button = page.query_selector("button:has-text('Add'):not([class*='hidden'])")
            if add_button and add_button.is_visible():
                add_button.click()
                self.logger.info("✅ Add button clicked successfully")
                
                time.sleep(3)  # Wait for chart to update
                return True
            else:
                self.logger.error("❌ Add button not found")
                return False
                
        except Exception as e:
            self.logger.error(f"❌ Failed to click Add button: {e}")
            return False

    def download_csv(self, page, start_date, end_date):
        """Download CSV data for specific date range"""
        self.logger.info(f"📥 Downloading CSV data for {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
        
        try:
            # Wait for chart to fully load
            time.sleep(5)
            
            # Check if export button is available
            export_button = page.locator("#header-export")
            if not export_button.is_visible():
                self.logger.warning("⚠️ Export button not visible, waiting longer...")
                time.sleep(5)
            
            # Click export button
            export_button.click()
            time.sleep(2)
            
            # Check if CSV option is available
            csv_option = page.get_by_text("CSV")
            if not csv_option.is_visible():
                self.logger.warning("⚠️ CSV option not visible")
                return None
            
            # Download CSV with longer timeout for weekly data
            with page.expect_download(timeout=60000) as download_info:  # 60 second timeout
                csv_option.click()
            download = download_info.value
            
            # Read CSV directly into DataFrame
            temp_path = download.path()
            df = pd.read_csv(temp_path)
            
            # Add metadata
            df['site_name'] = self.site_name
            df['date_range_start'] = start_date.strftime('%Y-%m-%d')
            df['date_range_end'] = end_date.strftime('%Y-%m-%d')
            
            self.logger.info(f"✅ CSV data loaded: {len(df)} records")
            return df
            
        except Exception as e:
            self.logger.error(f"❌ CSV download failed: {e}")
            # Take screenshot for debugging
            try:
                error_screenshot = os.path.join(self.logs_dir, f"error_download_{start_date.strftime('%Y%m%d')}_to_{end_date.strftime('%Y%m%d')}.png")
                page.screenshot(path=error_screenshot)
                self.logger.info(f"📸 Error screenshot saved: {error_screenshot}")
            except:
                pass
            return None

    def run_automation(self, email="jhao@aspenpower.com", password="Aspen2025"):
        """Run the complete automation process with date range chunking"""
        self.logger.info("🚀 Starting Locus Energy automation with date range processing")
        
        # Generate date chunks
        date_chunks = daterange_chunks(self.start_date, self.end_date, weeks=1)
        self.logger.info(f"📅 Processing {len(date_chunks)} weekly chunks")
        
        all_dataframes = []
        
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=self.headless, slow_mo=500)
            context = browser.new_context()
            page = context.new_page()
            
            try:
                # Step 1: Login (once)
                if not self.login(page, email, password):
                    return False, None
                
                # Process each date chunk
                for chunk_num, (chunk_start, chunk_end) in enumerate(date_chunks, 1):
                    self.logger.info(f"\n📊 Processing chunk {chunk_num}/{len(date_chunks)}: {chunk_start.strftime('%Y-%m-%d')} to {chunk_end.strftime('%Y-%m-%d')}")
                    
                    # Calculate days in this chunk for progress tracking
                    days_in_chunk = (chunk_end - chunk_start).days + 1
                    self.logger.info(f"📅 Chunk covers {days_in_chunk} days")
                    
                    try:
                        # Step 2: Navigate to site with specific date range
                        self.navigate_to_site(page, chunk_start, chunk_end)
                        
                        # Step 3: Select inverters (for every chunk - selections reset with new date range)
                        inverter_count = self.select_inverters(page)
                        if inverter_count == 0:
                            self.logger.error(f"❌ No inverters selected for chunk {chunk_num}, skipping")
                            continue
                        
                        # Step 4: Select AC Energy (for every chunk)
                        if not self.select_ac_energy(page):
                            self.logger.error(f"❌ AC Energy selection failed for chunk {chunk_num}, skipping")
                            continue
                        
                        # Step 5: Set 15-minute granularity (for every chunk)
                        if not self.set_15min_granularity(page):
                            self.logger.warning(f"⚠️ Failed to set 15-minute granularity for chunk {chunk_num}, continuing anyway")
                        
                        # Step 6: Add to chart (for every chunk)
                        if not self.add_to_chart(page):
                            self.logger.error(f"❌ Failed to add to chart for chunk {chunk_num}, skipping")
                            continue
                        
                        # Step 7: Download CSV for this chunk
                        df = self.download_csv(page, chunk_start, chunk_end)
                        if df is not None:
                            all_dataframes.append(df)
                            self.logger.info(f"✅ Chunk {chunk_num} completed: {len(df)} records")
                            
                            # Progress update
                            total_records = sum(len(df) for df in all_dataframes)
                            self.logger.info(f"📈 Progress: {len(all_dataframes)}/{len(date_chunks)} chunks, {total_records} total records")
                        else:
                            self.logger.warning(f"⚠️ Chunk {chunk_num} failed to download")
                        
                        # Brief pause between chunks to avoid overwhelming the server
                        if chunk_num < len(date_chunks):
                            self.logger.info("⏳ Pausing 3 seconds before next chunk...")
                            time.sleep(3)
                            
                    except Exception as e:
                        self.logger.error(f"❌ Chunk {chunk_num} failed: {e}")
                        # Take error screenshot
                        try:
                            error_screenshot = os.path.join(self.logs_dir, f"chunk_error_{chunk_num}_{chunk_start.strftime('%Y%m%d')}.png")
                            page.screenshot(path=error_screenshot)
                            self.logger.info(f"📸 Chunk error screenshot: {error_screenshot}")
                        except:
                            pass
                        continue
                
                # Combine all data
                if all_dataframes:
                    final_df = pd.concat(all_dataframes, ignore_index=True)
                    
                    # Save combined CSV
                    csv_filename = f"{self.site_name.lower()}_ac_energy_data_{self.start_date.strftime('%Y%m%d')}_to_{self.end_date.strftime('%Y%m%d')}.csv"
                    csv_path = os.path.join(self.logs_dir, csv_filename)
                    final_df.to_csv(csv_path, index=False)
                    
                    self.logger.info("🎉 Automation completed successfully!")
                    self.logger.info(f"📊 Final results: {len(final_df)} total records from {len(all_dataframes)} chunks")
                    self.logger.info(f"💾 Combined data saved to: {csv_path}")
                    
                    # Take final screenshot
                    screenshot_path = os.path.join(self.logs_dir, "final_completed.png")
                    page.screenshot(path=screenshot_path)
                    
                    if not self.headless:
                        input("Press Enter to close browser...")
                    
                    return True, final_df
                else:
                    self.logger.error("❌ No data downloaded from any chunks")
                    return False, None
                
            except Exception as e:
                self.logger.error(f"❌ Automation failed: {e}")
                return False, None
                
            finally:
                context.close()
                browser.close()


def main():
    """Main function to run the automation"""
    print("🌟 Locus Energy Data Automation")
    print("=" * 50)
    
    # Configuration
    site_name = input("Enter site name (default: USG1): ").strip() or "USG1"
    
    # Date range input
    start_date_str = input("Enter start date (YYYY-MM-DD, default: 2024-01-01): ").strip() or "2024-01-01"
    end_date_str = input("Enter end date (YYYY-MM-DD, default: 2024-12-31): ").strip() or "2024-12-31"
    
    try:
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
    except ValueError:
        print("❌ Invalid date format. Please use YYYY-MM-DD")
        return False
    
    print(f"\n📅 Date range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    print(f"🏭 Site: {site_name}")
    print(f"📊 Processing in weekly chunks")
    
    # Create and run automation
    automation = LocusEnergyAutomation(
        site_name=site_name,
        start_date=start_date,
        end_date=end_date
    )
    
    success, final_df = automation.run_automation()
    
    if success:
        print("\n✅ Automation completed successfully!")
        print(f"📁 Check results in: {automation.logs_dir}")
        print(f"📊 Total records: {len(final_df)}")
    else:
        print("\n❌ Automation failed. Check logs for details.")
    
    return success


if __name__ == "__main__":
    main() 