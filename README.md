# FinPRO - Financial Tracker

A clean, modern, and lightweight financial tracking web application built with vanilla HTML5, CSS3, and JavaScript.

![FinPRO Preview](https://img.shields.io/badge/Status-Complete-emerald?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![Vanilla JS](https://img.shields.io/badge/Dependencies-None-orange?style=flat-square)

---

## Features

- **Top Summary Cards**: Live calculations for **Net Balance**, **Total Incoming**, and **Total Outgoing**.
- **Add Transactions**: Enter description, amount, and incoming/outgoing type.
- **Edit Records**: Update any existing record in-place with instant validation and a cancel option.
- **Delete Confirmation**: Modal dialog requiring confirmation before deleting a transaction.
- **Live Search & Filter**: Instant search by item description or amount, plus category filters (**All**, **Incoming**, **Outgoing**).
- **Persistent Storage**: All data is automatically saved to the browser's `localStorage` (no database or server required).
- **Responsive & Mobile-First**: Optimized for mobile phones and desktops with touch-friendly 44px targets.
- **Friendly Empty State**: Helpful guidance when no records are present or search queries return no results.

---

## File Structure

```
FinPRO/
├── index.html     # Semantic structure and responsive markup
├── style.css      # Modern, clean CSS design system
├── script.js     # State management, calculations, and localStorage logic
└── README.md      # Project documentation
```

---

## Getting Started

No dependencies, build steps, or local servers are required!

1. Clone or download this repository:
   ```bash
   git clone https://github.com/Macomi27/FinPRO.git
   ```
2. Open `index.html` in any modern web browser:
   - On Windows: Double-click `index.html` or run:
     ```powershell
     Start-Process "index.html"
     ```
   - On Mac: Run `open index.html`
   - On Linux: Run `xdg-open index.html`

---

## License

This project is licensed under the MIT License.
