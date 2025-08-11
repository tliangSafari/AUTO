#!/usr/bin/env python3
"""
Batch Locus Energy Automation

This script runs the automation for multiple sites in sequence.

Usage:
    python batch_automation.py
"""

from locus_automation import LocusEnergyAutomation
import config
import time


def run_batch_automation(sites, headless=True, max_inverters=None):
    """Run automation for multiple sites"""
    print(f"🚀 Starting batch automation for {len(sites)} sites")
    if max_inverters:
        print(f"📊 Max inverters per site: {max_inverters}")
    else:
        print("📊 Max inverters per site: No limit")
    print("=" * 60)
    
    results = {}
    
    for i, site in enumerate(sites, 1):
        print(f"\n📍 Processing site {i}/{len(sites)}: {site}")
        print("-" * 40)
        
        try:
            # Create automation instance for this site
            automation = LocusEnergyAutomation(
                site_name=site, 
                headless=headless,
                max_inverters=max_inverters
            )
            
            # Run automation
            success = automation.run_automation(
                email=config.LOGIN_EMAIL,
                password=config.LOGIN_PASSWORD
            )
            
            results[site] = {
                'success': success,
                'logs_dir': automation.logs_dir if success else None
            }
            
            if success:
                print(f"✅ {site} completed successfully")
            else:
                print(f"❌ {site} failed")
                
            # Brief pause between sites
            if i < len(sites):
                print("⏳ Waiting 10 seconds before next site...")
                time.sleep(10)
                
        except Exception as e:
            print(f"❌ {site} failed with error: {e}")
            results[site] = {'success': False, 'logs_dir': None}
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 BATCH AUTOMATION SUMMARY")
    print("=" * 60)
    
    successful = [site for site, result in results.items() if result['success']]
    failed = [site for site, result in results.items() if not result['success']]
    
    print(f"✅ Successful: {len(successful)}/{len(sites)}")
    for site in successful:
        print(f"   • {site} → {results[site]['logs_dir']}")
    
    if failed:
        print(f"\n❌ Failed: {len(failed)}/{len(sites)}")
        for site in failed:
            print(f"   • {site}")
    
    return results


def main():
    """Main function for batch processing"""
    print("🌟 Locus Energy Batch Automation")
    print("=" * 50)
    
    # Get sites to process
    print("Enter sites to process (one per line, empty line to finish):")
    sites = []
    while True:
        site = input(f"Site {len(sites) + 1}: ").strip()
        if not site:
            break
        sites.append(site.upper())
    
    if not sites:
        print("No sites entered. Using default: USG1")
        sites = [config.DEFAULT_SITE]
    
    # Confirm settings
    print(f"\nSites to process: {', '.join(sites)}")
    headless_input = input("Run in headless mode? (y/n, default: y): ").strip().lower()
    headless = not headless_input.startswith('n')
    
    max_inverters_input = input("Enter max inverters per site (or leave empty for no limit): ").strip()
    max_inverters = int(max_inverters_input) if max_inverters_input else None
    
    confirm = input(f"\nProcess {len(sites)} sites? (y/n): ").strip().lower()
    if not confirm.startswith('y'):
        print("Cancelled.")
        return
    
    # Run batch automation
    results = run_batch_automation(sites, headless=headless, max_inverters=max_inverters)
    
    # Final summary
    successful_count = sum(1 for result in results.values() if result['success'])
    print(f"\n🎉 Batch processing complete: {successful_count}/{len(sites)} sites successful")


if __name__ == "__main__":
    main() 