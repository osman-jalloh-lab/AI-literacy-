# HR AI Companion

Static HR AI literacy and prompt toolkit for HR operators, managers, and teams that need structured guidance for safe AI use in HR workflows.

The repository name is `AI-literacy-`, but the product surfaced by the root site is **HR AI Companion**.

## What is included

- `index.html` - Main static app. Includes AI literacy guidance, prompt builder, HR workflow prompts, department email templates, EAD/work authorization prompts, deliverables guidance, and the integrated FY26 LEH rate calculator.
- `leh-tools/index.html` - Standalone FY26 LEH calculator kept for direct use or separate sharing.
- `leh-tools/README.md` - Notes for the standalone LEH tool.
- `.github/workflows/pages.yml` - GitHub Actions workflow for publishing the static site to GitHub Pages.

## Current architecture

- Fully static HTML, CSS, and JavaScript.
- No backend, database, authentication, package manager, or build step.
- No data is stored by the app.
- Copy buttons use the browser clipboard API with a fallback for older browser behavior.

## LEH source of truth

The integrated LEH calculator inside root `index.html` is the primary version for the main HR AI Companion app.

The `/leh-tools/` folder remains available as a standalone calculator for teams that need a smaller direct link or a separate deployment.

## Local use

Open `index.html` directly in a browser, or run a small static server from the repository root:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000/
```

Standalone LEH tool:

```text
http://localhost:8000/leh-tools/
```

## GitHub Pages deployment

This repo is ready to deploy from the root static files.

Expected Pages URL after deployment:

```text
https://osman-jalloh-lab.github.io/AI-literacy-/
```

Deployment workflow:

1. Push changes to `main`.
2. In GitHub, open repository **Settings > Pages**.
3. Set **Source** to **GitHub Actions** if it is not already selected.
4. The `Deploy static site to GitHub Pages` workflow will publish the root site.

## Safety disclaimer

This tool provides HR AI literacy guidance, prompt templates, and calculator support. It does not provide legal advice, immigration advice, financial advice, or final HR decisions. Verify legal, compliance, payroll, and work authorization information against official sources and internal policy before using any output.

Never paste real employee names, Social Security numbers, medical information, immigration case details, compensation tied to identifiable people, or confidential investigation details into public AI tools.

## Known limitations

- Static prototype only; no real AI model integration yet.
- No automated test suite yet.
- No analytics, error logging, or release automation beyond GitHub Pages deployment.
- Accessibility can be improved with landmarks, ARIA states, and reduced reliance on inline click handlers.
