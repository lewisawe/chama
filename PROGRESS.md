# ChamaPesa — Build Progress & Setup Guide

## Phase 2 — AWS Deployment + Dashboard + M-Pesa Demo Features ✅
> Completed: 28 March 2026

### Infrastructure (AWS)
- **ECS Fargate** — backend (port 3000) and dashboard (port 3001) running as containers
- **RDS PostgreSQL 16** — encrypted, 7-day backups, private subnet
- **ALB** — routes `/api/*` to backend, everything else to dashboard
- **ECR** — container registry for both images
- **Secrets Manager** — all credentials (JWT, M-Pesa, B2C) stored securely, injected into ECS at runtime
- **Terraform** — full infra-as-code in `infra/`, deploy script at `deploy.sh`
- **Region:** `us-west-2`

### Dashboard Pages Built
| Page | Route | Features |
|------|-------|---------|
| Overview | `/dashboard` | Balance dominant header, contribution member grid as hero, M-Pesa live feed, AI insights teaser |
| Contributions | `/dashboard/contributions` | Cycle grid, filter, **Collect Now** (STK Push all members), **Verify** per pending row |
| Members | `/dashboard/members` | Invite by phone, trust score bars, **Trust Certificate modal** |
| Loans | `/dashboard/loans` | Full lifecycle view, **Repay STK Push** button per active loan |
| Motions | `/dashboard/motions` | Create motions, anonymous voting, live results |
| Pools | `/dashboard/pools` | Create pools, split allocation bar, interest display, money market info |
| Rotation | `/dashboard/rotation` | Drag-to-reorder, **Pay Out Now** (B2C to next member instantly) |
| AI Insights | `/dashboard/insights` | Simulated forecasts, roadmap — coming Q3 2026 |
| USSD | `/dashboard/ussd` | Interactive phone simulator, feature list — pilot Q3 2026 |
| Settings | `/dashboard/settings` | WhatsApp, PDF export, C2B paybill, IP whitelist — shown as coming soon |
| Member Overview | `/member` | Trust score, cycle status, STK Push with confirmation modal |
| Member Contributions | `/member/contributions` | History, pay with confirmation modal |
| Member Loans | `/member/loans` | Request loan, repay via STK Push |
| Member Motions | `/member/motions` | Vote anonymously |

### M-Pesa Features Wired
- STK Push — member contributions (manual + auto 8am cron)
- B2C — rotation payouts (manual "Pay out now" + auto 9am cron)
- B2C — loan disbursement (on vote pass)
- STK Push — loan repayment
- Transaction Status API — "Verify" button on pending contributions
- Callback handlers — STK and B2C update DB on Safaricom response
- Live M-Pesa transaction feed on dashboard home

### Cron Jobs Running
| Time | Job |
|------|-----|
| 7am daily | SMS contribution reminders |
| 8am daily | Auto STK Push to all members |
| 9am daily | Auto B2C payout to next rotation member |
| 11pm daily | Mark unpaid contributions as MISSED |
| Every 30min | Expire voting motions past deadline |
| 1am daily | Accrue pool interest |

### UX Improvements
- Role-based access — members redirected from treasurer dashboard to `/member`
- STK Push confirmation modal before any payment
- Friendly error messages (no raw API errors shown to users)
- Empty states with CTAs on all pages
- Mobile responsive — sidebar hidden on mobile, bottom nav bar shown
- Trust Certificate modal with "SMS delivery coming soon" note

### Security
- All secrets in AWS Secrets Manager — never in code or repo
- RDS in private subnet — not internet accessible
- `.env` and `secrets.tfvars` gitignored
- JWT required on all API endpoints

---

## Tomorrow's Agenda 📋
> 29 March 2026

### 1. New User Chama Creation Flow
Test and fix the full self-serve flow:
- Register → create chama → invite members → set rotation → set pool splits
- Identify any gaps or broken steps a real user would hit
- Add any missing UI (e.g. onboarding wizard, first-time setup guide)

### 2. Payouts Architecture Decision
**Central paybill vs per-chama paybill** — needs a decision:

| Approach | Pros | Cons |
|----------|------|------|
| **Central paybill (current)** | Simple, one Daraja account, works in sandbox | All chamas share one shortcode, harder to reconcile at scale |
| **Per-chama paybill** | Each chama has its own M-Pesa till/paybill, clean separation | Requires each chama admin to register a Safaricom till, complex onboarding |
| **Hybrid** | Central collection, per-chama virtual accounts | More complex backend, but scales well |

Current implementation uses a central shortcode (`174379` sandbox). For production, the decision affects:
- How contributions are reconciled (account reference = phone number vs chama ID)
- How B2C payouts are sourced (one org account vs per-chama float)
- Safaricom's requirements for going live

### 3. Deductions & Penalties
- Penalty for missed contributions (currently tracked but not auto-deducted)
- How penalties affect payout amount
- Whether penalties go to emergency fund or are waived by vote

---

## What's Been Built (Phase 1 — Core Backend) ✅

### Tech Stack
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL (via Docker)
- **ORM:** Prisma 6
- **Auth:** JWT + bcrypt PIN hashing
- **Payments:** Safaricom Daraja API (STK Push, B2C, Transaction Status)
- **SMS:** Africa's Talking (lazy-loaded, stubs when no API key)
- **Scheduling:** node-cron

### Project Structure
```
moneyInMotion/
├── ChamaPesa_Features.md          # Full feature spec
├── docker-compose.yml             # PostgreSQL container
├── backend/
│   ├── .env                       # API keys & config
│   ├── tsconfig.json
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma          # 12 models, 8 enums
│   ├── src/
│   │   ├── app.ts                 # Express entry point
│   │   ├── middleware/
│   │   │   └── auth.ts            # JWT authentication
│   │   ├── routes/
│   │   │   ├── auth.ts            # Register/Login
│   │   │   ├── chama.ts           # CRUD, invite, rotation
│   │   │   ├── contribution.ts    # Pay via STK Push, history
│   │   │   ├── mpesa.ts           # STK + B2C callbacks
│   │   │   ├── loan.ts            # Request (trust check → auto vote)
│   │   │   ├── motion.ts          # Anonymous voting + auto-execute
│   │   │   └── pool.ts            # Create pools, manage splits
│   │   ├── services/
│   │   │   ├── mpesa.ts           # Daraja API integration
│   │   │   ├── sms.ts             # Africa's Talking SMS
│   │   │   └── trustScore.ts      # Weighted score engine
│   │   ├── jobs/
│   │   │   └── scheduler.ts       # Cron jobs
│   │   ├── types/
│   │   │   └── africastalking.d.ts
│   │   └── utils/
│   │       └── prisma.ts          # DB client singleton
│   └── dist/                      # Compiled JS output
```

---

## How to Get Everything Running

### Prerequisites
- Node.js 22+
- Docker & Docker Compose
- PostgreSQL client (psql) — optional, for debugging

### Step 1: Start the Database
```bash
cd /home/sierra/Desktop/projects/moneyInMotion
docker-compose up -d
```
This starts PostgreSQL on `localhost:5432` with:
- User: `chamapesa`
- Password: `chamapesa`
- Database: `chamapesa`

### Step 2: Configure Environment
Edit `backend/.env` and fill in your API keys:
```env
DATABASE_URL="postgresql://chamapesa:chamapesa@localhost:5432/chamapesa"
PORT=3000
JWT_SECRET="change-this-to-a-real-secret"

# Safaricom Daraja (get from developer.safaricom.co.ke)
MPESA_CONSUMER_KEY="your-key"
MPESA_CONSUMER_SECRET="your-secret"
MPESA_PASSKEY="your-passkey"
MPESA_SHORTCODE="174379"
MPESA_B2C_SHORTCODE=""
MPESA_B2C_INITIATOR=""
MPESA_B2C_PASSWORD=""
MPESA_ENV="sandbox"
MPESA_CALLBACK_URL="https://your-ngrok-url/api/mpesa/callback"

# Africa's Talking (get from africastalking.com)
AT_API_KEY="your-key"
AT_USERNAME="sandbox"
AT_SENDER_ID=""
```

### Step 3: Install Dependencies & Sync Database
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
```

### Step 4: Run the Server
```bash
# Development (auto-reload)
npm run dev

# Or production
npm run build
npm start
```

### Step 5: Verify
```bash
curl http://localhost:3000/health
# → {"status":"ok"}
```

---

## API Endpoints Reference

### Auth
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | `{phone, name, pin}` | Register new user |
| POST | `/api/auth/login` | `{phone, pin}` | Login, returns JWT |

### Chamas (all require `Authorization: Bearer <token>`)
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/chamas` | `{name, contributionAmount, frequency, nextContributionDate}` | Create chama (auto-creates 2 default pools) |
| GET | `/api/chamas` | — | List my chamas |
| GET | `/api/chamas/:id` | — | Get chama details with members, pools, rotation |
| POST | `/api/chamas/:id/invite` | `{phone}` | Invite member by phone |
| POST | `/api/chamas/:id/rotation` | `{memberIds: [...]}` | Set merry-go-round order |

### Contributions
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/contributions/pay` | `{chamaId}` | Trigger M-Pesa STK Push |
| GET | `/api/contributions/chama/:chamaId` | — | All contributions for a chama |
| GET | `/api/contributions/mine/:chamaId` | — | My contributions |

### Loans
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/loans/request` | `{chamaId, amount}` | Request loan (checks trust score ≥ 50, auto-creates vote) |
| GET | `/api/loans/chama/:chamaId` | — | All loans for a chama |
| GET | `/api/loans/mine` | — | My loans across all chamas |

### Motions & Voting
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/motions` | `{chamaId, type, description, threshold?, deadlineHours?}` | Create motion |
| POST | `/api/motions/:id/vote` | `{vote: true/false}` | Cast anonymous vote |
| GET | `/api/motions/:id` | — | Motion details (results hidden until closed) |
| GET | `/api/motions/chama/:chamaId` | — | All motions for a chama |

### Pools
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/pools` | `{chamaId, name, targetAmount?, contributionSplit, withdrawalMethod?, lockMonths?}` | Create pool (admin only) |
| GET | `/api/pools/chama/:chamaId` | — | List pools |
| PUT | `/api/pools/splits/:chamaId` | `{splits: [{poolId, contributionSplit}]}` | Update splits (must total 100%) |

### M-Pesa Callbacks (no auth — called by Safaricom)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mpesa/callback/stk` | STK Push result → updates contribution/loan status |
| POST | `/api/mpesa/callback/b2c/result` | B2C result → updates payout/loan disbursement |
| POST | `/api/mpesa/callback/b2c/timeout` | B2C timeout handler |

### Automated Cron Jobs
| Schedule | Job | Description |
|----------|-----|-------------|
| 7am daily | Contribution reminders | SMS reminder for tomorrow's due contributions |
| 8am daily | Auto-collection | STK Push to all members on contribution day |
| 9am daily | Process payouts | B2C to next rotation member when all paid |
| 11pm daily | Mark missed | Flag unpaid contributions as MISSED |
| Every 30min | Expire motions | Close voting past deadline |

---

## Database Models (Prisma Schema)

| Model | Purpose |
|-------|---------|
| User | Phone, name, hashed PIN |
| Chama | Name, contribution amount, frequency, penalty rate |
| ChamaMember | User↔Chama link, role (ADMIN/TREASURER/MEMBER), trust score |
| Pool | Goal-based pools with split %, withdrawal rules, lock period |
| Contribution | Per-member payment records with M-Pesa receipt |
| Rotation | Merry-go-round order and payout tracking |
| Loan | Loan lifecycle: requested → voting → approved → disbursed → repaying → repaid |
| LoanRepayment | Individual repayment records |
| Motion | Voteable proposals with type, threshold, deadline |
| Vote | Anonymous votes (unique per user per motion) |
| MpesaTransaction | Full audit trail of all M-Pesa interactions |

### Trust Score Weights
| Factor | Weight |
|--------|--------|
| On-time contributions | 40% |
| Loan repayment | 25% |
| Chama tenure | 15% |
| Voting participation | 10% |
| Penalty history (fewer = better) | 10% |

---

## Future Steps

### Phase 2 — Treasurer Dashboard (Next.js) 🔜
- [ ] Next.js app with Tailwind CSS
- [ ] Login page (phone + PIN)
- [ ] Dashboard home: financial overview, pool balances, collection status
- [ ] Member management: list, invite, view trust scores
- [ ] Contribution grid: who paid, pending, missed per cycle
- [ ] Rotation schedule view + drag-to-reorder
- [ ] Loan management: pending requests, active loans, repayment tracking
- [ ] Motion/voting management: create motions, view results
- [ ] Pool management: create, configure splits, view balances
- [ ] Export reports (CSV/PDF)

### Phase 3 — USSD Self-Service (Africa's Talking)
- [ ] USSD menu for members without smartphones
- [ ] Check balance, view trust score
- [ ] Request loan via USSD
- [ ] Vote via USSD (SMS fallback already supported)

### Phase 4 — M-Pesa Sandbox Testing
- [ ] Set up ngrok for callback URLs
- [ ] Test STK Push flow end-to-end
- [ ] Test B2C payout flow
- [ ] Test C2B manual payment (paybill)
- [ ] Handle edge cases: timeout, insufficient funds, wrong PIN

### Phase 5 — Advanced Features
- [ ] Savings & interest: sweep idle pool funds to money market (KCB/NCBA API)
- [ ] Daily interest accrual: `available_balance × (annual_rate / 365)`
- [ ] End-of-cycle dividend calculation and B2C distribution
- [ ] Smart penalties: graduated penalty system
- [ ] Trust Certificate: SMS-based portable trust score
- [ ] C2B integration: manual paybill payments auto-matched to contributions

### Phase 6 — Production Hardening
- [ ] Input validation (zod/joi on all routes)
- [ ] Rate limiting
- [ ] Request logging (winston/pino)
- [ ] Error monitoring (Sentry)
- [ ] Database migrations (switch from db push to prisma migrate)
- [ ] Environment-based config
- [ ] HTTPS + security headers
- [ ] M-Pesa callback IP whitelisting
- [ ] Idempotency keys for payment operations

### Phase 7 — Future Roadmap
- [ ] WhatsApp Business API for notifications & voting
- [ ] Chama-to-Chama lending (inter-chama money market)
- [ ] AI-powered financial insights via SMS
- [ ] Mobile app (React Native)

---

## Kiro Skills Available (.kiro/skills/)

Design-focused skills ready to use when building the dashboard:

| Skill | When to Use |
|-------|-------------|
| `teach-impeccable` | **Run first** — sets up project design guidelines for all other skills |
| `frontend-design` | Building pages, components, the dashboard itself |
| `critique` | Review & score a design from UX perspective |
| `audit` | Accessibility, performance, technical quality checks |
| `arrange` | Fix layout, spacing, visual hierarchy |
| `adapt` | Responsive design, mobile breakpoints |
| `typeset` | Typography, fonts, readability |
| `colorize` | Add strategic color, make UI more vibrant |
| `animate` | Micro-interactions, transitions, motion |
| `polish` | Final quality pass before shipping |
| `harden` | Error handling, i18n, edge cases |
| `clarify` | Improve UX copy, labels, error messages |
| `onboard` | Onboarding flows, empty states |
| `extract` | Pull reusable components into design system |
| `normalize` | Align to design system standards |
| `optimize` | Performance, loading, bundle size |
| `delight` | Add personality, memorable touches |
| `bolder` / `quieter` | Dial visual intensity up or down |
| `distill` | Simplify, declutter, reduce noise |
| `overdrive` | Technically ambitious effects (shaders, physics) |

### Recommended order for dashboard build:
1. `teach-impeccable` — establish ChamaPesa design identity
2. `frontend-design` — build the pages
3. `arrange` + `typeset` + `colorize` — nail the layout & visual style
4. `adapt` — make it responsive
5. `animate` + `delight` — add life
6. `clarify` + `onboard` — polish the copy & empty states
7. `harden` — production-ready error handling
8. `audit` + `critique` — final review & scoring
9. `polish` — ship it

---

## Useful Commands

```bash
# Database
docker-compose up -d              # Start PostgreSQL
docker-compose down               # Stop PostgreSQL
npx prisma studio                 # Visual DB browser (http://localhost:5555)
npx prisma db push                # Sync schema changes
npx prisma generate               # Regenerate client after schema changes

# Development
cd backend && npm run dev          # Start with auto-reload
cd backend && npm run build        # Compile TypeScript
cd backend && npm start            # Run compiled JS

# Testing M-Pesa (when ready)
ngrok http 3000                    # Expose localhost for callbacks
```
