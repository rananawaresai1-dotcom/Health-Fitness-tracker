You are a senior full-stack React + TypeScript engineer and product-quality auditor.

Review and improve my entire Iron Pulse Fitness gym membership website. The existing application is a React + TypeScript fitness platform with:

- User registration and login
- User profile and BMI calculation
- Basic, Pro, and Elite membership plans
- Diet plans for vegetarian and non-vegetarian users
- Daily habit/task tracking
- Points and leaderboard-style gamification
- Workout video library
- BMI-based workout recommendations
- Calorie goal management
- Profile editing
- Responsive navigation
- LocalStorage-based persistence
- React, TypeScript, Tailwind CSS, Lucide icons, and Recharts

Do not simply redesign the UI. First audit the entire application for logical errors, incorrect business rules, broken state management, inconsistent data, TypeScript issues, runtime errors, security weaknesses, accessibility problems, and responsive issues.

The final result must be a stable, production-quality frontend with no obvious errors.

==================================================
1. PROJECT-WIDE AUDIT
==================================================

Inspect every existing file and component before changing anything.

Check for:

- TypeScript errors
- JSX errors
- Undefined variables
- Unused imports
- Missing imports
- Incorrect React state dependencies
- Incorrect useEffect dependencies
- Stale closures
- Broken event handlers
- Incorrect ref typing
- Invalid localStorage data
- Runtime crashes caused by malformed data
- Broken responsive layouts
- Buttons that do not perform their stated action
- Links that lead nowhere
- Features advertised but not actually implemented
- Membership features that do not match access control
- Duplicate logic
- Inconsistent terminology
- Incorrect calculations
- Invalid user input handling
- Data loss after page refresh
- Incorrect date calculations
- Broken logout/session behaviour

After auditing, fix the problems instead of merely reporting them.

==================================================
2. AUTHENTICATION LOGIC
==================================================

Improve the local authentication flow.

Requirements:

- Registration must validate all fields.
- Email validation must be robust.
- Password must meet a minimum length requirement.
- Password confirmation must match.
- Duplicate email registration must be prevented.
- Login must handle invalid credentials gracefully.
- Session restoration must work after refresh.
- Logout must completely clear the active session.
- Corrupted localStorage data must never crash the application.
- If localStorage data is malformed, recover safely using default values.
- Never expose passwords in the UI.
- If the current architecture stores plaintext passwords in localStorage, clearly isolate this as a demo-only limitation and structure the code so it can later be replaced with a real backend authentication system.
- Do not falsely claim that the app provides secure production authentication if it does not.

==================================================
3. MEMBERSHIP PLAN LOGIC
==================================================

Make membership access rules logically consistent.

Plans:

Basic
Pro
Elite

Create one central access-control system.

Requirements:

- A user must have a valid active plan before accessing paid features.
- Basic users must not access Pro-only features.
- Pro users must not access Elite-only features.
- Elite users receive all available features.
- A user cannot accidentally downgrade through a normal upgrade flow.
- The current plan must be clearly labelled.
- The UI must distinguish:
  - Current Plan
  - Upgrade
  - Locked Feature
  - Included Feature
- Every feature advertised in the pricing cards must match actual functionality.
- Remove or correct any feature claim that is not implemented.
- Do not advertise "200+ videos" if the actual application contains only a small demo library.
- Do not show "personal trainer sessions", "body composition analysis", "PDF reports", or "priority support" as fully functional unless those features actually exist.
- If a feature is only a demo or placeholder, label it clearly.

==================================================
4. BMI AND HEALTH CALCULATIONS
==================================================

Review the BMI system carefully.

Requirements:

- Validate height and weight ranges.
- Prevent zero, negative, NaN, and Infinity values.
- Calculate BMI correctly.
- Round BMI consistently to one decimal place.
- Categorise BMI consistently.
- Keep BMI, BMI category, weight, and calorie goal synchronised.
- When the user edits height or weight, recalculate all dependent values.
- Do not leave stale BMI values after profile updates.
- Do not silently overwrite user-entered calorie goals unless this behaviour is intentional and clearly explained.
- Separate:
  1. Automatically recommended calorie goal
  2. User-customised calorie goal
- Elite users may edit calorie goals if this is part of the plan.
- Lower-tier users should see the correct locked state.

Important:
BMI is only a general screening metric. Do not present it as a medical diagnosis.

==================================================
5. CALORIE AND DIET LOGIC
==================================================

Review all calorie calculations.

Requirements:

- Diet meal calories must scale consistently with the user's calorie goal.
- Prevent invalid calorie goals.
- Use one central calorie calculation function.
- Ensure the total calories shown for all meals matches the user's target within reasonable rounding tolerance.
- Avoid inconsistent values between:
  - Profile
  - BMI calculator
  - Diet plan
  - Calorie editor
- If the user manually edits the calorie goal, do not unexpectedly overwrite it during unrelated actions.
- Clearly distinguish recommended calories from manually customised calories.

==================================================
6. DAILY TASK AND POINTS SYSTEM
==================================================

Audit the task tracking and points system.

Requirements:

- Tasks should reset correctly for each calendar day.
- A completed task should not award points multiple times.
- Unchecking and rechecking a task must not repeatedly award points.
- Points must remain consistent after refresh.
- Daily points and lifetime points must be separate concepts.
- Do not call something a "streak" unless consecutive-day logic actually exists.
- If the system only tracks membership duration, call it "Member Days" or similar.
- Ensure task completion state and points state cannot become inconsistent.
- Prevent duplicate point awards caused by rapid clicking.
- Make the point calculation centralised and predictable.

==================================================
7. DATE AND TIME LOGIC
==================================================

Review all date handling.

Requirements:

- Avoid timezone bugs caused by blindly using UTC dates for local daily tasks.
- Daily task reset should use the user's local calendar date.
- Membership duration should never become negative.
- Handle invalid plan start dates safely.
- Use a consistent date utility.
- Avoid multiple inconsistent date calculations throughout the application.

==================================================
8. PROFILE EDITING
==================================================

Make profile editing reliable.

Requirements:

- Validate age.
- Validate gender.
- Validate height.
- Validate weight.
- Prevent invalid numeric values.
- Recalculate BMI when height or weight changes.
- Recalculate BMI category when required.
- Update dependent recommendations correctly.
- Preserve unrelated user data.
- Save changes atomically.
- Ensure UI state updates immediately after saving.
- Cancel should discard unsaved changes.
- Profile modal/dialog must be keyboard accessible.
- Avoid accidentally saving partial invalid data.

==================================================
9. WORKOUT LIBRARY
==================================================

Review workout filtering.

Requirements:

- Category filters must work correctly.
- BMI filters must work correctly.
- Combined category + BMI filters must work correctly.
- Empty results must display a useful message.
- Video cards must not claim content that does not exist.
- Ensure YouTube IDs are valid or clearly marked as demo content.
- Do not create broken embedded video experiences.
- Add graceful fallback behaviour for unavailable videos.
- Ensure all workout metadata is consistent.

==================================================
10. DIET PLAN
==================================================

Review vegetarian and non-vegetarian meal plans.

Requirements:

- Tabs must work correctly.
- Meal calories must be calculated consistently.
- Total calories must be visible.
- Protein totals should be calculated correctly if displayed.
- Do not present nutritional values as medically personalised prescriptions.
- Use clear labels for estimated nutritional information.
- The meal plan should respond correctly to calorie goal changes.
- Avoid misleading claims about nutrition.

==================================================
11. DATA ARCHITECTURE
==================================================

Refactor repeated logic.

Create central utilities where appropriate for:

- Storage
- Authentication
- User persistence
- BMI calculations
- Calorie calculations
- Membership access
- Date handling
- Task points
- Validation

Do not duplicate the same business rule in multiple components.

Use strong TypeScript types.

Avoid excessive use of `any`.

Use safe parsing for localStorage.

==================================================
12. LOCALSTORAGE RELIABILITY
==================================================

Create a safe storage layer.

Requirements:

- Every localStorage read must be protected from malformed JSON.
- Use safe defaults.
- Do not crash if localStorage is unavailable.
- Handle quota errors.
- Handle missing keys.
- Handle old data structures where possible.
- Add versioning or migration logic if the data structure changes.
- Never allow corrupted storage to break the entire application.

==================================================
13. UI AND UX
==================================================

Improve the UX without unnecessarily changing the existing visual identity.

Maintain the existing Iron Pulse Fitness identity:

- Dark fitness aesthetic
- Red/orange primary accent
- Strong typography
- Athletic visual style
- Clear membership hierarchy

Improve:

- Loading states
- Empty states
- Error states
- Success feedback
- Locked feature states
- Form validation feedback
- Mobile navigation
- Keyboard accessibility
- Focus states
- Button disabled states
- Modal behaviour
- Responsive layout

Every button must have a clear purpose.

Do not add fake functionality.

==================================================
14. ACCESSIBILITY
==================================================

Ensure:

- Buttons have meaningful labels.
- Images have useful alt text.
- Form inputs have labels.
- Keyboard navigation works.
- Focus states are visible.
- Modals can be closed with Escape.
- Interactive elements are accessible.
- Colour should not be the only way to communicate state.
- Text contrast should be readable.
- Avoid inaccessible custom controls.

==================================================
15. SECURITY AND HONEST PRODUCT CLAIMS
==================================================

This is currently a frontend/localStorage demo application.

Do not falsely describe it as production-secure.

Add clear architecture boundaries so a future backend can replace:

- LocalStorage authentication
- Password storage
- Membership payment handling
- User database
- Subscription verification

Do not implement fake payment success.

Do not claim a payment was processed if there is no real payment gateway.

Do not claim secure authentication if credentials are only stored locally.

==================================================
16. FOOTER AND CONTACT INFORMATION
==================================================

Review all contact information.

Remove:

- Fake phone numbers
- Fake physical addresses
- Misleading social links
- Claims that are not backed by real functionality

Use:

- Real project information
- Clearly marked demo information
- Or remove unnecessary contact details

==================================================
17. CODE QUALITY
==================================================

Refactor the code into maintainable components where useful.

Recommended structure:

src/
  components/
  features/
    auth/
    membership/
    bmi/
    diet/
    workouts/
    tasks/
  lib/
    storage.ts
    validation.ts
    bmi.ts
    calories.ts
    membership.ts
    dates.ts
  types/
  App.tsx

Do not over-engineer the project.

Keep the implementation understandable for a student portfolio project.

==================================================
18. ERROR-FREE REQUIREMENT
==================================================

Before finishing:

- Run TypeScript validation.
- Run the production build.
- Fix every compile error.
- Fix every runtime error.
- Fix every warning that indicates a real bug.
- Check all buttons.
- Check all forms.
- Check registration.
- Check login.
- Check logout.
- Check page refresh.
- Check each membership plan.
- Check locked features.
- Check BMI calculation.
- Check profile editing.
- Check calorie editing.
- Check task completion.
- Check points.
- Check diet tabs.
- Check workout filters.
- Check mobile layout.
- Check desktop layout.

Do not stop after making visual changes.

==================================================
19. FINAL OUTPUT
==================================================

After completing the audit and fixes:

1. Provide a concise summary of all logical bugs fixed.
2. List all major architectural improvements.
3. List any limitations that remain because this is a frontend/localStorage application.
4. Provide the exact files changed.
5. Confirm that the application builds successfully.
6. Do not claim the project is error-free unless you actually verified the build and functionality.
7. Do not remove existing functionality unless it is broken, misleading, duplicated, or logically inconsistent.
8. Preserve the current Iron Pulse Fitness branding and overall design direction.

Make the final application reliable, logically consistent, honest about its capabilities, responsive, accessible, and suitable for a strong student portfolio project.