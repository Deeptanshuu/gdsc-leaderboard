# GDSC Leaderboard

A real-time leaderboard application for tracking and displaying GitHub contributions from participants. Built with Node.js and React, this application provides live updates of member activities and contributions using WebSocket technology.

## Overview

The GDSC Leaderboard tracks GitHub activities in real-time, displaying member contributions and achievements. It features a modern, responsive interface with live updates and secure backend integration.

## Experimental branch: Leaderboard 2.0

This branch revives the real-time pipeline and adds a lot on top of it. You can run it locally with no MongoDB and no ngrok:

```bash
# 1. Build the frontend once (the server serves it)
cd gdsc-leaderboard && npm install && npm run build

# 2. Start the server. With no MONGODB_URI it uses an in-memory store seeded from FINAL-LIST.json
cd ../Server && npm install && GITHUB_SECRET=demo npm start

# 3. Open http://localhost:5000/?live=http://localhost:5000

# 4. In another terminal, fire signed fake "merged PR" webhooks and watch the board react
GITHUB_SECRET=demo npm run simulate -- --count 30 --interval 1500
```

**Look and feel**
- A hand-written WebGL shader replaces particles.js: an aurora sky, a striped synthwave sun and a neon grid floor, with a glow that follows the cursor (`src/components/ShaderBackground.jsx`). With reduced motion it renders one still frame
- Floating glass nav with an animated rainbow border, a sliding active tab and a live clock, plus a news ticker built from the standings
- `Ctrl/⌘ K` command palette: jump to any team or page, switch theme, go live
- Glitching title, glass cards, a cursor spotlight on rows, dark by default
- HYPER MODE: the ⚡ button or the Konami code (↑↑↓↓←→←→BA)

**Frontend**
- Animated podium for the top 3 with confetti, a stats strip, and count-up scores
- Tied scores share a rank (1, 2, 2, 4). Disqualified teams sit in their own collapsed section instead of being ranked last
- Per-team score breakdown (points per difficulty plus time bonus or penalty), GitHub link, and a copyable deep link (`/#team-slug`)
- `?live` streams from a server over Socket.IO, with rank-change toasts and ▲▼ / +points markers. Without it, the static final results are shown and nothing touches the network
- `/reveal` is an awards-show mode for a projector. It reveals teams from last place to first, with drumrolls for the podium and a countdown plus confetti for the champions (`Space` next, `←` back, `R` restart, `F` fullscreen)
- Press `/` to search and `Esc` to clear
- All scoring lives in `src/lib/leaderboard.js`, with tests (`npm test`)

**Backend fixes**
- Merged PRs were scored as `problems_solved.undefined` because the PR's difficulty labels were never read. They now are, and the hardest label wins
- `GET /api/leaderboard` was shadowed by the SPA catch-all route and returned `index.html`
- Webhooks are verified against `X-Hub-Signature-256` when `GITHUB_SECRET` is set
- GitHub redeliveries no longer double-count a PR
- Ctrl-C no longer crashes on an undefined `broadcastInterval`
- Pluggable `memory` / `mongo` store (`DATA_STORE`), plus API tests (`npm test`)

## Project Gallery

![image](https://github.com/user-attachments/assets/6117a5c5-78a0-42fa-b7a7-db23c0189009)
![image](https://github.com/user-attachments/assets/e1befd12-0ef3-42ec-97fd-33defd0306f5)

![image](https://github.com/user-attachments/assets/c6c367b5-986b-4a09-aa12-3af223f0f9da)
![image](https://github.com/user-attachments/assets/ee40640e-3a32-45d9-a8d2-181abfa544f6)


### Application Screenshots
1. Main Leaderboard Interface
2. Dark/Light Theme Variants
3. Mobile Responsive View
4. Achievement Badges Display

### Technical Diagrams
1. System Architecture Overview
2. Component Structure
3. Backend Architecture
4. Deployment Workflow
5. Performance Monitoring Dashboard

### Setup & Configuration
1. Ngrok Configuration
2. GitHub Webhook Setup
3. Testing Results

## Project Structure

```
├── Server/                 # Backend Node.js application
│   ├── config/            # Database and configuration settings
│   │   └── database.js    # MongoDB connection setup
│   ├── controllers/       # Request handlers and business logic
│   │   ├── githubController.js    # GitHub webhook handler
│   │   └── leaderboardController.js # Leaderboard data management
│   ├── services/          # Core business logic and services
│   │   └── websocketManager.js    # Real-time updates handler
│   ├── utils/            # Helper functions and utilities
│   └── server.js         # Main server configuration
│
├── gdsc-leaderboard/     # Frontend React application
│   ├── src/
│   │   ├── App.jsx       # Main application routing and layout
│   │   ├── LeaderBoard.jsx # Real-time leaderboard display
│   │   ├── Header.jsx    # Navigation and branding
│   │   ├── Theme.jsx     # Theme and styling configuration
│   │   └── assets/       # Images and static resources
│   ├── public/           # Static assets and index.html
│   └── vite.config.js    # Vite build configuration
```

## Features

### Real-time Updates
- WebSocket integration for instant updates
- Live contribution tracking
- Real-time score calculations
- Automatic leaderboard position updates

### User Interface
- Responsive design for all devices
- Dark/Light theme support
- Smooth animations and transitions
- Interactive user profiles
- Achievement badges and indicators

### Backend Architecture
- Secure API endpoints with Helmet protection
- MongoDB integration with change streams
- Efficient WebSocket broadcast system
- GitHub webhook integration
- Rate limiting and security measures

## Prerequisites

### Required Software
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm (v6 or higher) or yarn
- ngrok for local webhook testing

### Development Tools
- VS Code (recommended)
- MongoDB Compass (optional)
- Postman (for API testing)

## Detailed Setup Instructions

### 1. Backend Setup
```bash
# Clone the repository
git clone [your-repo-url]

# Navigate to server directory
cd Server

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure environment variables
# Edit .env with your MongoDB URI and other settings

# Start the server
npm start
```

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd gdsc-leaderboard

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure environment variables
# Edit .env with your API URL

# Start development server
npm run dev
```

### 3. Ngrok Configuration
1. Sign up for ngrok account
2. Download and install ngrok
3. Configure your authtoken:
   ```bash
   ngrok config add-authtoken [your-token]
   ```
4. Start ngrok tunnel:
   ```bash
   ngrok http 5000
   ```

### 4. GitHub Webhook Setup
1. Go to your GitHub repository settings
2. Navigate to Webhooks section
3. Add webhook:
   - Payload URL: Your ngrok URL
   - Content type: application/json
   - Events: Pull requests, Push, Issues

## Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GITHUB_SECRET=your_webhook_secret
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
```

## Testing

### Load Testing
The project includes comprehensive load testing setups:

#### K6 Stress Testing
```bash
k6 run k6-stress.js
```
- Tests WebSocket connections
- Simulates multiple users
- Measures response times

#### Artillery Load Testing
```bash
artillery run artillery.yml
```
- HTTP endpoint testing
- Concurrent user simulation
- Performance metrics

## Deployment

### Vercel Deployment (Static Frontend Only)
The application is optimized for Vercel deployment:
- Frontend: Auto-deployment from main branch
- Backend: Serverless function configuration
- Environment variable configuration
- Custom domain setup

### AWS Deployment (Deprecated)
-Nginx server setup for backend deployment
-Domain DuckDNS


## Performance Monitoring

- WebSocket connection metrics
- Database query performance
- API response times
- Real-time user count

