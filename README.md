# FitTrack Server (Backend)

## Deskripsi

FitTrack Server adalah REST API backend untuk aplikasi Fitness Tracker — menyediakan endpoint untuk autentikasi user, manajemen workout (exercise + sets), exercise library, logging nutrisi, body measurement, goals, dashboard statistik, pengaturan profil, dan admin panel untuk monitoring platform. Dibangun dengan Express.js dan PostgreSQL melalui Prisma ORM, API ini menangani semua logika bisnis, validasi input, dan keamanan data.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Express.js | 4.21.0 |
| Database | PostgreSQL | Local |
| ORM | Prisma | 5.22.0 |
| Authentication | JWT (jsonwebtoken) | 9.0.2 |
| Password Hashing | bcryptjs | 2.4.3 |
| Validation | Joi | 17.13.3 |
| HTTP Logger | Morgan | 10.0.0 |
| CORS | cors | 2.8.5 |
| Environment | dotenv | 16.4.5 |
| Dev Server | Nodemon | 3.1.7 |

---

## Struktur Folder

```
server/
├── src/
│   ├── index.js                  # Entry point (Express app setup + routes)
│   ├── config/
│   │   ├── db.js                 # Prisma client singleton
│   │   └── prisma.js             # Prisma helper utilities
│   ├── middleware/
│   │   ├── auth.js               # JWT verification middleware
│   │   ├── admin.js              # Role-based admin middleware
│   │   └── validate.js           # Joi validation middleware
│   ├── routes/
│   │   ├── auth.routes.js        # Register, login, me
│   │   ├── workout.routes.js     # Workout CRUD + exercises + sets
│   │   ├── exercise.routes.js    # Exercise library CRUD
│   │   ├── nutrition.routes.js   # Nutrition log CRUD + summary
│   │   ├── body.routes.js        # Body measurement CRUD
│   │   ├── goal.routes.js        # Goals CRUD
│   │   ├── dashboard.routes.js   # Dashboard stats + charts data
│   │   ├── settings.routes.js    # Profile + password update
│   │   └── admin.routes.js       # Admin: stats, user management
│   └── validations/
│       ├── auth.validation.js    # Register & login schemas
│       ├── workout.validation.js # Workout + set schemas
│       ├── exercise.validation.js# Exercise CRUD schema
│       ├── nutrition.validation.js# Nutrition log schema
│       ├── body.validation.js    # Body measurement schema
│       └── goal.validation.js    # Goal schema
├── prisma/
│   ├── schema.prisma             # Database schema definition
│   ├── seed.js                   # Exercise library seed (41 items)
│   ├── dummy-user.js             # Generate dummy user with 1 year data
│   ├── make-admin.js             # Promote user to ADMIN role
│   └── migrations/               # Database migration files
├── .env                          # Environment variables (DATABASE_URL, JWT_SECRET, PORT)
└── package.json
```

---

## Database Schema

### Enums
| Enum | Values |
|------|--------|
| `ExerciseCategory` | PUSH, PULL, LEGS, CORE, CARDIO, FULL_BODY |
| `MealType` | BREAKFAST, LUNCH, DINNER, SNACK |
| `GoalType` | WEIGHT, STRENGTH, BODY_FAT, CUSTOM |
| `UserRole` | USER, ADMIN |

### Models (8 tabel)
| Model | Deskripsi | Jumlah Field |
|-------|-----------|-------------|
| `User` | Data user + role (ADMIN/USER) + isActive | 7 |
| `Workout` | Sesi latihan (tanggal, nama, durasi, status) | 7 |
| `Exercise` | Library exercise (default 41 + custom per user) | 8 |
| `WorkoutExercise` | Relasi workout ↔ exercise (junction table) | 5 |
| `ExerciseSet` | Set individual (reps, weight, RPE, warmup) | 8 |
| `NutritionLog` | Log makanan harian (calories, macros) | 9 |
| `BodyMeasurement` | Pengukuran badan (weight, body fat, muscle, waist) | 7 |
| `Goal` | Target kebugaran (weight, strength, body fat, custom) | 9 |

### Relationships
| Relasi | Type | On Delete |
|--------|------|-----------|
| User → Workout | One-to-Many | CASCADE |
| User → Exercise (custom) | One-to-Many | CASCADE |
| User → NutritionLog | One-to-Many | CASCADE |
| User → BodyMeasurement | One-to-Many | CASCADE |
| User → Goal | One-to-Many | CASCADE |
| Workout → WorkoutExercise | One-to-Many | CASCADE |
| WorkoutExercise → ExerciseSet | One-to-Many | CASCADE |
| WorkoutExercise → Exercise | Many-to-One | RESTRICT |
| Goal → Exercise | Many-to-One | SET NULL |

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/register` | No | Registrasi user baru (name, email, password) |
| POST | `/login` | No | Login, return JWT token (7 hari expiry) |
| GET | `/me` | Yes | Get current user profile |

### Workouts (`/api/workouts`)
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/` | Yes | List semua workout user |
| GET | `/:id` | Yes | Detail workout + exercises + sets |
| POST | `/` | Yes | Buat workout baru |
| PUT | `/:id` | Yes | Update workout |
| DELETE | `/:id` | Yes | Hapus workout (cascade) |
| POST | `/:id/exercises` | Yes | Tambah exercise ke workout |
| DELETE | `/:wId/exercises/:weId` | Yes | Hapus exercise dari workout |
| POST | `/exercises/:weId/sets` | Yes | Tambah set (+ PR detection) |
| PUT | `/sets/:setId` | Yes | Update set |
| DELETE | `/sets/:setId` | Yes | Hapus set |

### Exercises (`/api/exercises`)
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/` | Yes | List exercises (filter: category, search) |
| GET | `/:id` | Yes | Get single exercise |
| POST | `/` | Yes | Create custom exercise |
| PUT | `/:id` | Yes | Update custom exercise |
| DELETE | `/:id` | Yes | Delete custom exercise |

### Nutrition (`/api/nutrition`)
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/` | Yes | List nutrition logs (filter: date) |
| GET | `/summary` | Yes | Daily nutrition summary |
| POST | `/` | Yes | Create nutrition log |
| PUT | `/:id` | Yes | Update nutrition log |
| DELETE | `/:id` | Yes | Delete nutrition log |

### Body (`/api/body`)
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/` | Yes | List body measurements |
| POST | `/` | Yes | Create measurement |
| PUT | `/:id` | Yes | Update measurement |
| DELETE | `/:id` | Yes | Delete measurement |

### Goals (`/api/goals`)
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/` | Yes | List goals |
| POST | `/` | Yes | Create goal |
| PUT | `/:id` | Yes | Update goal |
| DELETE | `/:id` | Yes | Delete goal |

### Dashboard (`/api/dashboard`)
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/summary` | Yes | Dashboard stats (streak, volume, PRs) |
| GET | `/volume` | Yes | Weekly volume data (8 minggu) |
| GET | `/strength/:exerciseId` | Yes | Strength progression data (e1RM) |

### Settings (`/api/settings`)
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| PUT | `/profile` | Yes | Update name & email |
| PUT | `/password` | Yes | Change password |

### Admin (`/api/admin`) — requires ADMIN role
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/stats` | Yes+Admin | Platform statistics + charts data |
| GET | `/users` | Yes+Admin | List users (search, filter, pagination) |
| GET | `/users/:id` | Yes+Admin | User detail + activity data |
| PUT | `/users/:id` | Yes+Admin | Toggle active / change role |
| DELETE | `/users/:id` | Yes+Admin | Delete user (cannot delete admins) |

### Health
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/health` | No | Health check endpoint |

**Total: ~40 endpoints**

---

## Authentication & Authorization

### Flow:
1. User register → password di-hash dengan **bcryptjs** (salt rounds: 12)
2. User login → server return **JWT token** (expiry: 7 hari)
3. Token berisi payload: `{ id, email, role }`
4. Setiap request ke protected endpoint, client mengirim token via header: `Authorization: Bearer <token>`
5. **Auth middleware** (`auth.js`) memverifikasi JWT dan attach `req.user`
6. **Admin middleware** (`admin.js`) cek `req.user.role === "ADMIN"`

### Proteksi:
- User yang `isActive === false` tidak bisa login (403 Forbidden)
- Admin tidak bisa mengubah/menghapus akun sendiri
- Admin tidak bisa menghapus user dengan role ADMIN
- Semua query terproteksi dari SQL injection via Prisma parameterized queries

---

## Validation

Semua input divalidasi menggunakan **Joi** sebelum masuk ke handler:

| Validation File | Schemas |
|----------------|---------|
| `auth.validation.js` | registerSchema, loginSchema |
| `workout.validation.js` | createWorkoutSchema, updateWorkoutSchema, createSetSchema, updateSetSchema |
| `exercise.validation.js` | createExerciseSchema, updateExerciseSchema |
| `nutrition.validation.js` | createNutritionSchema, updateNutritionSchema |
| `body.validation.js` | createBodySchema, updateBodySchema |
| `goal.validation.js` | createGoalSchema, updateGoalSchema |

Validation error messages dalam Bahasa Indonesia.

---

## Utility Scripts

| Script | Command | Deskripsi |
|--------|---------|-----------|
| Seed | `npm run seed` | Insert 41 default exercises ke database |
| Dummy User | `npm run dummy` | Generate dummy user dengan 1 tahun data (~170 workouts, body measurements, nutrition logs, goals) |
| Make Admin | `npm run make-admin <email>` | Promote user menjadi ADMIN |
| Migrate | `npm run migrate` | Jalankan Prisma migration |
| Studio | `npm run studio` | Buka Prisma Studio (visual DB browser) |

---

## Environment Variables

File `.env`:
| Variable | Deskripsi |
|----------|-----------|
| `DATABASE_URL` | PostgreSQL connection string (e.g., `postgresql://user:pass@localhost:5432/fittrack`) |
| `JWT_SECRET` | Secret key untuk sign JWT token |
| `PORT` | Server port (default: 5000) |

---

## Scripts

| Command | Deskripsi |
|---------|-----------|
| `npm run dev` | Jalankan development server dengan nodemon (auto-reload) |
| `npm start` | Jalankan server production |
| `npm run seed` | Seed exercise library |
| `npm run dummy` | Generate dummy user data |
| `npm run make-admin` | Promote user to admin |
| `npm run migrate` | Run Prisma migrations |
| `npm run studio` | Open Prisma Studio |
