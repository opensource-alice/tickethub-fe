# TicketHub 🎟️

A modern, production-grade live event ticket discovery and booking web application built with **Next.js 14 (App Router)**, **TypeScript**, and **Tailwind CSS**, powered directly by the **Ticketmaster Discovery API v2**.

---

## ✨ Features

- **Live Event Discovery**: Real-time event search, filtering, and browsing powered by Ticketmaster API.
- **Categorized Feeds**: Explore Music, Sports, Arts & Theatre, Film, and Family entertainment.
- **Interactive Seat Map & Booking**: Visual seat picker, section selection, and simulated checkout flow.
- **Location-Aware Suggestions**: Nearby events based on user geolocation with manual city switcher.
- **Responsive & Modern UI**: Built with Radix UI primitives, Lucide icons, dark/light theme support, and Framer Motion micro-interactions.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Ensure your Ticketmaster Discovery API key is configured in `.env.local`:
```env
NEXT_PUBLIC_TICKETMASTER_API_KEY=your_ticketmaster_api_key
NEXT_PUBLIC_TICKETMASTER_BASE_URL=https://app.ticketmaster.com/discovery/v2
```

### 3. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📦 Scripts

- `pnpm dev` - Start development server on port 3000
- `pnpm build` - Create optimized production build
- `pnpm start` - Run production server on port 3000
- `pnpm lint` - Run ESLint checks
