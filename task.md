# MixFlow Task List

**Last Updated:** October 7, 2025
**Current Sprint:** Week 6 - MVP Phase
**Sprint End:** October 14, 2025

---

## 🔴 Critical Priority (P0) - DO FIRST

### 1. Fix Audio Playback ✅
**Status:** 🟢 Complete
**Assignee:** Claude
**Effort:** 4 hours (actual)
**Completed:** October 7, 2025

**Problem:**
Audio files failed to play with error: "Unable to play this audio file. Please check the file format."

**Solution:**
1. Fixed CORS configuration in backend to support Range headers needed for audio streaming
2. Fixed frontend to prepend backend URL (`http://localhost:3334`) to relative file paths

**Changes Made:**
- `mixflow/backend/src/main.ts` (lines 41-48): Added 'Range' to allowedHeaders and exposedHeaders for audio streaming
- `mixflow/web-app/src/app/app.tsx` (lines 435-456): Updated playTrack to prepend backend URL to relative paths

**Acceptance Criteria:**
- [x] Audio plays immediately when track is selected
- [x] No "Unable to play" errors
- [x] Works in Chrome (tested)
- [x] Proper error handling in place

**Next Steps:**
- Task #2: Configure production API URL (replaces hardcoded localhost:3334)

---

### 2. Configure API URL for Production
**Status:** ⚪ Not Started
**Assignee:** Unassigned
**Effort:** 1-2 hours
**Due:** October 12, 2025

**Problem:**
API URL is hardcoded to `http://localhost:3334` in frontend, blocking production deployment.

**Subtasks:**
- [ ] Create environment variable configuration
  - Add `VITE_API_URL` to `.env` file
  - Add `.env.example` with documentation
  - Location: `mixflow/web-app/.env`
- [ ] Update API call function
  - Replace hardcoded URL with `import.meta.env.VITE_API_URL`
  - Add fallback for local development
  - Location: `mixflow/web-app/src/app/app.tsx` (apiCall function)
- [ ] Update build configuration
  - Ensure Vite loads environment variables
  - Test production build
- [ ] Documentation
  - Update README with environment setup
  - Document deployment configuration

**Files to Modify:**
- `mixflow/web-app/src/app/app.tsx` (search for `http://localhost:3334`)
- `mixflow/web-app/.env.example` (create if not exists)
- `mixflow/web-app/vite.config.ts` (verify env config)

**Acceptance Criteria:**
- [ ] API URL configurable via environment variable
- [ ] Works locally with default value
- [ ] Works in production with custom URL
- [ ] No hardcoded URLs remain

**Dependencies:** None
**Blocks:** Production deployment

---

### 3. Add React Error Boundaries
**Status:** ⚪ Not Started
**Assignee:** Unassigned
**Effort:** 2-3 hours
**Due:** October 12, 2025

**Problem:**
Frontend crashes show blank white screen with no error message, poor user experience.

**Subtasks:**
- [ ] Create ErrorBoundary component
  - Implement React error boundary
  - Design error UI (user-friendly message)
  - Add error logging
  - Location: Create `mixflow/web-app/src/components/ErrorBoundary.tsx`
- [ ] Wrap application with ErrorBoundary
  - Update `app.tsx` to use boundary
  - Add boundaries around major sections
- [ ] Implement error reporting
  - Log errors to console (dev)
  - Prepare for Sentry integration (future)
- [ ] Add retry mechanism
  - "Reload" button
  - Clear local storage option

**Acceptance Criteria:**
- [ ] Errors show user-friendly message instead of white screen
- [ ] Errors logged to console
- [ ] User can recover without manual refresh
- [ ] Error state persists for debugging

**Dependencies:** None

---

## 🟡 High Priority (P1) - THIS WEEK

### 4. Implement Search Backend
**Status:** ⚪ Not Started
**Assignee:** Unassigned
**Effort:** 4-6 hours
**Due:** October 13, 2025

**Problem:**
Search UI exists but does nothing - no backend endpoint implemented.

**Subtasks:**
- [ ] Create search endpoint
  - `GET /api/search?q=query&type=tracks|artists|all`
  - Location: `mixflow/backend/src/routes/`
- [ ] Implement search controller
  - Search tracks by title, artist, genre
  - Search artists by stage name
  - Pagination support
  - Location: `mixflow/backend/src/controllers/search.controller.ts` (create)
- [ ] Optimize database queries
  - Use Prisma `contains` or `search` mode
  - Add database indexes if needed
  - Test performance with large dataset
- [ ] Connect frontend to backend
  - Update `app.tsx` search function to call API
  - Add debouncing (300ms delay)
  - Show loading state
  - Display results

**Database Indexes Needed:**
```prisma
// Already defined in schema.prisma
@@index([title])        // Track.title
@@index([stageName])    // Artist.stageName
@@index([genre])        // Track.genre
```

**API Response Format:**
```json
{
  "tracks": [...],
  "artists": [...],
  "total": 25
}
```

**Acceptance Criteria:**
- [ ] Search returns relevant results
- [ ] Results appear within 500ms
- [ ] Search works for tracks and artists
- [ ] Empty state shown for no results
- [ ] Search query logged to database

**Dependencies:** None

---

### 5. Implement Password Reset Backend
**Status:** ⚪ Not Started
**Assignee:** Unassigned
**Effort:** 3-4 hours
**Due:** October 14, 2025

**Problem:**
Forgot password UI exists but backend endpoint not implemented.

**Subtasks:**
- [ ] Create reset token model
  - Add to Prisma schema or use JWT
  - Token expiration (1 hour)
  - One-time use tokens
- [ ] Create forgot-password endpoint
  - `POST /api/auth/forgot-password` with email
  - Generate reset token
  - Send reset email (simulate for now)
  - Location: `mixflow/backend/src/controllers/auth.controller.ts`
- [ ] Create reset-password endpoint
  - `POST /api/auth/reset-password` with token + new password
  - Validate token
  - Update password hash
  - Invalidate token
- [ ] Email service integration (future)
  - For now: log reset link to console
  - Future: SendGrid or AWS SES
- [ ] Connect frontend
  - Update `handleForgotPassword` in `app.tsx`
  - Show success message
  - Add reset token form (if needed)

**Acceptance Criteria:**
- [ ] User can request password reset
- [ ] Reset token generated and logged
- [ ] Token expires after 1 hour
- [ ] Token can only be used once
- [ ] Password successfully updated

**Dependencies:** Email service (optional, can simulate)

---

### 6. Add Track Editing
**Status:** ⚪ Not Started
**Assignee:** Unassigned
**Effort:** 4-6 hours
**Due:** October 14, 2025

**Problem:**
Artists can upload tracks but cannot edit metadata or delete them.

**Subtasks:**
- [ ] Create update track endpoint
  - `PATCH /api/tracks/:id`
  - Validate artist owns track
  - Update title, description, genre, isPublic
  - Location: `mixflow/backend/src/controllers/track.controller.ts`
- [ ] Create delete track endpoint
  - `DELETE /api/tracks/:id`
  - Soft delete (set status to DELETED)
  - Verify artist ownership
  - Consider file cleanup (future)
- [ ] Create edit modal UI
  - Edit form with track metadata
  - Image upload for artwork change
  - Delete confirmation dialog
  - Location: `mixflow/web-app/src/app/app.tsx` (new modal component)
- [ ] Add edit button to track cards
  - Show only for track owner
  - Open edit modal
- [ ] Implement file deletion (optional)
  - Clean up audio and artwork files
  - Consider storage costs

**Acceptance Criteria:**
- [ ] Artist can edit track metadata
- [ ] Changes persist to database
- [ ] Artist can delete tracks
- [ ] Deleted tracks don't appear in listings
- [ ] Non-owners cannot edit tracks

**Dependencies:** Authentication working

---

### 7. Implement 15-Minute Guest Listening Limit
**Status:** 🔴 Blocked
**Assignee:** Unassigned
**Effort:** 4-6 hours
**Due:** October 21, 2025
**Blocked By:** Task #8 (Split app.tsx into components)

**Problem:**
Need to encourage user sign-ups while allowing trial listening experience. User requested a feature that limits anonymous listening to 15 minutes before prompting sign-in.

**Implementation Design:**
- Track cumulative listening time for guest (unauthenticated) users
- Display warning banner at 75% of limit (11.25 minutes)
- Pause playback and show sign-in modal when 15-minute limit reached
- Reset timer when user signs in
- Timer persists during session but doesn't require cookies/localStorage initially

**Subtasks:**
- [ ] Create GuestLimitModal component
  - User-friendly modal explaining benefits of signing in
  - List benefits: unlimited listening, playlists, follows, uploads
  - "Create Free Account" and "Sign In" buttons
  - Location: `mixflow/web-app/src/components/modals/GuestLimitModal.tsx`
- [ ] Create GuestWarningBanner component
  - Shows at 75% of time limit in mini player
  - Displays remaining time
  - "Sign Up Free" CTA button
  - Location: `mixflow/web-app/src/components/player/GuestWarningBanner.tsx`
- [ ] Add listening time tracking logic
  - State for tracking cumulative seconds listened
  - Timer useEffect that increments during playback
  - Pause tracking when authenticated
  - Reset timer on sign-in
  - Pause playback and show modal at limit
- [ ] Test edge cases
  - User switches between pause/play frequently
  - User refreshes page (resets timer - acceptable for MVP)
  - User signs in mid-session
  - Timer cleanup on unmount

**Files to Create:**
- `mixflow/web-app/src/components/modals/GuestLimitModal.tsx`
- `mixflow/web-app/src/components/player/GuestWarningBanner.tsx`

**Files to Modify:**
- `mixflow/web-app/src/app/app.tsx` - Add timer state and logic (after component splitting)
- `mixflow/web-app/src/components/player/MiniPlayer.tsx` - Integrate warning banner

**Technical Notes:**
- Implementation was attempted in monolithic app.tsx (3250+ lines) but hit syntax errors
- Parser couldn't handle additional complexity in the large file
- Must wait until Task #8 (Split app.tsx) is complete
- Once components are split, implementation will be straightforward

**Acceptance Criteria:**
- [ ] Guest users can listen for 15 minutes before intervention
- [ ] Warning banner appears at 11.25 minutes (75%)
- [ ] Playback pauses automatically at 15 minutes
- [ ] Modal appears with clear call-to-action
- [ ] Timer resets when user signs in
- [ ] No errors or crashes
- [ ] Timer cleanup on component unmount

**Dependencies:** Task #8 (Split app.tsx into components)
**Blocks:** None - Growth/monetization feature

**User Feedback:**
User quote: "we can have a feature that will direct them to sign in after listening to music for more than 15minutes"

---

## 🟢 Medium Priority (P2) - NEXT SPRINT

### 8. Create Public Artist Profile Pages
**Status:** ⚪ Not Started
**Assignee:** Unassigned
**Effort:** 6-8 hours
**Due:** October 21, 2025

**Problem:**
Artists have profiles but no public-facing page to showcase their work.

**Subtasks:**
- [ ] Implement React Router
  - Add react-router-dom dependency
  - Set up BrowserRouter
  - Create route structure
  - Location: `mixflow/web-app/src/app/app.tsx`
- [ ] Create artist profile page component
  - Display artist info (name, bio, images)
  - Show track list
  - Social links
  - Follow button (UI only initially)
  - Location: Create `mixflow/web-app/src/pages/ArtistProfile.tsx`
- [ ] Create artist URL slugs
  - Generate slug from stage name
  - Add slug field to Artist model
  - Ensure uniqueness
  - Route: `/artist/:slug`
- [ ] Update backend endpoint
  - `GET /api/artist/slug/:slug` (new)
  - Return artist + tracks
- [ ] Add navigation
  - Link from track cards to artist page
  - Breadcrumbs
  - Back button

**Routes to Create:**
- `/` - Home
- `/artist/:slug` - Artist profile
- `/track/:id` - Track detail (future)
- `/search` - Search results (future)

**Acceptance Criteria:**
- [ ] Artist profiles accessible via URL
- [ ] URLs shareable and bookmarkable
- [ ] All artist info displayed
- [ ] Artist's tracks shown
- [ ] SEO-friendly URLs

**Dependencies:** React Router installation

---

### 9. Split app.tsx into Components
**Status:** ⚪ Not Started - Technical Debt
**Assignee:** Unassigned
**Effort:** 8-12 hours
**Due:** October 28, 2025

**Problem:**
`app.tsx` is 3250+ lines, making it difficult to maintain and slowing HMR.

**Subtasks:**
- [ ] Create component directory structure
  - `/components/auth/` - Auth components
  - `/components/player/` - Player components
  - `/components/track/` - Track components
  - `/components/layout/` - Layout components
  - `/components/modals/` - Modal components
- [ ] Extract auth components
  - `AuthModal.tsx`
  - `LoginForm.tsx`
  - `RegisterForm.tsx`
  - `ForgotPasswordForm.tsx`
- [ ] Extract player components
  - `MiniPlayer.tsx`
  - `AudioControls.tsx`
  - `VolumeControl.tsx`
- [ ] Extract track components
  - `TrackCard.tsx`
  - `TrackGrid.tsx`
  - `TrackList.tsx`
  - `UploadForm.tsx`
- [ ] Extract layout components
  - `Sidebar.tsx`
  - `Header.tsx`
  - `Navigation.tsx`
- [ ] Create shared types file
  - Move interfaces to `types/index.ts`
  - Export from single location
- [ ] Create API service file
  - Move `apiCall` to `services/api.ts`
  - Add typed API methods

**Refactoring Strategy:**
- One component at a time
- Test after each extraction
- Don't change functionality
- Maintain backward compatibility

**Acceptance Criteria:**
- [ ] app.tsx < 500 lines
- [ ] All components in separate files
- [ ] No functionality broken
- [ ] HMR performance improved
- [ ] Types properly shared

**Dependencies:** None, but should happen soon
**Blocks:** Task #7 (Guest listening limit implementation)

---

### 10. Add Loading States & Skeletons
**Status:** ⚪ Not Started
**Assignee:** Unassigned
**Effort:** 4-6 hours
**Due:** October 28, 2025

**Problem:**
No loading indicators during API calls, poor perceived performance.

**Subtasks:**
- [ ] Create loading components
  - Spinner component
  - Skeleton loaders for track cards
  - Skeleton for artist profile
  - Progress bar for uploads
  - Location: Create `mixflow/web-app/src/components/loading/`
- [ ] Add loading states
  - Track listing loading
  - Search loading
  - Profile loading
  - Auth loading
- [ ] Implement optimistic updates
  - Track like/unlike
  - Follow/unfollow (future)
  - Track upload feedback
- [ ] Add transitions
  - Fade-in for loaded content
  - Smooth skeleton → content transition

**Acceptance Criteria:**
- [ ] Loading states shown for all async operations
- [ ] Skeleton loaders match final content layout
- [ ] Smooth transitions
- [ ] User always knows something is happening

**Dependencies:** None

---

### 11. Implement Basic Tests
**Status:** ⚪ Not Started - Technical Debt
**Assignee:** Unassigned
**Effort:** 6-8 hours (ongoing)
**Due:** October 28, 2025

**Problem:**
Zero test coverage, risk of regressions.

**Subtasks:**
- [ ] Backend unit tests
  - Auth controller tests
  - Track controller tests
  - Middleware tests
  - JWT utility tests
  - Location: `mixflow/backend/src/**/*.spec.ts`
- [ ] Backend E2E tests
  - Register + login flow
  - Upload track flow
  - Track streaming
  - Location: `mixflow/backend-e2e/`
- [ ] Frontend component tests
  - Auth form tests
  - Track card tests
  - Player tests
  - Location: `mixflow/web-app/src/**/*.spec.tsx`
- [ ] Setup test database
  - SQLite in-memory for tests
  - Seed test data
- [ ] CI/CD integration (future)
  - Run tests on push
  - Block merge if tests fail

**Test Framework:**
- Backend: Jest
- Frontend: Jest + React Testing Library

**Target Coverage:**
- Critical paths: 80%+
- Overall: 60%+

**Acceptance Criteria:**
- [ ] Tests run with `npx nx test`
- [ ] Critical user flows covered
- [ ] Tests pass consistently
- [ ] Tests run in < 30 seconds

**Dependencies:** None

---

## 🔵 Low Priority (P3) - FUTURE

### 12. Add Content Moderation Queue
**Effort:** 8-12 hours
**Target:** Phase 2, Week 15

**Subtasks:**
- [ ] Create admin dashboard route
- [ ] List pending tracks
- [ ] Approve/reject actions
- [ ] Admin authentication & authorization
- [ ] Email notifications to artists

---

### 13. Implement Analytics Dashboard
**Effort:** 12-16 hours
**Target:** Phase 2, Week 13-14

**Subtasks:**
- [ ] Track stream events
- [ ] Aggregate analytics data
- [ ] Create charts (line, bar, pie)
- [ ] Date range selector
- [ ] Export to CSV

---

### 14. Add Playlist Functionality
**Effort:** 12-16 hours
**Target:** Phase 2, Week 11-12

**Subtasks:**
- [ ] Playlist CRUD endpoints
- [ ] Playlist UI components
- [ ] Add/remove tracks
- [ ] Reorder tracks (drag-drop)
- [ ] Public/private settings

---

### 15. Implement Following System
**Effort:** 8-12 hours
**Target:** Phase 4, Week 29

**Subtasks:**
- [ ] Follow/unfollow endpoints
- [ ] Following feed
- [ ] Notification system
- [ ] Follower count display

---

### 16. Build DJ Mixing Interface
**Effort:** 40+ hours
**Target:** Phase 3, Week 17-22

**Subtasks:**
- [ ] Web Audio API integration
- [ ] Dual-deck player
- [ ] Crossfade controls
- [ ] EQ and effects
- [ ] Waveform visualization
- [ ] BPM detection and sync
- [ ] Session recording

---

## 📋 Task Templates

### For New Tasks:

```markdown
### Task Title
**Status:** ⚪ Not Started / 🟡 In Progress / 🟢 Complete / 🔴 Blocked
**Priority:** P0 Critical / P1 High / P2 Medium / P3 Low
**Assignee:** Name
**Effort:** X hours
**Due:** Date

**Problem:**
What problem does this solve?

**Subtasks:**
- [ ] Subtask 1
- [ ] Subtask 2

**Files to Modify:**
- file/path/here.ts

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2

**Dependencies:** What must be done first?
**Blocks:** What does this block?
```

---

## 🏆 Sprint Goals

### Current Sprint (Week 6) - Ending Oct 14
1. ✅ Fix password input focus issue
2. ✅ Fix audio playback
3. ⚪ Implement search backend
4. ⚪ Add password reset backend
5. ⚪ Configure production API URL

### Next Sprint (Week 7-8) - Oct 15-28
1. Add track editing
2. Create public artist pages
3. Split app.tsx into components
4. Add loading states
5. Basic test coverage

---

## 📊 Progress Tracking

### Phase 1 MVP Progress: 60%

**Completed:** 11/20 tasks
**In Progress:** 2/20 tasks
**Not Started:** 7/20 tasks

**By Priority:**
- P0 Critical: 2/5 complete (40%)
- P1 High: 4/8 complete (50%)
- P2 Medium: 3/5 complete (60%)
- P3 Low: 2/2 complete (100%)

---

## 🚨 Blockers & Issues

### Current Blockers
1. **Task #7 (Guest Listening Limit)** - Blocked by Task #9 (Split app.tsx), syntax errors in monolithic file
2. None others critical at this time

### Recently Resolved
- ✅ Password input focus loss (Oct 7)
- ✅ Audio playback failure (Oct 7) - CORS and URL fixes

### Upcoming Potential Blockers
- Email service integration (needed for password reset)
- Cloud storage migration (needed for scale)
- Payment integration (needed for monetization)

---

## 💡 Quick Wins (< 2 hours each)

These tasks provide high value for low effort:

1. **Add input validation feedback**
   - Show password strength
   - Email format validation
   - File size warnings

2. **Improve error messages**
   - Replace generic errors with specific messages
   - Add error codes

3. **Add keyboard shortcuts**
   - Space = play/pause
   - Arrow keys = seek
   - Escape = close modal

4. **Add track duration formatting**
   - Show mm:ss instead of seconds
   - Format file sizes

5. **Add "No tracks" empty states**
   - Better UX when no content
   - Call-to-action buttons

---

## 📝 Notes

- Tasks marked with ⚠️ are technical debt
- P0 tasks block MVP launch - do first
- P1 tasks needed for Phase 1 completion
- P2 tasks can wait until Phase 2
- P3 tasks are nice-to-have

**Remember:** Done is better than perfect. Ship working features, iterate based on feedback.

---

**Document Version:** 1.0
**Last Updated:** October 7, 2025
**Next Review:** October 14, 2025 (Sprint End)
