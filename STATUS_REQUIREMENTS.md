# Requirement Status Summary (Saved)

Status Legend: ✅ Done • ⚠️ Partial • ❌ Not Done

| Requirement | Status | Notes |
|---|---|---|
| **mp1 Product/service CRUD** | ✅ | Admin CRUD + multi‑photo upload working. |
| Upload photo / camera (product) | ✅ | Admin menu supports photo upload; can add multiple images. |
| **mp2 User login/registration** | ✅ | Email/password login + register + verify flow. |
| Update profile | ✅ | Edit profile screen + upload/take photo. |
| Upload/take profile photo | ✅ | Camera/gallery in EditProfile. |
| Google/Facebook login | ❌ | Not implemented. |
| **mp3 Review/Ratings** | ✅ | Only for delivered orders, per‑item, per‑order; edit allowed. |
| Update own review | ✅ | Works; edit per same order+item. |
| **mp4 Cart save (AsyncStorage)** | ✅ | Cart stored + restored; cleared after checkout. |
| Cart save on SQLite | ✅ | Cart persisted in SQLite via `expo-sqlite`. |
| **Term test: transaction** | ⚠️ | Order completion + status update exist; push notification sent. |
| Update status | ✅ | Admin can update status. |
| Push notif after update | ⚠️ | Sent if push token exists; no “tap to open order details.” |
| Tap notification to view order details | ❌ | Not implemented. |
| **Quiz 1 Search/Filters** | ✅ | Search + price + category filters. |
| **Quiz 2 Notifications** | ⚠️ | Promo send endpoint exists; app side display OK, but sending is currently logged as disabled in backend. |
| View notification details | ✅ | PromoDetailsScreen exists. |
| **Quiz 3 Redux** | ✅ | Orders, products, reviews/ratings use Redux slices. |
| **Unit 1 UI (drawer)** | ✅ | Drawer layout implemented. |
| **Unit 2 Node backend + JWT + token storage** | ✅ | JWT secret via env (`JWT_SECRET`), tokens stored/retrieved via SecureStore fallback. |
| Push token saved on user | ✅ | `updatePushToken` implemented. |
| Update/remove stale tokens | ❌ | Not implemented. |
| **Term test lecture: FR/Exec/Contribution** | ⚠️ | Depends on grading; app runs with current features. |
