# DoodhKhata — दूधखाता

A simple offline-first Progressive Web App (PWA) for small milk sellers to manage daily deliveries, payments, and account balances.

## Features

- **Offline First** — works fully without internet after first load
- **Hindi & English** — complete bilingual support
- **Customers** — track milk deliveries and payments for each customer
- **Suppliers** — track milk purchases and payments to suppliers
- **Auto Balance** — running balance calculated automatically
- **Quick Entry** — fast single-customer delivery entry
- **Batch Entry** — add deliveries for all customers at once
- **Data Backup** — export and import all data as JSON
- **Installable** — can be installed on Android home screen like a native app

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- IndexedDB (via idb)
- PWA (vite-plugin-pwa + Workbox)

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Live App

[doodhkhata.vercel.app](https://doodhkhata.vercel.app)
