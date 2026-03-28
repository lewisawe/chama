# ChamaPesa

Smart chama (savings group) manager for Kenya. Automates M-Pesa collections, rotating payouts, goal-based savings pools, loan management, and anonymous voting.

## Requirements

- Node.js 22+
- Docker & Docker Compose
- ngrok (for M-Pesa callbacks)

## Installation

```bash
# 1. Clone and install dependencies
cd backend && npm install
cd ../dashboard && npm install

# 2. Start PostgreSQL
cd .. && docker-compose up -d

# 3. Push database schema
cd backend && npx prisma db push

# 4. Seed demo data (optional)
npm run seed
```

## Configuration

Copy `.env.example` to `.env` in the `backend/` folder and fill in:

```env
DATABASE_URL="postgresql://chamapesa:chamapesa@localhost:5432/chamapesa"
JWT_SECRET="change-this"

MPESA_CONSUMER_KEY="..."
MPESA_CONSUMER_SECRET="..."
MPESA_PASSKEY="bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"  # Safaricom's public sandbox passkey
MPESA_SHORTCODE="174379"
MPESA_ENV="sandbox"
MPESA_CALLBACK_URL="https://your-ngrok-url/api/mpesa/callback"
```

Get Daraja credentials at [developer.safaricom.co.ke](https://developer.safaricom.co.ke).

## Running

```bash
# Terminal 1 — expose backend for M-Pesa callbacks
ngrok http 3000

# Terminal 2 — backend API
cd backend && npm run dev

# Terminal 3 — dashboard
cd dashboard && npm run dev
```

- Backend: http://localhost:3000
- Dashboard: http://localhost:3001
- Landing page: http://localhost:3001/landing

## Demo credentials (after seeding)

| Name | Phone | PIN | Role |
|------|-------|-----|------|
| Amina Wanjiku | 0712345678 | 1234 | Admin |
| Brian Otieno | 0723456789 | 1234 | Treasurer |
| Cynthia Muthoni | 0734567890 | 1234 | Member |

## API

Health check: `GET /health`

See [PROGRESS.md](./PROGRESS.md) for full API reference.

---

## AWS Deployment

ChamaPesa runs on AWS using ECS Fargate (containers), RDS PostgreSQL, and an Application Load Balancer. All infrastructure is defined in `infra/` using Terraform.

### Architecture

```
Internet → ALB → /api/* → ECS Fargate (backend:3000)
                → /*    → ECS Fargate (dashboard:3001)
                              ↓
                         RDS PostgreSQL (private subnet)
                              ↓
                         Secrets Manager (credentials)
```

### Prerequisites

- AWS CLI configured (`aws configure`)
- Terraform 1.5+
- Docker

### First-time setup

```bash
# 1. Create secrets.tfvars (never commit this)
cat > infra/secrets.tfvars <<EOF
db_password           = "your-db-password"
jwt_secret            = "$(openssl rand -base64 48)"
mpesa_consumer_key    = "your-daraja-key"
mpesa_consumer_secret = "your-daraja-secret"
mpesa_passkey         = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
mpesa_b2c_shortcode   = "600000"
mpesa_b2c_initiator   = "testapi"
mpesa_b2c_password    = "your-b2c-security-credential"
EOF

# 2. Provision infrastructure
cd infra
terraform init
terraform apply -var-file="secrets.tfvars"

# 3. Build and deploy containers
cd ..
./deploy.sh
```

### Subsequent deploys

```bash
./deploy.sh
```

Builds both Docker images, pushes to ECR, and forces ECS to redeploy.

### Seed demo data

After first deploy, run the seed as a one-off ECS task:

```bash
aws ecs run-task \
  --cluster chamapesa-cluster \
  --launch-type FARGATE \
  --task-definition chamapesa-backend \
  --network-configuration "awsvpcConfiguration={subnets=[<private-subnet-id>],securityGroups=[<ecs-sg-id>],assignPublicIp=DISABLED}" \
  --overrides '{"containerOverrides":[{"name":"backend","command":["npx","ts-node","prisma/seed.ts"]}]}' \
  --region us-west-2
```

Or get subnet/SG IDs from `terraform output`.

### Infrastructure components

| Component | Details |
|-----------|---------|
| ECS Cluster | `chamapesa-cluster` — Fargate, no servers to manage |
| Backend service | 0.5 vCPU / 1GB RAM, auto-restarts on failure |
| Dashboard service | 0.5 vCPU / 1GB RAM, Next.js standalone |
| RDS | PostgreSQL 16.13, db.t3.micro, encrypted at rest |
| ALB | Routes `/api/*` and `/health` to backend, all else to dashboard |
| Secrets Manager | One secret per credential — injected as env vars at runtime |
| ECR | `chamapesa-backend` and `chamapesa-dashboard` repositories |
| VPC | 2 public subnets (ALB), 2 private subnets (ECS + RDS), NAT gateway |

### Secrets management

All credentials are stored in AWS Secrets Manager — never in code or environment files. The ECS task execution role has IAM permission to fetch them at container startup.

To rotate a secret:
```bash
# Update secrets.tfvars, then:
cd infra && terraform apply -var-file="secrets.tfvars"
# Force ECS to restart and pick up new values:
aws ecs update-service --cluster chamapesa-cluster --service chamapesa-backend --force-new-deployment --region us-west-2
```

### Tear down

```bash
cd infra && terraform destroy -var-file="secrets.tfvars"
```
