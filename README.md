# 🛡️ CryptoShield — Blockchain Risk Intelligence Platform

A full-stack web application that analyzes BSC tokens for scam and rug pull risks using live blockchain data.

## 📸 Features

- 🔍 Token Risk Analyzer — Scan any BSC token for rug pull and scam risks
- 📊 Live Price Chart — Real-time candlestick charts using Binance WebSocket data
- 🤖 AI Risk Summary — Plain English risk analysis powered by Groq AI
- 🔄 Alternative Suggestions — AI recommends potentially safer token alternatives
- 📋 Scan History — Stores previously analyzed token scans
- 📄 PDF Export — Download professional token risk reports
- 💡 Interactive Tooltips — Educational explanations for risk metrics and indicators


## 🔗 Live Demo

**Frontend:** https://cryptoshield-vivekb.netlify.app/

**Backend:** https://cryptoshield-backend-4l7u.onrender.com/

## 🛠️ Tech Stack

### Frontend
- React.js
- Recharts
- lightweight-charts
- jsPDF

### Backend
- Node.js
- Express.js

### Database
- SQLite

### APIs & Services
- BSCScan API
- DexScreener API
- Groq AI

### Deployment
- Netlify
- Render


## 🧮 How Risk Score is Calculated

CryptoShield uses a custom weighted risk scoring engine that analyzes on-chain token data across three categories: ownership concentration, liquidity depth, and smart contract security.

### 1. Developer Ownership Risk (Max 35 Points)

| Condition                       | Risk Points |
| ------------------------------- | ----------- |
| Top holder owns > 50% of supply | +35         |
| Top holder owns > 30% of supply | +20         |
| Top holder owns > 15% of supply | +10         |

### 2. Liquidity Risk (Max 25 Points)

| Condition             | Risk Points |
| --------------------- | ----------- |
| Liquidity < $1,000    | +25         |
| Liquidity < $10,000   | +18         |
| Liquidity < $50,000   | +10         |
| Liquidity < $100,000  | +5          |
| Liquidity unavailable | +20         |

### 3. Smart Contract Risk (Max 40 Points)

| Condition                       | Risk Points |
| ------------------------------- | ----------- |
| Mint function detected          | +15         |
| Blacklist function detected     | +10         |
| Honeypot pattern detected       | +10         |
| Self-destruct function detected | +10         |
| Pause function detected         | +8          |
| Max transaction restriction     | +5          |
| Adjustable fee manipulation     | +5          |
| Proxy/upgradeable contract      | +5          |
| Unverified contract source      | +25         |

### Final Safety Score

```text
Safety Score = 100 − Total Risk Points
```

| Score Range | Classification |
| ----------- | -------------- |
| 0 – 39      | Low Risk ✅     |
| 40 – 69     | Medium Risk ⚠️ |
| 70 – 100    | High Risk 🚨   |

### Wallet Reputation Analysis

Wallet reputation is evaluated separately using deployment activity and transaction behavior.

| Condition                            | Risk Points |
| ------------------------------------ | ----------- |
| Deployed > 10 contracts              | +50         |
| Deployed > 5 contracts               | +30         |
| Deployed > 2 contracts               | +15         |
| High transaction activity (>50 txns) | +20         |


## 📁 Project Structure

```text
cryptoshield/
│
├── backend/
│   ├── src/
│   │   ├── controllers/     # API request handlers
│   │   ├── routes/          # API routes
│   │   ├── services/        # BSCScan, DexScreener, Groq integrations
│   │   ├── risk/            # Custom risk scoring engine
│   │   ├── models/          # SQLite database operations
│   │   └── utils/           # Helper functions
│   │
│   ├── database.sqlite
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Application pages
│   │   ├── services/        # API communication
│   │   ├── assets/          # Images and static resources
│   │   └── App.js
│   │
│   └── public/
│
└── README.md
```