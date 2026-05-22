# Current State

- HR AI Companion is a static HTML app with an Express backend added for tool APIs.
- The Staff Salary Placement QA Tool is being added as a new tab under the existing Compensation / LEH Tools area. It should use backend salary placement routes, services, data files, and validators. It should not be mixed into the LEH calculation logic.
- Root `index.html` still contains the legacy LEH calculator and LEH reference tables.
- Salary placement browser behavior lives in `assets/salary-placement.js` to avoid putting the new workflow logic directly into `index.html`.
