# LEH Tools - FY26 LEH Rate Calculator

Standalone calculator for rehired adjunct faculty FY26 LEH rates.

## Structure

- `index.html` - Fully self-contained calculator
- No backend, no database, no dependencies
- ~460 lines of clean HTML/CSS/JS
- Static-host ready

## Features

- FY26 LEH rate calculation
- Fiscal year conversion (FY26/FY25/FY24/FY23)
- Break-in-service classification
- Terminal degree detection
- 9/1 raise eligibility logic
- Standard rate comparison
- Step-by-step math display
- Sample test case

## Future Improvements

- Independent auditor (verification)
- Reference tables (expandable)
- Additional test cases
- Backend integration (when ready)

## Deploy

This folder is intentionally kept as a standalone version of the LEH calculator.

The integrated calculator in the root `index.html` is the main HR AI Companion version. Use this standalone folder when a smaller direct link is useful.

Standalone URL when deployed with GitHub Pages:

```text
https://osman-jalloh-lab.github.io/AI-literacy-/leh-tools/
```

Local preview:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/leh-tools/
```

---

Built for Austin Community College HR team.
