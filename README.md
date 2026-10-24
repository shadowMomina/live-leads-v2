<div align="center">

# ⚡ Live Leads v2
### Meta Lead Ads → React Native, in real time

When a lead is submitted through Meta's **Lead Ads Testing Tool**, it appears
**instantly** in an already-open React Native screen. No refresh, no touch on the device.

`Node.js` · `Express` · `Socket.IO` · `Meta Graph API` · `React Native` · `TypeScript`

</div>

---

## 🎬 Demo
| Video | Link |
|---|---|
| Live demo | `<paste link>` |
| Code & architecture walkthrough | `<paste link>` |

First version: [meta-lead-ads-rn-poc](https://github.com/shadowMomina/meta-lead-ads-rn-poc)

---

## 🧭 How it works

```
Lead Testing Tool
      │  lead submitted
      ▼
Meta webhook (leadgen)         sends only a lead ID
      │  POST /webhook (through an HTTPS tunnel)
      ▼
Express backend                verifies the signature, ignores duplicates
      │  GET /{leadgen_id} on the Graph API (Page access token)
      ▼
Full lead (name, email, time)
      │  Socket.IO event "newLead"
      ▼
React Native app               adds the lead to the list instantly
```

**Key idea:** Meta's webhook only carries a *lead ID*. The backend uses its Page access
token to fetch the details, then pushes them to the app. The token never reaches the phone.

---

## 🗂 Project structure

```
.
├── app/                    # React Native app
│   └── App.tsx             # connects, listens, renders the live list
└── server/                 # Node.js backend
    ├── src/
    │   ├── config.js       # loads .env, stops the server if a secret is missing
    │   ├── leads.js        # fetches leads from the Graph API, keeps recent ones
    │   ├── webhook.js      # Meta handshake + signature check + lead notifications
    │   └── index.js        # Express + Socket.IO, wires everything together
    └── .env.example        # template for secrets
```

---

## ✨ What changed from v1
- Backend split into four small files instead of one
- The server **refuses to start** if a secret is missing
- The webhook signature check is **always on**
- The app receives **existing leads when it connects**, so the list survives a restart
- New screen: connection status dot, lead counter, formatted times
- Graph API errors now include **Meta's reason**, which makes failures easy to debug

---

## 🔧 Setup

**Requirements:** Node.js, Android Studio with an emulator, a published Meta app
(use case *Capture & manage ad leads*), a Facebook Page with an active lead form, the app
assigned as a CRM under Business Settings → Leads access, and `cloudflared`.

```bash
cd server
npm install
copy .env.example .env        # Windows

cd ../app
npm install
```

Fill in `server/.env`:

| Variable | Purpose |
|---|---|
| `VERIFY_TOKEN` | Any word you choose; Meta sends it back in the webhook handshake |
| `PAGE_ACCESS_TOKEN` | Token of the **Page** that owns the form (used to fetch lead details) |
| `APP_SECRET` | Used to verify webhook signatures |
| `GRAPH_VERSION` | Graph API version, e.g. `v26.0` |

> 🔒 `.env` is git-ignored. Never commit real tokens.

---

## ▶️ Run

Four terminals:

```bash
# 1. backend
cd server
npm start

# 2. Metro
cd app
npx react-native start

# 3. app on the emulator (first time builds the app)
cd app
adb reverse tcp:8081 tcp:8081
npx react-native run-android --active-arch-only

# 4. public tunnel
cloudflared tunnel --protocol http2 --url http://localhost:3000
```

In the Meta dashboard → **Webhooks → Page**: set the Callback URL to
`https://<tunnel>/webhook`, enter your verify token, click **Verify and save**, and
subscribe to **leadgen**. The tunnel address changes on every restart, so update it each time.

---

## 🧪 Test

1. Open `developers.facebook.com/tools/lead-ads-testing`
2. Choose the Page and form
3. Click **Delete lead**, then **Create lead**
4. The lead card appears in the app on its own; **Track status** shows the delivery result

Quick local check without Meta: open `http://localhost:3000/test-lead`.

---

## 🧠 Design decisions
| Decision | Why |
|---|---|
| **Socket.IO** | One open connection; the server pushes to every app instantly and reconnects automatically |
| **Fetch the lead on the server** | The webhook has only an ID, and the token stays off the device |
| **Reply `200` before fetching** | Meta retries slow responses |
| **Duplicate protection** | A `seen` set on the server and an `id` check in the app |
| **HMAC signature check** | Proves the request really came from Meta |
| **`10.0.2.2`** | The Android emulator's address for the host computer |
| **Tunnel** | Meta can't reach `localhost` |

---

## 🛠 Troubleshooting
| What you see | Likely cause | Fix |
|---|---|---|
| Nothing in the server log after *Create lead* | Meta has an old tunnel address | Update the Callback URL, **Verify and save** |
| `rejected: signature does not match APP_SECRET` | Wrong app secret | Copy it again from App settings → Basic |
| `could not fetch lead: ... 400` | Wrong or expired Page token | Generate a fresh **Page** token for the Page that owns the form |
| App shows *Reconnecting...* | Backend not running | Start the server, check `adb reverse` |
| `Missing in .env: ...` on start | Secret not filled in | Add it to `server/.env` |

---

## 📝 Assumptions & limitations
**Assumptions**
- Runs on an Android emulator with a temporary tunnel
- The Page token is short-lived and refreshed before the demo
- The client confirmed in writing that AI assistance was allowed

**Limitations**
- Leads are kept in memory (last 50) and cleared on restart
- The socket has no authentication
- The webhook URL must be re-registered whenever the tunnel restarts

---

<div align="center">

Built by **Momina Raheel**

</div>
