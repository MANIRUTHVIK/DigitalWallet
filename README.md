# Health Wallet

A complete health tracking web application built with Next.js 15, TypeScript, Clerk Authentication, Cloudinary, NeonDB, and Prisma ORM.

## Features

- 🔐 Secure authentication with Clerk
- 📄 Upload medical reports (PDFs & Images)
- 🤖 AI-powered automatic vitals extraction from reports
- 📊 Track vitals over time with interactive charts
- 🔍 Filter and search reports
- 🔗 Share reports securely with time-limited tokens
- ☁️ Cloud storage with Cloudinary
- 💾 Serverless PostgreSQL with NeonDB

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Clerk account (free tier available)
- A Cloudinary account (free tier available)
- A NeonDB account (free tier available)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

3. Set up your database:

```bash
npx prisma migrate dev
npx prisma generate
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

See `.env.example` for all required environment variables.

### Clerk Setup

1. Create a new application at [clerk.com](https://clerk.com)
2. Copy the publishable key and secret key to `.env`

### Cloudinary Setup

1. Create an account at [cloudinary.com](https://cloudinary.com)
2. Find your cloud name, API key, and API secret in the dashboard
3. Add them to `.env`

### NeonDB Setup

1. Create a new project at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Add it as `DATABASE_URL` in `.env`

### Gemini AI Setup (Optional but Recommended)

The app uses Google's Gemini AI to automatically extract vitals from uploaded reports:

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add it as `GEMINI_API_KEY` in `.env`

**Note**: If you don't set up the Gemini API key, the app will still work, but you'll need to manually enter vitals. With the API key, vitals will be automatically extracted from uploaded reports.

## How It Works

### Automatic Vitals Extraction

When you upload a health report:

1. **Manual Entry**: You can manually enter vitals (Blood Pressure, Heart Rate, SpO2, etc.)
2. **AI Extraction**: If you leave vitals empty, the AI automatically extracts them from your report
3. **Smart Merging**: Manual entries always take priority over AI-extracted values
4. **Dashboard Display**: All vitals (manual or extracted) appear automatically on your dashboard

Supported vitals:

- Blood Pressure (mmHg)
- Heart Rate (bpm)
- SpO2 (%)
- Blood Sugar (mg/dL)
- Hemoglobin (g/dL)
- Cholesterol (mg/dL)

## Project Structure

```
app/              # Next.js App Router pages
  api/            # API routes
  dashboard/      # Dashboard page
  reports/        # Reports management
  upload/         # Upload page
  share/          # Shared reports viewer
components/       # React components
lib/              # Utility functions and DB connection
prisma/           # Database schema
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Authentication**: Clerk
- **Database**: NeonDB (PostgreSQL)
- **ORM**: Prisma
- **File Storage**: Cloudinary
- **Charts**: Recharts
- **Styling**: Tailwind CSS

## License

MIT
