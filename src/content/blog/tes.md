---
title: tes
description: test
pubDate: 2026-10-09
updatedDate: 2026-10-09
author: EZ Order team
draft: false
---
# Deployment Guide

**Last Updated**: 2026-04-19  
**Environments**: Development, Staging, Production

Docker-based deployment with Kubernetes orchestration. Covers local development, CI/CD pipelines, and production infrastructure.

---

## Local Development Setup

### Prerequisites
- Docker 20.10+ and docker-compose 2.0+
- Node.js 23+
- Shopify CLI 3.58+

### Quick Start

```bash
# Clone & install dependencies
git clone <repo>
cd invoice_new
npm install
cd app && npm install && cd ../app/frontend && npm install && cd ../../

# Copy environment template
cp .env.example .env
# Edit .env with:
# - SHOPIFY_API_KEY, SHOPIFY_API_SECRET
# - MONGODB_URI (or use docker-compose)
# - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
# - REDIS_HOST, REDIS_PASSWORD (or use docker-compose)

# Start MongoDB + Redis via docker-compose
docker-compose up -d

# Start dev servers (backend + frontend)
npm run dev

# Access:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:8600/api
# - BullBoard (queue dashboard): http://localhost:8600/api/queues
```

### docker-compose.yaml

Services:
- **MongoDB 8.0.15**: Replica set enabled, initialized via `.docker/db-credential.sh`
  - Port: `${DB_PORT}` (default 3317)
  - Health check: MongoDB ping every 30s
  - Volume: `uppush` (persistent data)
  - Network: `invoice_network` (external)

- **Redis 8.0**: Lightweight cache + BullMQ backing
  - Port: `${REDIS_PORT}` (default 3379)
  - Health check: `redis-cli ping` every 30s
  - Volume: `.docker/data/redis` (persistent)
  - Network: `invoice_network`

**Note**: `invoice_network` is external (created separately). If not exists, create manually:
```bash
docker network create invoice_network
```

---

## Docker Image Build

### Dockerfile (Production)

**Base Image**: `node:22-bookworm-slim` — Debian, not Alpine.

Puppeteer against a musl Chromium is unsupported, and the Noto font packages
below only exist on Debian. Those fonts are a **correctness** requirement, not
polish: invoices render in 12 locales including `ja`/`zh`/`ko`/`ar`/`he`, and a
missing script prints as tofu boxes in the merchant's PDF with no error raised
anywhere. Verified coverage in the image: ja/zh/ko 30 families each, ar 12,
he 8, hi 4, th 6, plus colour emoji.

**Runtime packages**: `chromium`, `dumb-init`, `fonts-noto-core`,
`fonts-noto-cjk`, `fonts-noto-color-emoji`, `ca-certificates`.

- `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` — `puppeteer-core` ships no
  browser of its own.
- `dumb-init` as PID 1 reaps the child processes Chromium spawns; without it
  they accumulate as zombies for the life of the pod.
- Runs as the non-root `node` user. Chromium uses `--no-sandbox`, so the
  container is the isolation boundary.

### Two targets, one Dockerfile

The Dockerfile emits **two images** from a single `builder` stage, matching the
`APP_ROLE` split. Only the render image carries Chromium and the fonts; the API
image is the one that scales with merchant traffic, so keeping it small is what
makes scale-up fast on a cold node.

| Target | Size (measured) | Contains |
|---|---|---|
| `api` | **783 MB** | Node + app + SPA bundle. No browser, no fonts. |
| `render` | **2.01 GB** | The above plus Chromium 151 and the Noto font set. |

Stages: `builder` → `runtime-base` (dumb-init, ca-certificates) →
`chromium-base` (browser + fonts) → `api` / `render`.

The apt layer sits **above** the app `COPY` layers on purpose: a code change
must not invalidate the ~860 MB Chromium/font layer.

`render` is the last stage, so a plain `docker build` with no `--target` yields
the full image. Running the render image as the API works (just heavier); the
reverse fails at the first PDF request.

**Entrypoint**: `node dist/src/main` — *not* `dist/main`. The TypeScript program
root spans `app/src` **and** the frontend render components that
`template-registry.ts` imports, so tsc keeps the `src/` path segment. Both
images bake a default `APP_ROLE`, so a deployment cannot forget to set it.

> `.dockerignore` must exclude `app/node_modules`: `COPY app .` runs after
> `npm ci`, so a host `node_modules` would clobber the Linux install with
> macOS-native binaries (sharp, bcrypt).

**Build Commands**:
```bash
ARGS="--build-arg VITE_SHOPIFY_API_KEY=$SHOPIFY_API_KEY \
      --build-arg VITE_CDN_URL=$CDN_URL"

docker build $ARGS --target api    -t $CI_REGISTRY_IMAGE/api:$CI_COMMIT_SHA .
docker build $ARGS --target render -t $CI_REGISTRY_IMAGE/render:$CI_COMMIT_SHA .
```

The second build reuses the first one's cached `builder` layers, so it costs
little more than the extra export. **Always tag both from the same commit SHA** —
that is what keeps the two roles from drifting apart.

**Required BuildArgs**:
- `VITE_SHOPIFY_API_KEY` — Shopify client ID, compiled into the SPA bundle.
  Verified end to end: it lands in the built `index.html` as
  `<meta name="shopify-api-key">`. The build linter flags it as a secret; it is
  not — it is public by design.
- `VITE_CDN_URL` — CDN endpoint (or empty string)

**Sentry BuildArgs** (optional — without them the build still passes, Sentry just stays off):
- `VITE_SENTRY_DSN` — public DSN, compiled into the bundle. Not a secret.
- `VITE_SENTRY_ENVIRONMENT` — CI passes `$CI_ENVIRONMENT_NAME`. Events are sent
  only when it is `production` (`REPORTING_ENVIRONMENTS` in `frontend/src/sentry.ts`).
- `VITE_SENTRY_RELEASE` — CI passes `$CI_COMMIT_SHA`. The same value tags both
  `Sentry.init()` and the sourcemap upload, so stack traces map back to `.tsx`.
- `SENTRY_ORG`, `SENTRY_PROJECT` — target of the sourcemap upload.
- `SENTRY_AUTH_TOKEN` — **secret**, passed as a BuildKit secret, never an ARG:
  `--secret id=sentry_auth_token,src=/tmp/sentry_auth_token`.

Sourcemaps are uploaded only when all of the above are set and the environment
is `production`. They are built as `hidden` (no `sourceMappingURL` in the
bundle) and every `.map` is deleted from `frontend/dist` after upload, so none
reach the public CDN.

### Vulnerability posture

`npm audit` is clean in both `app` and `app/frontend` (0 findings, any severity).
The only critical/high CVEs left in the images are OS packages:

| Image | Critical/High | What |
|---|---|---|
| `api` | 5 | `perl` 4, `openssl` 1 |
| `render` | 6 | the above plus `tiff` 1 (a Chromium dependency) |

Down from 53 and 54 respectively. The npm and yarn CLIs are deleted from
`runtime-base` — the image only ever runs `node dist/src/main`, and their own
dependency trees were contributing findings for no benefit.

`perl` cannot be removed on Debian (`perl-base` is Essential). An Alpine base
would take the API image to **0** CVEs, but measurements show Alpine's
`chromium` package pulls in `ffmpeg`, `cjson`, `libsndfile` and `libvpx`, which
puts the render image at **16** — worse than Debian's 6. If the API image is ever
moved to Alpine, keep render on Debian.

### Chromium version policy

`apt install chromium` floats with Debian (currently 151.0.7922.137). Images are
tagged per commit SHA, so anything already deployed is frozen; only two builds
taken weeks apart can differ. That trade is deliberate — pinning the apt version
breaks builds as soon as Debian drops the old package from its repo. Cover it
with a PDF smoke test in CI rather than a version pin.

---

## CI/CD Pipeline (.gitlab-ci.yml)

### GitLab CI Stages

**Stage 1: Build**

#### `build_testing` (trigger: develop branch)
```yaml
build_testing:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_PROFILE_TOKEN $CI_REGISTRY
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA ...
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  only:
    - develop
  changes:
    - Dockerfile
    - .gitlab-ci.yml
    - app/src/**
    - app/package*.json
    - app/frontend/src/**
    - app/frontend/package.json
```

#### `build_production` (trigger: master branch, manual)
```yaml
build_production:
  stage: build
  image: docker:latest
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA ...
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  only:
    - master
  when: manual
```

**Stage 2: Deploy**

#### `deploy_testing` (SSH to dev server)
```yaml
deploy_testing:
  stage: deploy
  image: alpine:latest
  script:
    - ssh -i $SSH_PRIVATE_KEY $SERVER_USERNAME@$SERVER_IP_ADDRESS
      "cd /apps/invoice && docker-compose restart"
  only:
    - develop
```

#### `deploy_production` (GitOps via Helm)
```yaml
deploy_production:
  stage: deploy
  image: alpine:latest
  script:
    # Clone deployment repo
    - git clone https://git.company.com/uppush/deployment.git
    # Update Helm values (image tag)
    - sed -i "s/image:.*/image: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA/" ...
    # Commit & push (triggers Flux CD)
    - git -C deployment config user.email "ci@company.com"
    - git -C deployment add .
    - git -C deployment commit -m "Deploy invoice-app:$CI_COMMIT_SHA"
    - git -C deployment push
  only:
    - master
```

### Required GitLab CI Variables (Secrets)
```
CI_REGISTRY_USER             # GitLab registry username
CI_PROFILE_TOKEN             # GitLab access token
SHOPIFY_API_KEY              # Shopify app client ID
VITE_CDN_URL                 # CDN endpoint (optional)
SHOPIFY_EXT_THEME_UUID       # Theme extension UUID
SSH_PRIVATE_KEY              # SSH key for dev server
SERVER_USERNAME              # Dev server username (ubuntu)
SERVER_IP_ADDRESS            # Dev server IP
NAMESPACE                    # K8s namespace (prod)
CI_REGISTRY_IMAGE            # Registry image URL
CI_PROJECT_NAME              # Project name
VITE_SENTRY_DSN              # Sentry DSN (public, optional)
SENTRY_ORG                   # Sentry org slug (sourcemap upload)
SENTRY_PROJECT               # Sentry project slug (sourcemap upload)
SENTRY_AUTH_TOKEN            # Sentry auth token — Masked, Protected
```

---

## Runtime Roles (api / render)

One image, one commit SHA, **two Deployments**. `APP_ROLE` selects the root
module at bootstrap (`app/src/app-role.ts`); an unknown value throws rather than
falling back, so a typo crash-loops instead of silently leaving every queue
without a consumer.

| | `APP_ROLE=api` (default) | `APP_ROLE=render` |
|---|---|---|
| HTTP routes | everything except PDF | PDF/download only |
| BullMQ consumers | none — enqueues only | all of them |
| Chromium | never launched | yes |
| Serves the SPA | yes | no |
| `/api/health` | yes | yes |
| Memory | 320Mi request / 640Mi limit | 512Mi request / **2Gi limit** |
| CPU | 100m request / 500m limit | 150m request / 1500m limit |
| `/dev/shm` | n/a | n/a — Chromium runs with `--disable-dev-shm-usage` (`render.service.ts`), so it writes to `/tmp`, not `/dev/shm` |

Splitting them means a bulk print storm cannot degrade merchant-facing latency,
and a Chromium OOM takes out a render pod instead of the API.

### Ingress routing

Route these prefixes to the **render** Service; everything else goes to **api**:

```
/api/order/download
/api/order/download-multiple
/api/order/embedded-download
/api/draft-order/download
/api/draft-order/download-multiple
/api/template-setting/test-print
```

That is the complete set of Chromium-backed routes — the api role does not
register them, so a misrouted request returns 404 rather than launching a
browser on a pod without the headroom for one.

### Bulk limits

`MAX_BULK_ORDERS` (`app/src/modules/render/render.service.ts`) caps one request
at 100 documents and returns `413 Payload Too Large` above that. The browser is
also recycled after 200 pages or 30 minutes, whichever comes first, because
headless Chrome grows steadily and a pod that never restarts drifts into its
memory limit.

---

## Kubernetes Deployment (Production)

### Helm Values

**Namespace**: `ez-order` (production)

**Replicas**: owned by the HPAs, not the Deployments — api 2–3, render 1–2
(`flux-cd/values.yaml`). The Deployments deliberately omit `replicas` so a
reconcile does not fight the autoscaler.

Both HPAs scale on **CPU only**. A Node process sits on un-GC'd heap that does not
track load, so a memory target scales an idle pod up and then never has a reason to
bring it back down.

**`maxReplicas` is a budget, not a scheduling limit.** The cluster runs **EKS Auto
Mode** (`computeConfig.enabled: true`, node pools `general-purpose` + `system`), so a
pod that does not fit existing nodes does not sit `Pending` — Auto Mode provisions a
node for it. Neither built-in node pool sets `spec.limits`, so nothing on the cluster
side caps that; only EC2 service quotas do.

That inverts what the HPA ceiling means. Setting it too high does not surface as
Pending pods — it surfaces on the bill, and only later. Two costs stack:

1. the EC2 on-demand price of the new node, and
2. the **EKS Auto Mode management fee**, charged per instance-hour *on top of* EC2
   and varying by instance type (order of ~12% of on-demand; see the EKS pricing
   page for the current per-type rate).

Capacity today is two `m6a.large` from the managed node group
`uppush-nodegroup-m6a-large` (min 2 / desired 2 / max 4). That node group does **not**
autoscale on its own — an ASG has no notion of an unschedulable pod, and a Pending pod
consumes no CPU, so no ASG metric policy would ever fire. It is a fixed baseline; Auto
Mode supplies the elastic layer above it.

The `uppush` and `order-limit` namespaces already request ~80% of those two nodes,
leaving ~780m of CPU requests free. At full scale-out this chart requests 600m, so it
fits the existing nodes without provisioning anything — deliberate, while the app is
pre-launch. Raising the ceilings is a two-line change in `values.yaml` once there is
real traffic to justify the spend.

For reference, `uppush-app` — the same Node/Nest Shopify stack — serves production
on 3 pods using 2–22m CPU and ~190Mi RSS each, so 3×100m is several multiples of
realistic load.

**What Auto Mode launches.** Nodes come from the `general-purpose` pool (the `system`
pool carries a `CriticalAddonsOnly` taint these pods do not tolerate), constrained to:
on-demand only, **C/M/R families, generation ≥ 5, `amd64`**. Within that set Karpenter
bin-packs the pending pods and picks the cheapest instance that fits, so a new node is
usually **not** another `m6a.large` — for one small pod it will reach for something
smaller and newer. Do not assume node shape is stable.

**Images**: `$CI_REGISTRY_IMAGE/api:$CI_COMMIT_SHA` and
`$CI_REGISTRY_IMAGE/render:$CI_COMMIT_SHA` — always the same SHA. Built by
`build_production` from two `--target`s of the one Dockerfile; `deploy_production`
renders `flux-cd/` and pushes the manifests to the GitOps repo.

**Environment Variables** (ConfigMap):
```yaml
NODE_ENV: production
PORT: 8080
# APP_ROLE is baked into each image; override only to debug.
SHOPIFY_API_KEY: <from sealed-secret>
SHOPIFY_API_SECRET: <from sealed-secret>
MONGODB_URI: <from sealed-secret>
REDIS_HOST: redis-master
REDIS_PASSWORD: <from sealed-secret>
AWS_REGION: us-east-1
AWS_S3_BUCKET: invoice-prod-storage
```

### Sealed Secrets (kubeseal)

Encrypt sensitive credentials before committing to git:

```bash
# Generate sealed secret for MongoDB URI
echo -n "mongodb+srv://user:pass@cluster.mongodb.net/invoice?..." \
  | kubeseal -f - \
  > deployment/sealed-secrets/mongodb-uri.sealed.yaml

# Apply in cluster
kubectl apply -f deployment/sealed-secrets/mongodb-uri.sealed.yaml
```

**kubeseal Setup**:
1. Install sealed-secrets controller in cluster
2. Export public certificate: `kubeseal --fetch-cert > public.pem`
3. Use for sealing: `kubeseal --format yaml --cert public.pem < secret.yaml > sealed.yaml`

### Health Checks

**Liveness Probe** (restart pod if unhealthy):
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
```

**Readiness Probe** (remove from load balancer):
```yaml
readinessProbe:
  httpGet:
    path: /api/health
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
```

There is only one health route. `/api/health` is registered by both roots, so it
proves the process is answering — not which role it is. To confirm the role, read
the `Started with APP_ROLE=…` line the bootstrap logs (`main.ts`).

### Storage

**Persistent Volumes** (if needed for temp files):
```yaml
- name: temp-files
  emptyDir: {}
  mountPath: /tmp/invoices
```

---

## MongoDB Replica Set Initialization

### Local Setup (docker-compose)

**Script**: `.docker/db-credential.sh`
```bash
#!/bin/bash
mongosh --port $MONGODB_PORT <<EOF
  use admin;
  rs.initiate({
    _id: "invoice-rs",
    members: [
      { _id: 0, host: "mongo:27017", priority: 3 }
    ]
  });
  
  db.createUser({
    user: "$DB_USERNAME",
    pwd: "$DB_PASSWORD",
    roles: [{ role: "dbOwner", db: "$DB_NAME" }]
  });
  
  db.grantRolesToUser("$DB_USERNAME", [
    { role: "readWriteAnyDatabase", db: "admin" },
    { role: "dbAdminAnyDatabase", db: "admin" }
  ]);
EOF
```

**Env Vars** (`.env`):
```
DB_ROOT_USER=root
DB_ROOT_PASSWORD=<secure-password>
DB_USERNAME=invoice
DB_PASSWORD=<secure-password>
DB_NAME=invoice_db
DB_PORT=3317
MONGODB_URI=mongodb://invoice:password@mongo:27017/invoice_db
```

### Production Setup (MongoDB Atlas)

Use managed MongoDB Atlas cluster:
- Create cluster with 3+ nodes (HA)
- Enable backup (daily snapshots)
- Configure IP whitelist
- Use SRV connection string in `MONGODB_URI`

---

## AWS Configuration

### S3 Bucket

**Bucket Name**: `invoice-prod-storage` (or per-env)

**Configuration**:
```
- Region: us-east-1
- Versioning: Enabled
- Server-side encryption: SSE-S3 (default)
- Block public access: Enabled
- CORS:
  [{ "AllowedOrigins": ["https://app.pushup.io"],
     "AllowedMethods": ["GET", "PUT"],
     "AllowedHeaders": ["*"],
     "MaxAgeSeconds": 3600 }]
- Lifecycle:
  - Delete non-current versions after 90 days
  - Transition to Glacier after 1 year
```

**IAM Policy** (NestJS application):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::invoice-prod-storage/*"
    }
  ]
}
```

### SES Configuration

**Prerequisite**: `mailer.ezorder.io` (the `MAIL_MERCHANT_FROM_ADDRESS` domain, the shared From address merchants can explicitly pick or fall back to) must be a verified SES identity in `us-east-1` (Easy DKIM; custom MAIL FROM + DMARC recommended) before deploy — otherwise sends fail with `MessageRejected` for any shop using the shared address.

**Email Verification**:
1. Verify sender domain in SES (SPF + DKIM)
2. Verify merchant email addresses (one-time OTP)
3. Check sandbox vs production status

**Rate Limits** (SES):
- Default: 14 emails/sec per account
- Request limit increase if needed
- Monitor bounce/complaint rates (>5% → account review)

**Pre-launch operational steps (before deploy)**:
1. **Database cleanup**: App has not launched; delete all existing `email_verifications` records so merchants re-verify from the new UI. Use `db.email_verifications.deleteMany({})` before rolling out.
2. **SES verification**: Ensure `mailer.ezorder.io` is verified in SES for the account before deploy. It is now an explicit merchant-facing option ("EZ Order shared address"); unverified means every shop on that option fails with `MessageRejected`.

**IAM Policy** (NestJS application):
```json
{
  "Effect": "Allow",
  "Action": ["ses:SendEmail", "sesv2:SendEmail", "sesv2:PutSuppressedDestination"],
  "Resource": ["arn:aws:ses:*:*:*"]
}
```

### Unsubscribe & the SES suppression list

Customer emails carry an unsubscribe link. Acting on it writes the address to the
**AWS SES account-level suppression list**. Four things about this setup are not
obvious from the code:

**1. Enforcement is a one-time ops step, not application logic.** The app never
filters recipients — it only writes to the suppression list. Nothing is actually
blocked until the configuration set enables suppression:

```bash
aws sesv2 put-configuration-set-suppression-options \
  --configuration-set-name "$AWS_SES_CONFIGURATION_SET_NAME" \
  --suppressed-reasons COMPLAINT BOUNCE

# verify
aws sesv2 get-configuration-set --configuration-set-name "$AWS_SES_CONFIGURATION_SET_NAME"
```

Skip this and the unsubscribe button appears to work while emails keep sending.
Note also that `MailService`'s `ignoreConfigurationSet: true` opts a send out of
the configuration set, and therefore out of suppression. No caller sets it today.

**2. Unsubscribes are recorded as `BOUNCE`.** The SESv2 `SuppressionListReason`
enum offers only `BOUNCE` and `COMPLAINT` — there is no "unsubscribe" value. We
file them as `BOUNCE` because an unsubscribe is not a spam complaint, and marking
it as one mislabels the customer everywhere the list is read.

The reason is metadata on the list entry, not a reputation event — it does not
feed the bounce-rate or complaint-rate graphs. What it controls is enforcement: an
entry is honoured only when its reason appears in the configuration set's
`SuppressedReasons`. Keep `BOUNCE` in that list, or the entries are recorded and
then silently ignored.

Separately, and regardless of reason: attempting to send to a suppressed address
produces a bounce event that *does* count toward the bounce rate. Expect a small
ongoing baseline once unsubscribes accumulate.

**3. Suppression is account-wide, across all merchants.** One customer
unsubscribing blocks that address for every shop on the app, transactional mail
included. This is a deliberate trade-off, not a bug.

**4. Re-subscribing is manual.** There is no merchant-facing control:

```bash
aws sesv2 delete-suppressed-destination --email-address customer@example.com
```

Two further invariants worth preserving:

- **The emailed link never unsubscribes by itself.** It renders a confirmation
  card whose button issues the POST that suppresses. Mail scanners (Outlook Safe
  Links and similar) prefetch every URL in a message body, so collapsing this into
  a one-step GET would silently unsubscribe customers who never clicked.
- **Merchants' own addresses never receive an unsubscribe link or header**, so a
  merchant cannot lock themselves out of their own app mail account-wide.

Required env vars: `SHOPIFY_APP_PROXY_SUBPATH`, `UNSUBSCRIBE_HMAC_SECRET` — see
`env.example`. The HMAC secret must be identical across the `api` and `render`
roles, since the render workers mint the tokens the routes verify.

---

## Monitoring & Logging

### Health Endpoints

**GET `/api/health`**:
```json
{
  "message": "OK"
}
```

### Logging

All logs sent to Slack via `LoggingService`:
- **ERROR**: Error details, stack trace
- **WARN**: Non-critical issues (quota warnings)
- **INFO**: App events (installs, uninstalls, usage)

**No logs** of:
- Customer PII (email, phone)
- API keys, tokens, passwords
- Sensitive order data

---

## Disaster Recovery

### Backup Strategy

**MongoDB**:
- Automated daily snapshots (Atlas)
- Retain for 30 days
- Test restore monthly

**S3**:
- Versioning enabled (recover deleted PDFs)
- Backup bucket in separate region

**Secrets**:
- Sealed-secrets stored in git (protected)
- SSH keys in secure vault (not git)

### Failover

**Database Failover** (MongoDB Atlas):
- Auto-failover to replica (zero downtime)
- Point-in-time restore available

**Application Failover** (K8s):
- Multi-pod deployment (3+ replicas)
- Automatic pod restart on failure
- Rolling updates (zero downtime)

---

## Environment Variables Reference

### Required (All Environments)

```bash
NODE_ENV=production|development
SHOPIFY_API_KEY=<client-id>
SHOPIFY_API_SECRET=<secret>
MONGODB_URI=mongodb+srv://...
REDIS_HOST=redis-master
REDIS_PASSWORD=<password>
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_REGION=us-east-1
AWS_S3_BUCKET=invoice-prod
```

### Optional

```bash
AWS_SES_REGION=us-east-1
MAIL_MERCHANT_FROM_ADDRESS=support@mailer.ezorder.io  # shared From address; merchants can explicitly pick it or fall back to it; must be verified in SES
EMAIL_DAILY_LIMIT_ENFORCED=true  # Set to 'false' for count-only mode (no sends blocked). Unset = enforced.
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
SLACK_EZORDER_URL=https://hooks.slack.com/...  # Email trust check failures (store could not be evaluated; set it in Admin → Stores → Check)
GITBOOK_API_KEY=<api-key>
CORS_ORIGIN=*
```

### Frontend (Build-Time, via .env)

```bash
VITE_SHOPIFY_API_KEY=<client-id>          # Required
VITE_CDN_URL=https://cdn.example.com      # Optional
VITE_SENTRY_DSN=                          # Optional; sends nothing outside production
VITE_SENTRY_ENVIRONMENT=development
BACKEND_PORT=8600
FRONTEND_PORT=3000
HOST=localhost
```

---

## Troubleshooting

### Common Issues

**MongoDB connection timeout**:
```
Error: connect ECONNREFUSED 127.0.0.1:27017
Solution: Ensure docker-compose services are running
          docker-compose up -d
```

**Puppeteer PDF generation fails**:
```
Error: Failed to launch Chrome
Solution: Puppeteer requires Chrome binary in Alpine
          Use puppeteer-core with system Chrome, or increase container resources
```

**Webpack/Vite build fails**:
```
Error: ReferenceError: SHOPIFY_API_KEY is not defined
Solution: VITE_SHOPIFY_API_KEY must be set at build time
          export VITE_SHOPIFY_API_KEY=... && npm run build
```

**S3 access denied**:
```
Error: The access key ID provided does not have permissions
Solution: Verify IAM policy allows s3:PutObject, s3:GetObject
          Check AWS credentials are valid
```

---

**Last Updated**: 2026-04-19
