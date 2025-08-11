# Detailed Technical Questions

Based on deep analysis of the Jonas automation codebase, here are the most pressing technical questions for implementation:

## Q6: Should we create a new merged component "VendorEmailSelector" or modify the existing VendorSelector to include email functionality?
**Default if unknown:** Create new merged component (maintains clean separation while achieving desired UX)

## Q7: When skipping the login step, should we auto-inject the default credentials from login-form.tsx:17-21 into the handleJonasEmailSubmit API call?
**Default if unknown:** Yes (maintains existing credential flow without user interaction)

## Q8: Should the new jonasStep flow be "dataType" → "config" → "processing" → "results" (removing both "login" and "email" steps)?
**Default if unknown:** Yes (matches the requirement to merge vendor selection and email into one step)

## Q9: In the merged vendor/email component, should we preserve both the "Use default vendor list" checkbox AND the email recipient selection, or also default the email recipient?
**Default if unknown:** Preserve both options (user specified merging, not complete automation of email selection)

## Q10: Should the showBrowser parameter be hardcoded to `true` in the handleJonasEmailSubmit function at page.tsx:297, or set as a default in the merged component?
**Default if unknown:** Hardcode in handleJonasEmailSubmit function (ensures it's always true regardless of component state)