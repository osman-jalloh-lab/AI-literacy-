# Decisions

- The Staff Salary Placement QA Tool will live in the same tools area as the LEH tools, but its backend logic will remain separate under salaryPlacement services and data files.
- Salary placement logic is implemented in Express backend route/controller/service modules instead of being embedded in `index.html`.
- The frontend salary placement behavior lives in `assets/salary-placement.js` so the root HTML file only owns the page shell.
- The integrated LEH calculator remains unchanged and separate from the salary placement service.
