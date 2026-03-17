# SkyVault

SkyVault is a Windows 11 style file explorer for Google Drive, providing a read-only interface to navigate and download files from predefined root folders. It includes a compliance sidebar that tracks downloads of required files within a 72-hour deadline, escalating to management if not completed.

## Features

- **File Explorer UI**: Windows 11 inspired design for browsing folders and files.
- **Google Drive Integration**: Access files via Google Drive API using a service account.
- **Download Tracking**: Monitor downloads of mandatory files.
- **Compliance Dashboard**: Sidebar showing progress and time remaining.
- **Escalation System**: Automatic notification to management after deadline.

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Google Drive & Sheets**:
   - Create a Google Cloud service account with Drive API access.
   - **Enable both the Drive and Sheets APIs** for the project in the Google Cloud
     Console (Sheets is required for compliance and user lookup).
   - Download the JSON key and set `GOOGLE_SERVICE_ACCOUNT_KEY` in `.env`.
   - Set `FLOTA_FOLDER_IDS` (mapping flota numbers to Google Drive folder IDs) and `EMAIL` (hardcoded test email) in `config/constants.ts`.
   - `REQUIRED_FILE_IDS` is no longer used; compliant files are tracked via the **CONTROL** sheet.
   - Set `GOOGLE_SHEET_ID` to the spreadsheet that contains the **DB** and **CONTROL** tabs (values are read by `/api/user`, `/api/control` and `/api/compliance`).

### New API endpoints

- `GET /api/user` - returns `{ name, email, flota, folderId }` derived from the DB sheet using the EMAIL constant.
- `GET /api/folders/[id]?userName=<name>` - lists files in a folder; if `userName` is supplied the server will automatically insert any unseen file names into the CONTROL sheet (was_read=false). This ensures the spreadsheet is filled in real time as users browse.
- `POST /api/control` - accepts `{ userName, files }` and ensures the CONTROL sheet contains a row for each file with `was_read` false.  This endpoint is still usable for manual initialization but usually the GET folder and download hooks handle it.
- `GET /api/compliance?userName=<name>` - returns current compliance status using CONTROL sheet data.

3. **Run the Development Server**:
   ```bash
   npm run dev
   ```

4. **Run Compliance Check** (in production):
   ```bash
   node scripts/check-compliance.js
   ```

## Environment Variables

- `DATABASE_URL`: SQLite database URL (default: `file:./dev.db`)
- `GOOGLE_SERVICE_ACCOUNT_KEY`: JSON string of service account key

## Project Structure

- `app/`: Next.js app directory
- `lib/`: Utility libraries (Google Drive, DB)
- `config/`: Constants and configuration
- `scripts/`: Background scripts

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
