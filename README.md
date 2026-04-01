# 🏠 PropertyNexus - Complete Property Management System

A professional, full-featured property management platform built with **Next.js**, **Firebase**, and **Tailwind CSS** featuring a stunning glassmorphism UI.

![PropertyNexus](https://img.shields.io/badge/PropertyNexus-v1.0-00f0ff)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Firebase](https://img.shields.io/badge/Firebase-10-orange)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

---

## ✨ Features Overview

### 🏡 1. Core Property Management
- Full CRUD operations (Add, Edit, Delete properties)
- Property types: Land, Plot, House, Commercial
- Status workflow: Draft → Available → On Hold → Sold
- Rich property details with all fields

### 📍 2. Location & Filtering
- Location fields: Country, State, City, Area, Pincode
- Google Maps integration ready (lat/lng support)
- Advanced filters: Type, Category, Status, Price range, Size, Area
- Special filters: Near Highway, Corner Site, Facing, Approved

### 🖼️ 3. Media Management
- Multiple image gallery per property
- Cover image selection
- Drag & drop upload UI
- Firebase Storage integration ready
- Auto-compression support (via Sharp)

### 💰 4. Pricing & Deal Tracking
- Current & previous price tracking
- Price change history with % calculations
- Negotiation notes per property
- Interested buyers list with contacts
- Final selling price & sold date

### 📊 5. Dashboard
- Total properties, Available, Sold, On Hold stats
- Total portfolio value calculation
- Sales performance chart (Area chart)
- Property type distribution (Pie chart)
- Most viewed properties ranking
- Recent activity feed

### 🔍 6. Search System
- Global search bar in top navigation
- Search by: Title, Location, Property ID, City
- Real-time filtering as you type

### 📁 7. Categories & Tags
- Categories: Residential, Commercial, Agricultural
- Tags: investment, prime-location, near-highway, corner-site, approved, luxury, urgent-sale, gated-community, near-it-park, high-roi, industrial, commercial
- Tag-based filtering

### 🧾 8. Documents Management
- Upload area for sale agreements, tax docs, legal papers
- Document attachment per property
- Firebase Storage integration ready

### 🧑‍💼 9. User System
- Role-based access: Admin, Agent, Viewer
- Permission matrix table
- User management interface

### ⭐ 10. Favorites / Shortlist
- One-click favorite toggle
- Dedicated favorites page
- Quick access to shortlisted properties

### 📌 11. Status & Workflow
- Visual status badges (Available, On Hold, Sold, Draft)
- One-click status change from property detail
- Status-based filtering

### 🔔 12. Notifications
- Real-time notifications for price changes, status updates, new properties
- Unread count badge
- Mark all as read functionality
- Notification bell dropdown

### 🧠 13. Notes & Internal Comments
- Private notes per property
- Author and timestamp tracking
- Example: "Owner ready to reduce price"

### 🌐 14. Map Integration
- Interactive map view with property pins
- Color-coded by status
- Hover tooltips with property details
- Google Maps API ready for production

### 📤 15. Export & Reports
- Analytics dashboard with charts
- Avg price by area (Bar chart)
- Property views ranking
- Sales trend (Line chart)
- Portfolio breakdown stats

### 🔐 16. Security
- Firebase Authentication ready
- JWT token verification
- Role-based access control (RBAC)
- Input sanitization on all API routes
- File upload validation (type + size)
- Audit logs (who changed what, when)

### ⚡ 17. Automation
- Auto-generated property IDs
- Auto watermark support (via Sharp)
- Unsold property reminders
- Configurable in Settings

### 🧩 18. Bonus Features
- AI description generator (configurable)
- Nearby property comparison via map
- Deal tracking Kanban-style board
- Responsive design (mobile-first)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Firebase project created
- Google Maps API key (optional, for map features)

### Installation

```bash
# 1. Extract the zip file
unzip property-nexus.zip
cd property-manager

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase credentials

# 4. Run development server
npm run dev

# 5. Open in browser
# http://localhost:3000
```

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** (Email/Password)
4. Enable **Firestore Database**
5. Enable **Firebase Storage**
6. Copy your config to `.env.local`

### Firestore Collections Structure

```
properties/
  {propertyId}/
    title, type, category, description, price...
    notes/ (subcollection)
    buyers/ (subcollection)
    documents/ (subcollection)

users/
  {userId}/
    name, email, role, avatar

auditLogs/
  {logId}/
    action, entityType, entityId, userId, timestamp

notifications/
  {notificationId}/
    type, message, propertyId, read, createdAt
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users
    match /properties/{propertyId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'agent'];
      allow delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /auditLogs/{logId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if request.auth != null;
    }
  }
}
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| State Management | Zustand |
| Charts | Recharts |
| Icons | Lucide React |
| Animations | Framer Motion |
| Backend | Next.js API Routes |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Storage | Firebase Storage |
| Maps | Google Maps API |

---

## 📂 Project Structure

```
property-manager/
├── pages/
│   ├── _app.tsx              # App wrapper
│   ├── index.tsx             # Main page
│   └── api/
│       ├── properties.ts     # Property CRUD API
│       ├── auth.ts           # Authentication API
│       └── upload.ts         # File upload API
├── src/
│   ├── components/
│   │   └── PropertyNexus.jsx # Main application component
│   ├── config/
│   │   └── firebase.ts       # Firebase configuration
│   ├── store/
│   │   └── propertyStore.ts  # Zustand state management
│   └── styles/
│       └── globals.css        # Global styles + glassmorphism
├── .env.example               # Environment variables template
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🎨 UI Design

The UI features a **glassmorphism** design language with:
- Dark theme base (#0a0e1a)
- Frosted glass cards with backdrop blur
- Cyan-to-purple gradient accents
- Outfit font for headings, DM Sans for body
- Smooth animations and hover effects
- Ambient gradient background effects
- Responsive layout with collapsible sidebar

---

## 🔧 Customization

### Adding New Property Types
Edit the type options in `PropertyNexus.jsx` form select and the `TypeIcon` component.

### Adding New Tags
Update the `TAG_OPTIONS` array in the main component.

### Changing Theme Colors
Modify CSS variables in `globals.css` and Tailwind config in `tailwind.config.js`.

### Adding Google Maps
1. Get API key from Google Cloud Console
2. Add to `.env.local` as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
3. Replace the custom map component with `@react-google-maps/api`

---

## 📱 Responsive Design

- **Desktop**: Full sidebar + 3-column grid
- **Tablet**: Collapsible sidebar + 2-column grid  
- **Mobile**: Hidden sidebar (toggle) + single column

---

## 🛡️ Security Checklist

- [x] Input sanitization on API routes
- [x] File type validation on uploads
- [x] File size limits (10MB max)
- [x] Role-based access control structure
- [x] Audit logging system
- [x] Firebase Security Rules template
- [x] JWT verification endpoints
- [x] XSS prevention in user inputs

---

## 📜 License

MIT License - Free for personal and commercial use.

---

Built with ❤️ using Next.js + Firebase + Tailwind CSS
