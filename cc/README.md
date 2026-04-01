# DelivTrack Backend

Node.js + Express + PostgreSQL + Socket.io

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your database URL and secrets
```

### 3. Run database migrations
```bash
npm run db:migrate
```

### 4. Start the server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:5000`

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |

### Orders (merchant)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/orders | List orders |
| GET | /api/orders/stats | Dashboard stats |
| POST | /api/orders | Create order |
| PATCH | /api/orders/:id/assign | Assign driver |
| PATCH | /api/orders/:id/status | Update status |

### Orders (driver)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/orders/driver | My assigned orders |
| PATCH | /api/orders/:id/status | Update to delivered |

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/orders/track/:token | Track order (no auth) |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users/drivers | List drivers |
| POST | /api/users/drivers | Create driver |
| PATCH | /api/users/drivers/:id/toggle | Enable/disable |
| GET | /api/users/notifications | Get notifications |

---

## Socket.io Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `driver:location` | `{latitude, longitude}` | Driver sends GPS |
| `driver:sharing` | `{is_sharing}` | Toggle GPS sharing |
| `track:join` | `{token}` | Client joins tracking room |
| `order:delivered` | `{order_id}` | Driver confirms delivery |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `driver:location:update` | `{driver_id, latitude, longitude}` | Live GPS update |
| `driver:sharing:update` | `{driver_id, is_sharing}` | GPS toggle update |
| `order:status:update` | `{order_id, status}` | Order status changed |
| `order:delivered` | `{order_id}` | Delivery confirmed |

---

## Deploy to Railway

1. Push to GitHub
2. Connect repo to Railway
3. Add PostgreSQL plugin
4. Set environment variables from `.env.example`
5. Railway auto-deploys on push
