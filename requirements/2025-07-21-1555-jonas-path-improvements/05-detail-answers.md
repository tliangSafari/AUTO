# Detailed Technical Answers

## Q6: Should we create a new merged component "VendorEmailSelector" or modify the existing VendorSelector to include email functionality?
**Answer:** New merged component

## Q7: When skipping the login step, should we auto-inject the default credentials from login-form.tsx:17-21 into the handleJonasEmailSubmit API call?
**Answer:** Yes

## Q8: Should the new jonasStep flow be "dataType" → "config" → "processing" → "results" (removing both "login" and "email" steps)?
**Answer:** Yes

## Q9: In the merged vendor/email component, should we preserve both the "Use default vendor list" checkbox AND the email recipient selection, or also default the email recipient?
**Answer:** Preserve

## Q10: Should the showBrowser parameter be hardcoded to `true` in the handleJonasEmailSubmit function at page.tsx:297, or set as a default in the merged component?
**Answer:** Yes