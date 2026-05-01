# TaskFlow ✦

A beautiful, full-stack task management app built with **Next.js 14**, **NextAuth.js**, and **Google Sheets** as the backend database.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Auth | NextAuth.js v5 (Email/Password) |
| Database | Google Sheets API v4 |
| Styling | Tailwind CSS |
| Deployment | Vercel + GitHub |

## Local Development

### 1. Clone and install
```bash
git clone https://github.com/YOUR_USERNAME/taskflow.git
cd taskflow
npm install
```

### 2. Set up environment variables
```bash
cp .env.local.example .env.local
# Fill in the values — see setup guide below
```

### 3. Run dev server
```bash
npm run dev
# Open http://localhost:3000
```

## Google Cloud Setup (Required)

### Enable APIs
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project
3. Enable: **Google Sheets API** and **Google Drive API**

### Create Service Account
1. APIs & Services → Credentials → Create Credentials → Service Account
2. Name: `taskflow-sa` → Create
3. Click the service account → Keys → Add Key → JSON → Download
4. Encode it: `base64 -i service-account.json | tr -d '\n'`
5. Paste result as `GOOGLE_SERVICE_ACCOUNT_B64` in `.env.local`

### Create Google Sheet
1. Create a new Google Sheet at [sheets.google.com](https://sheets.google.com)
2. Share it with your service account email (Editor access)
3. Copy the Spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
4. Paste as `GOOGLE_SPREADSHEET_ID` in `.env.local`

### Generate NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

## Deployment (Vercel)

1. Push to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Add environment variables in Vercel dashboard:
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` = `https://your-app.vercel.app`
   - `GOOGLE_SERVICE_ACCOUNT_B64`
   - `GOOGLE_SPREADSHEET_ID`
4. Deploy!

## License

MIT
