# Discovery Questions

Based on the analysis of the Jonas automation flow in `app/page.tsx:123`, I've identified 5 key questions to understand the requirements better.

## Current Jonas Flow Analysis
The current flow follows these steps:
1. **login** - JonasLoginForm component
2. **dataType** - Report type selection (vendors/accounts)  
3. **config** - VendorSelector or AccountConfig
4. **email** - EmailSelector (includes browser visibility option)
5. **processing** - Automation execution
6. **results** - Download/completion screen

## Discovery Questions

### Q1: Should the login step be completely hidden from the user interface?
**Default if unknown:** Yes (user request indicates login should be skipped/hidden)

### Q2: Should the report type selection become the very first step users see?
**Default if unknown:** Yes (user explicitly requested "report type should be first")

### Q3: Should vendor selection and email configuration be combined into a single form?
**Default if unknown:** Yes (user requested to "merge select vendors and the email part")

### Q4: Should the browser visibility option be permanently set to "Yes" without user input?
**Default if unknown:** Yes (user requested "Show browser automation should automatically default to yes and don't show this part to user")

### Q5: Should the login credentials still be captured somehow, or use stored/default values?
**Default if unknown:** Use stored/default values (since login will be hidden, credentials need to come from somewhere)