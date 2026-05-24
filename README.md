# Class Feedback Page

Simple React + Vite app to collect both class feedback and broader program feedback, saving it locally in the browser.

Features:
- Collect student name, class topic, rating, comments, and suggestions.
- Capture program feedback on enjoyed features, favorite topics, and cohort expectations.
- Save reviews to `localStorage` and display them on the page.
- Export saved reviews as JSON or CSV files.
- Clear all saved reviews from local storage.

Quick start:

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser. Use the Export buttons to download stored reviews.

Note: Exports use the browser download mechanism and do not send data to any server.
