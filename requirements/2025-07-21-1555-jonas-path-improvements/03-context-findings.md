# Context Findings

## Current Jonas Flow Architecture Analysis

### State Management Pattern (app/page.tsx:123)
The Jonas automation uses a sequential step-based flow:
```typescript
jonasStep: "login" | "dataType" | "config" | "email" | "processing" | "results"
```

**Current Flow Sequence:**
1. `login` → JonasLoginForm component (app/components/jonas/login-form.tsx)
2. `dataType` → Report type selection UI (app/page.tsx:470-494)
3. `config` → VendorSelector or AccountConfig component  
4. `email` → EmailSelector component (includes browser option)
5. `processing` → Automation execution with progress tracking
6. `results` → Download/completion screen

### Key Components Analysis

#### 1. Login Component (app/components/jonas/login-form.tsx)
- **Default Credentials**: Lines 17-21 contain hardcoded values:
  - clientId: "121297", username: "SLiu", password: "AirplaneController123!"
- **Interface Pattern**: Standard onLogin callback with credentials object
- **Can be bypassed**: Credentials already available as defaults

#### 2. VendorSelector Component (app/components/jonas/vendor-selector.tsx)
- **Merge Target**: Lines 76-195 contain form with vendor selection
- **Key Features**: Default vendor list, custom vendor input, Excel upload
- **Submit Handler**: Lines 55-59 with conditional logic for defaults vs. custom

#### 3. EmailSelector Component (app/components/jonas/email-selector.tsx)
- **Merge Target**: Lines 38-122 contain email configuration
- **Key Features**: Recipient selection, send/download toggle, browser visibility option
- **Browser Option**: Lines 87-101 - checkbox for "Show browser window during automation"
- **Submit Handler**: Line 29 passes (email, sendEmail, showBrowser) parameters

### Browser Visibility Implementation Flow
1. **UI**: EmailSelector checkbox (lines 87-96) controls showBrowser state
2. **API**: Passed through handleJonasEmailSubmit to API endpoints
3. **Backend**: lib/jonas/runner.ts converts to --show-browser or --headless args
4. **Python**: Controls Playwright browser visibility in automation scripts

### Integration Points for Changes

#### Files Requiring Modification:
1. **app/page.tsx**: 
   - Lines 123: Update jonasStep type to remove "login"  
   - Lines 134-135: Change initial step from "login" to "dataType"
   - Lines 253-267: Remove handleJonasLogin, update step transitions
   - Lines 466-468: Remove login step conditional rendering
   - Lines 496-510: Update config step to handle merged component

2. **app/components/jonas/**: 
   - Create new merged component combining VendorSelector + EmailSelector
   - Update component to auto-set showBrowser=true
   - Remove browser visibility UI controls

3. **Component Patterns to Follow**:
   - Consistent Card/CardHeader/CardContent structure
   - Standard onSubmit + isLoading prop interface  
   - Form validation and state management patterns
   - Default values with checkbox toggles

### Existing Auto-Advance Patterns
- **Timer-based**: setTimeout() used for auto-advancing to results (line 356)
- **Default Values**: useDefaults checkboxes skip manual configuration steps
- **Conditional Steps**: Boolean flags control component behavior and visibility

### Technical Constraints Identified
1. **Credential Handling**: Default values already available, can be used directly
2. **API Compatibility**: Existing endpoints expect same parameter structure
3. **Component Interfaces**: Established patterns for prop interfaces and callbacks
4. **State Management**: Central state in parent component with step-specific handlers