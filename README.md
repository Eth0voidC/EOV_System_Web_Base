# EOV System — Automated Employee Lending & Inventory System

> A full-stack web system built for a sari-sari store that lets employees obtain products on credit, with purchases tracked digitally and deducted from payroll — replacing a manual, handwritten record-keeping process.

[![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

---

## About

Many small retail stores extend informal credit to trusted employees or regulars, tracking purchases by hand and settling balances later (e.g., on payday). This is slow to manage, easy to get wrong, and hard to audit once records pile up.

This project is a role-based inventory and credit-tracking system that digitizes that process: staff record purchases and incoming stock through a web interface, balances accumulate automatically, and administrators manage products, employee records, and periodic settlement — without a shared spreadsheet or notebook.

## Features

- **Role-based access** — separate Admin and Staff permissions, so day-to-day operations and administrative control are properly separated
- **Secure authentication** — token-based
- **Inventory management** — categorized products with live stock levels and photo support
- **Delivery intake** — staff log incoming stock, with automatic, consistent stock updates
- **Employee credit tracking** — running balances per employee, with configurable account restrictions
- **Periodic settlement reporting** — in progress

## Tech Stack

- **Frontend:** React (Vite)
- **Backend:** Node.js / Express
- **Database:** PostgreSQL
- **Auth:** Token-based sessions with industry-standard password hashing
- **Media storage:** Cloud-hosted image storage (no files stored on the app server)

## Project Status

This is an active case-study project. Core inventory, delivery, and employee-record functionality is implemented and tested; the credit-purchase and deduction-settlement workflows are in active development.

## Setup

This repository is configured for a specific deployment environment and is not intended to be run by the general public. If you are a collaborator or evaluator with authorized access, setup instructions and environment configuration are provided separately — please contact the maintainer rather than relying on repository contents alone.

## Security

This system handles personal and financial data (employee records and purchase/credit balances). If you discover a security issue, please report it privately to the maintainer rather than opening a public issue.

## License

Distributed under the MIT License. See `LICENSE` for details.

## Acknowledgments

Built as a case-study project for a micro business's internal operations.