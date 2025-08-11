#!/usr/bin/env python3
"""
WPR (Weekly Progress Report) Generator for Solar Projects
Generates weekly progress reports with dummy data for demonstration purposes.
"""

import os
import csv
import argparse
from datetime import datetime, timedelta
import random

def get_week_dates(report_type='current_week'):
    """Get start and end dates for the report week."""
    today = datetime.now()
    
    if report_type == 'current_week':
        # Get current week (Monday to Sunday)
        days_since_monday = today.weekday()
        monday = today - timedelta(days=days_since_monday)
        sunday = monday + timedelta(days=6)
    elif report_type == 'last_week':
        # Get last week (Monday to Sunday)  
        days_since_monday = today.weekday()
        last_monday = today - timedelta(days=days_since_monday + 7)
        monday = last_monday
        sunday = monday + timedelta(days=6)
    else:
        # Default to current week
        days_since_monday = today.weekday()
        monday = today - timedelta(days=days_since_monday)
        sunday = monday + timedelta(days=6)
    
    return monday, sunday

def get_week_number(date):
    """Get ISO week number for a given date."""
    return date.isocalendar()[1]

def generate_wpr_data(start_date, end_date, include_charts=True, include_maintenance=True, include_weather=True):
    """Generate realistic WPR data for the given date range."""
    
    projects = [
        {'name': 'Solar Farm Alpha', 'site_id': 'SFA-001', 'base_production': 4500},
        {'name': 'Solar Farm Beta', 'site_id': 'SFB-002', 'base_production': 3200},
        {'name': 'Rooftop Installation C', 'site_id': 'RIC-003', 'base_production': 2100}
    ]
    
    weather_conditions = ['Sunny', 'Partly cloudy', 'Cloudy', 'Clear']
    maintenance_activities = ['None', 'Panel cleaning', 'Inverter inspection', 'Cable check', 'System restart']
    
    wpr_data = []
    total_production = 0
    
    print("Collecting solar project data...")
    
    # Generate daily data for each project
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.strftime('%Y-%m-%d')
        
        for project in projects:
            print(f"Calculating performance metrics for {project['name']} on {date_str}...")
            
            # Generate realistic but random data
            weather_factor = random.uniform(0.7, 1.1)  # Weather impact on production
            seasonal_factor = 0.85 + 0.25 * random.random()  # Seasonal variation
            
            energy_production = project['base_production'] * weather_factor * seasonal_factor
            performance_ratio = 85 + random.random() * 12  # 85-97%
            availability = 95 + random.random() * 5  # 95-100%
            peak_power = energy_production / 8  # Assume 8 hours of peak sun
            irradiance = 4 + random.random() * 3.5  # 4-7.5 kWh/m²
            temperature = 20 + random.random() * 15  # 20-35°C
            
            # Maintenance events (random chance)
            maintenance = maintenance_activities[0] if random.random() > 0.15 else random.choice(maintenance_activities[1:])
            
            # Weather conditions
            weather = random.choice(weather_conditions)
            
            # Notes (occasional)
            notes = ''
            if random.random() > 0.9:
                notes = random.choice(['Outstanding performance today', 'Minor performance dip - investigating', 'System performing optimally'])
            
            row_data = {
                'Date': date_str,
                'Project': project['name'],
                'Site_ID': project['site_id'],
                'Energy_Production_kWh': f"{energy_production:.1f}",
                'Performance_Ratio_%': f"{performance_ratio:.1f}",
                'Availability_%': f"{availability:.1f}",
                'Maintenance_Events': maintenance,
                'Weather_Conditions': weather,
                'Daily_Peak_Power_kW': f"{peak_power:.1f}",
                'Irradiance_kWh_m2': f"{irradiance:.2f}",
                'Temperature_C': f"{temperature:.1f}",
                'Notes': notes
            }
            
            wpr_data.append(row_data)
            total_production += energy_production
        
        current_date += timedelta(days=1)
    
    print("Analyzing maintenance activities...")
    
    # Add weekly summary row
    if include_maintenance:
        summary_row = {
            'Date': 'WEEKLY TOTAL',
            'Project': 'All Projects',
            'Site_ID': 'ALL',
            'Energy_Production_kWh': f"{total_production:.0f}",
            'Performance_Ratio_%': '91.2',
            'Availability_%': '98.1',
            'Maintenance_Events': 'Various',
            'Weather_Conditions': 'Mixed',
            'Daily_Peak_Power_kW': '',
            'Irradiance_kWh_m2': '',
            'Temperature_C': '',
            'Notes': 'Weekly summary for all solar installations'
        }
        wpr_data.append(summary_row)
    
    return wpr_data

def save_wpr_csv(data, filename):
    """Save WPR data to CSV file."""
    
    print("Generating charts and summaries...")
    
    downloads_dir = os.path.join("downloads", "wpr")
    os.makedirs(downloads_dir, exist_ok=True)
    
    filepath = os.path.join(downloads_dir, filename)
    
    fieldnames = [
        'Date', 'Project', 'Site_ID', 'Energy_Production_kWh', 'Performance_Ratio_%',
        'Availability_%', 'Maintenance_Events', 'Weather_Conditions', 
        'Daily_Peak_Power_kW', 'Irradiance_kWh_m2', 'Temperature_C', 'Notes'
    ]
    
    with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
    
    print(f"WPR generated successfully")
    print(f"Data saved to: {filepath}")
    print(f"Total records: {len(data)}")
    
    return filepath

def main():
    parser = argparse.ArgumentParser(description='Generate Weekly Progress Report for solar projects')
    parser.add_argument('--report_type', default='current_week', 
                       choices=['current_week', 'last_week', 'custom_range'],
                       help='Type of report to generate')
    parser.add_argument('--include_charts', default='true', 
                       help='Include performance charts (true/false)')
    parser.add_argument('--include_maintenance', default='true',
                       help='Include maintenance activities (true/false)')
    parser.add_argument('--include_weather', default='false',
                       help='Include weather data (true/false)')
    
    args = parser.parse_args()
    
    print(f"Starting WPR generation for {args.report_type}")
    
    # Parse boolean arguments
    include_charts = args.include_charts.lower() == 'true'
    include_maintenance = args.include_maintenance.lower() == 'true'
    include_weather = args.include_weather.lower() == 'true'
    
    # Get date range
    start_date, end_date = get_week_dates(args.report_type)
    week_number = get_week_number(start_date)
    year = start_date.year
    
    print(f"Generating report for week {week_number}, {year}")
    print(f"Date range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    
    try:
        # Generate WPR data
        wpr_data = generate_wpr_data(
            start_date, end_date, 
            include_charts, include_maintenance, include_weather
        )
        
        # Create filename
        filename = f"WPR_{year}_Week_{week_number:02d}.csv"
        
        # Save to CSV
        filepath = save_wpr_csv(wpr_data, filename)
        
        print("WPR automation completed successfully")
        
    except Exception as e:
        print(f"Error during WPR generation: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())