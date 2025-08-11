# Cookie-Based Playwright Automation

Simple workflow to extract cookies from manual login and use them with Playwright codegen.

## Quick Start

### 1. Extract Cookies Manually
```bash
python playwright/extract_cookies_manual.py
```
- Browser opens
- Navigate to Lenovo site and login manually
- Complete all steps (2FA, etc.)
- Press Enter when fully logged in
- Cookies saved to `playwright/lenovo_cookies.json`

### 2. Test Cookies Work
```bash
python playwright/test_cookies.py
```
- Verifies cookies work for authentication
- Takes screenshot for visual confirmation

### 3. Use Cookies with Codegen
```bash
python playwright/codegen_with_cookies.py
```
- Opens browser with cookies pre-loaded
- You should be automatically logged in
- Run codegen in another terminal or use the interactive options

## Files Created

- `playwright/lenovo_cookies.json` - Extracted cookies
- `playwright/cookie_test_screenshot.png` - Test screenshot
- Generated Playwright code from codegen

## Tips

- Cookies expire - re-extract if authentication fails
- Test cookies before running long automation scripts
- Keep cookie files secure (they contain authentication data)

## Troubleshooting

**Codegen still shows login page:**
- Re-extract cookies (they may have expired)
- Ensure you completed ALL login steps before extracting
- Check if site requires specific headers/user-agent

**Browser won't stay logged in:**
- Some sites logout on new browser sessions
- Try copying session storage too (advanced)
- Use existing browser profile instead of cookies 