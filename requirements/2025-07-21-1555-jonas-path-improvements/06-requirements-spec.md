# Requirements Specification: Jonas Path Improvements

## Problem Statement
The current Jonas automation workflow requires users to navigate through multiple steps including login credentials entry, report type selection, vendor configuration, and email setup. This creates unnecessary friction in the user experience. The goal is to streamline the workflow by hiding the login step, reordering the flow to prioritize report selection, merging vendor and email configuration, and defaulting browser visibility.

## Solution Overview
Redesign the Jonas automation flow to reduce user interaction steps from 5 to 3 by:
1. Auto-injecting default login credentials 
2. Starting with report type selection
3. Combining vendor selection and email configuration
4. Automatically enabling browser visibility

## Functional Requirements

### FR1: Remove Login Step from UI Flow
- **Current**: Login form is the first step users see
- **Required**: Skip login step entirely, auto-inject default credentials
- **Implementation**: Use default credentials from `app/components/jonas/login-form.tsx:17-21`

### FR2: Report Type as First Step  
- **Current**: Report type selection comes after login
- **Required**: Report type selection becomes the very first step
- **Implementation**: Update initial `jonasStep` state from `"login"` to `"dataType"` in `app/page.tsx:134`

### FR3: Merged Vendor and Email Configuration
- **Current**: Separate VendorSelector and EmailSelector components/steps
- **Required**: Single combined component handling both vendor selection and email configuration
- **Implementation**: Create new `VendorEmailSelector` component combining functionality from both existing components

### FR4: Auto-Enable Browser Visibility
- **Current**: User checkbox to control browser visibility during automation
- **Required**: Browser visibility automatically defaulted to "Yes" without user input
- **Implementation**: Hardcode `showBrowser=true` in `handleJonasEmailSubmit` function at `app/page.tsx:297`

### FR5: Preserve Existing Configuration Options
- **Current**: Users can choose default vendor lists or customize selections
- **Required**: Maintain both "Use default vendor list" checkbox AND email recipient selection
- **Implementation**: Preserve existing vendor configuration patterns and email recipient options in merged component

## Technical Requirements

### TR1: Update Jonas Step State Management
**File**: `app/page.tsx`
- **Line 123**: Update `jonasStep` type definition to remove `"login"` and `"email"` steps
- **Lines 134-135**: Change initial step from `"login"` to `"dataType"`
- **Lines 253-267**: Remove `handleJonasLogin` function, update step transition handlers
- **Lines 466-468**: Remove login step conditional rendering
- **Lines 504-510**: Update email step to use merged config component

### TR2: Create VendorEmailSelector Component  
**New File**: `app/components/jonas/vendor-email-selector.tsx`
- Combine vendor selection logic from `vendor-selector.tsx:76-195`
- Integrate email configuration from `email-selector.tsx:38-122` 
- Remove browser visibility checkbox (lines 87-101 from email-selector)
- Maintain consistent Card/CardHeader/CardContent structure
- Implement combined submit handler: `onSubmit(vendors: string[], email: string, sendEmail: boolean)`

### TR3: Auto-Inject Default Credentials
**File**: `app/page.tsx`
- **Function**: `handleJonasEmailSubmit` (line 268)
- **Change**: Auto-inject default credentials object:
  ```typescript
  const defaultCredentials = {
    clientId: "121297",
    username: "SLiu", 
    password: "AirplaneController123!"
  }
  ```
- **Line 297**: Include `credentials: defaultCredentials` in API request payload

### TR4: Force Browser Visibility
**File**: `app/page.tsx`  
- **Line 297**: Hardcode `showBrowser: true` in API request payload
- Remove `showBrowser` parameter from component interfaces where no longer needed

### TR5: Update Component Integration Points
**File**: `app/page.tsx`
- **Lines 496-502**: Replace separate VendorSelector and AccountConfig conditionals with merged component
- Update handler functions to accept combined parameters from merged component
- Maintain existing API endpoint compatibility

## Implementation Hints and Patterns

### Component Architecture Patterns
- Follow existing prop interface pattern: `{ onSubmit, isLoading }` 
- Use established state management with checkbox toggles for defaults
- Maintain form validation patterns from existing components
- Preserve Card/CardHeader/CardContent UI structure for consistency

### State Flow Pattern
```typescript
// New simplified flow:
"dataType" → handleJonasDataTypeSelect() → "config" → handleJonasConfig() → "processing" → "results"
```

### API Integration Considerations
- Existing API endpoints expect same parameter structure
- `showBrowser` parameter still passed through to Python automation scripts
- Credential injection should be transparent to existing backend logic
- Email configuration parameters remain unchanged for API compatibility

### File Modifications Required
1. **app/page.tsx**: Primary logic updates for step flow and state management
2. **app/components/jonas/vendor-email-selector.tsx**: New merged component (create)
3. **app/components/jonas/vendor-selector.tsx**: Reference for merging (keep for accounts flow)
4. **app/components/jonas/email-selector.tsx**: Reference for merging (can be preserved or deprecated)

## Acceptance Criteria

### AC1: Streamlined User Flow
- [ ] Users see report type selection as the first step when selecting Jonas
- [ ] Login credentials are never requested from users
- [ ] Vendor selection and email configuration appear in a single form
- [ ] Browser automation is automatically enabled without user choice

### AC2: Functional Compatibility  
- [ ] All existing Jonas automation features work unchanged
- [ ] API calls include proper credentials and showBrowser=true parameters
- [ ] Default vendor lists and custom vendor selection both work
- [ ] Email sending and local download options both work
- [ ] Account reports workflow remains unchanged (separate from vendor workflow)

### AC3: Code Quality
- [ ] New component follows established patterns from existing Jonas components
- [ ] State management maintains consistency with existing step-based flow
- [ ] No breaking changes to backend API interfaces
- [ ] Component interfaces remain clean and testable

## Assumptions for Unanswered Questions
- Login credentials (`clientId: "121297", username: "SLiu", password: "AirplaneController123!"`) will remain valid and sufficient for all users
- Browser visibility being always enabled will not cause performance issues for users
- The merged vendor/email component will not become overly complex or confusing for users
- Account reports workflow can remain separate and unchanged from vendor reports workflow improvements

## Risk Considerations
- **Security**: Hardcoded credentials may need periodic updates
- **UX**: Removing user choice for browser visibility may not suit all users
- **Maintenance**: Merged component will be larger and potentially more complex to maintain
- **Testing**: Component merging will require thorough testing of all interaction combinations