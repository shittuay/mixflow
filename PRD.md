# Product Requirements Document (PRD)
# MixFlow - Music Streaming & DJ Platform

**Version:** 1.0
**Last Updated:** October 7, 2025
**Document Owner:** Product Team

---

## 1. Executive Summary

### 1.1 Product Vision
MixFlow is a next-generation music streaming and DJ platform that empowers artists to share their music and DJs to create seamless mixes in real-time. The platform bridges the gap between music streaming services and professional DJ software, offering a unified experience for listeners, artists, and DJs.

### 1.2 Product Goals
- Provide a seamless music streaming experience for listeners
- Enable artists to upload, manage, and monetize their music
- Offer professional-grade DJ tools for live mixing and session recording
- Build a community-driven platform with social features
- Support multiple revenue streams (subscriptions, artist payments)

### 1.3 Target Audience
1. **Listeners** - Music enthusiasts seeking curated content and DJ mixes
2. **Artists** - Independent musicians looking to distribute and monetize their work
3. **DJs** - Professional and amateur DJs wanting live mixing capabilities
4. **Administrators** - Platform moderators managing content and users

---

## 2. Product Overview

### 2.1 Core Value Propositions
- **For Listeners**: Discover new music, create playlists, enjoy live DJ sessions
- **For Artists**: Direct-to-fan distribution, analytics, revenue generation
- **For DJs**: Browser-based mixing tools, live streaming, session recording
- **For All**: Community features, social interactions, music discovery

### 2.2 Key Differentiators
1. Integrated DJ mixing capabilities in the browser
2. Real-time live DJ sessions with audience interaction
3. Direct artist-to-listener connection
4. Comprehensive analytics for artists
5. Cross-platform compatibility (web-first approach)

---

## 3. User Personas

### 3.1 Sarah - The Independent Artist
- **Age**: 28
- **Goals**: Build fanbase, monetize music, track performance
- **Pain Points**: Limited reach on major platforms, poor analytics
- **Needs**: Easy upload, detailed analytics, fair revenue sharing

### 3.2 Mike - The Amateur DJ
- **Age**: 24
- **Goals**: Practice mixing, share mixes, grow audience
- **Pain Points**: Expensive DJ software, hardware requirements
- **Needs**: Browser-based tools, session recording, easy sharing

### 3.3 Emma - The Music Listener
- **Age**: 22
- **Goals**: Discover new music, enjoy curated mixes
- **Pain Points**: Generic recommendations, same old music
- **Needs**: Personalized discovery, live DJ sessions, playlists

---

## 4. Feature Requirements

### 4.1 Authentication & User Management

#### 4.1.1 User Registration
**Priority:** P0 (Critical)
**Status:** ✅ Implemented

**Requirements:**
- Email + password registration
- Username uniqueness validation
- Email verification flow
- Password strength requirements (min 8 chars)
- User type selection (Listener/Artist)

**Acceptance Criteria:**
- User can register with valid email and password
- Duplicate emails are rejected with clear error
- Verification email sent within 30 seconds
- User profile created with default settings

#### 4.1.2 User Login
**Priority:** P0 (Critical)
**Status:** ✅ Implemented (with focus fix)

**Requirements:**
- Email/password authentication
- JWT token generation
- Token expiration (7 days default)
- Remember me functionality
- Password visibility toggle

**Acceptance Criteria:**
- Valid credentials grant access
- JWT token stored securely
- Invalid credentials show clear error
- Password field maintains focus during interaction

#### 4.1.3 Password Recovery
**Priority:** P1 (High)
**Status:** ⚠️ Partially Implemented (UI only)

**Requirements:**
- Forgot password flow
- Email-based reset link
- Secure token generation
- Password reset form
- Token expiration (1 hour)

**To Do:**
- Implement backend reset endpoint
- Email service integration
- Token validation logic

### 4.2 Music Playback

#### 4.2.1 Audio Player
**Priority:** P0 (Critical)
**Status:** ⚠️ Partially Implemented (has issues)

**Current Issues:**
- "Unable to play this audio file" error
- File format compatibility issues
- CORS configuration needed

**Requirements:**
- Support MP3, WAV, FLAC, OGG formats
- Play/pause controls
- Volume control
- Seek/scrub functionality
- Next/previous track
- Shuffle and repeat modes
- Queue management

**Acceptance Criteria:**
- Audio plays within 2 seconds of track selection
- Smooth transitions between tracks
- Volume persists across sessions
- Playback state synchronized across components

#### 4.2.2 Mini Player
**Priority:** P1 (High)
**Status:** ✅ Implemented

**Requirements:**
- Persistent player at bottom of screen
- Track info display (title, artist, artwork)
- Basic controls (play, pause, skip)
- Volume slider
- Progress bar

### 4.3 Track Management

#### 4.3.1 Track Upload
**Priority:** P0 (Critical)
**Status:** ✅ Implemented

**Requirements:**
- Multi-file upload support
- Drag-and-drop interface
- Upload progress indicator
- File validation (format, size)
- Metadata extraction (duration, bitrate)
- Artwork upload
- Waveform generation

**Technical Specs:**
- Max file size: 100MB
- Supported formats: MP3, WAV, FLAC, OGG
- Max artwork size: 10MB
- Supported image formats: JPG, PNG, WebP

#### 4.3.2 Track Library
**Priority:** P1 (High)
**Status:** ✅ Implemented

**Requirements:**
- Grid/list view toggle
- Search and filter
- Sort by: date, title, artist, plays
- Batch operations (delete, publish)
- Track status indicators (pending, approved, rejected)

#### 4.3.3 Track Details & Editing
**Priority:** P1 (High)
**Status:** 🔲 Not Implemented

**Requirements:**
- Edit track metadata (title, description, genre)
- Change artwork
- Set release date
- Privacy settings (public/private)
- Delete track (with confirmation)
- View analytics

### 4.4 Artist Profiles

#### 4.4.1 Artist Profile Creation
**Priority:** P0 (Critical)
**Status:** ✅ Implemented

**Requirements:**
- Stage name
- Bio/description
- Profile image upload
- Cover image upload
- Genre selection
- Social media links

#### 4.4.2 Artist Dashboard
**Priority:** P1 (High)
**Status:** 🔲 Not Implemented

**Requirements:**
- Overview statistics (streams, followers, revenue)
- Track performance charts
- Recent activity feed
- Earnings summary
- Top tracks widget
- Listener demographics

#### 4.4.3 Public Artist Profile
**Priority:** P1 (High)
**Status:** 🔲 Not Implemented

**Requirements:**
- Artist info display
- Track listing
- Albums (if applicable)
- Follow/unfollow button
- Share profile
- Social links

### 4.5 Playlists

#### 4.5.1 Playlist Creation
**Priority:** P1 (High)
**Status:** 🔲 Not Implemented

**Requirements:**
- Create new playlist
- Add tracks to playlist
- Playlist artwork
- Public/private setting
- Collaborative playlists
- Playlist description

#### 4.5.2 Playlist Management
**Priority:** P1 (High)
**Status:** 🔲 Not Implemented

**Requirements:**
- Reorder tracks (drag-and-drop)
- Remove tracks
- Edit playlist details
- Delete playlist
- Share playlist
- Duplicate playlist

### 4.6 DJ Mixing Features

#### 4.6.1 DJ Session Creation
**Priority:** P2 (Medium)
**Status:** 🔲 Not Implemented

**Requirements:**
- Create live or recorded session
- Session title and description
- Track selection for session
- BPM and key detection
- Crossfade controls
- EQ and effects
- Recording capability

**Technical Requirements:**
- Web Audio API integration
- Real-time audio processing
- Low-latency playback (<50ms)
- Waveform visualization
- BPM sync and tempo adjustment

#### 4.6.2 Live Streaming
**Priority:** P3 (Low)
**Status:** 🔲 Not Implemented

**Requirements:**
- WebRTC-based streaming
- Chat integration
- Viewer count
- Session recording
- Stream quality settings

### 4.7 Search & Discovery

#### 4.7.1 Global Search
**Priority:** P1 (High)
**Status:** ⚠️ Partially Implemented (frontend only)

**Requirements:**
- Search tracks, artists, albums, playlists
- Real-time search suggestions
- Search history
- Advanced filters (genre, BPM, key, year)
- Sort results by relevance, popularity, date

#### 4.7.2 Browse & Explore
**Priority:** P2 (Medium)
**Status:** 🔲 Not Implemented

**Requirements:**
- Genre browsing
- Trending tracks
- New releases
- Featured artists
- Curated playlists
- Personalized recommendations

### 4.8 Social Features

#### 4.8.1 Following System
**Priority:** P2 (Medium)
**Status:** 🔲 Not Implemented

**Requirements:**
- Follow/unfollow artists
- Following feed
- Follower count
- Notification on new releases

#### 4.8.2 Comments & Interactions
**Priority:** P3 (Low)
**Status:** 🔲 Not Implemented

**Requirements:**
- Comment on tracks
- Like/favorite tracks
- Share tracks (social media, copy link)
- Repost functionality

### 4.9 Subscriptions & Payments

#### 4.9.1 Subscription Tiers
**Priority:** P2 (Medium)
**Status:** ⚠️ Database schema only

**Tiers:**
1. **Free**
   - Ad-supported listening
   - Standard quality audio
   - Limited skips
   - No downloads

2. **Pro ($9.99/month)**
   - Ad-free listening
   - High-quality audio
   - Unlimited skips
   - Offline downloads
   - Advanced search

3. **Artist ($19.99/month)**
   - All Pro features
   - Unlimited uploads
   - Advanced analytics
   - DJ mixing tools
   - Revenue sharing
   - Priority support

#### 4.9.2 Payment Integration
**Priority:** P2 (Medium)
**Status:** 🔲 Not Implemented

**Requirements:**
- Stripe integration
- Credit card payments
- Subscription management
- Invoice generation
- Payment history
- Automatic renewals
- Cancellation flow

### 4.10 Analytics & Reporting

#### 4.10.1 Artist Analytics
**Priority:** P2 (Medium)
**Status:** ⚠️ Database schema only

**Metrics:**
- Total streams (by track, by period)
- Unique listeners
- Geographic distribution
- Top countries/cities
- Listener demographics
- Revenue breakdown
- Stream completion rate
- Peak listening times

#### 4.10.2 User Analytics
**Priority:** P3 (Low)
**Status:** 🔲 Not Implemented

**Metrics:**
- Listening history
- Top artists/genres
- Time listened
- Listening patterns
- Discover weekly stats

### 4.11 Admin Panel

#### 4.11.1 Content Moderation
**Priority:** P1 (High)
**Status:** 🔲 Not Implemented

**Requirements:**
- Review pending tracks
- Approve/reject submissions
- Flag inappropriate content
- User management
- Ban/suspend users
- Content takedown

#### 4.11.2 Platform Analytics
**Priority:** P2 (Medium)
**Status:** 🔲 Not Implemented

**Requirements:**
- Total users (by type)
- Total tracks/streams
- Revenue dashboard
- User growth charts
- Content growth charts
- System health metrics

---

## 5. Technical Requirements

### 5.1 Architecture
- **Frontend**: React + TypeScript (Vite)
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (dev), PostgreSQL (production)
- **ORM**: Prisma
- **Monorepo**: Nx workspace
- **Authentication**: JWT tokens
- **File Storage**: Local filesystem (dev), S3/CDN (production)

### 5.2 Performance Requirements
- Page load time: < 2 seconds
- Audio start latency: < 2 seconds
- Search results: < 500ms
- API response time: < 200ms (p95)
- Uptime: 99.9%

### 5.3 Security Requirements
- HTTPS in production
- Password hashing (bcrypt, 12 rounds)
- JWT token expiration
- CORS configuration
- Rate limiting
- Input validation
- XSS protection
- CSRF protection
- File upload validation

### 5.4 Browser Support
- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

### 5.5 Mobile Support
- Responsive design (mobile-first)
- Touch-friendly controls
- PWA capabilities (future)

---

## 6. Success Metrics

### 6.1 User Acquisition
- Monthly active users (MAU)
- New user signups per week
- User retention rate (7-day, 30-day)
- User acquisition cost

### 6.2 Engagement
- Average session duration
- Tracks played per session
- Playlists created per user
- Daily active users / MAU ratio

### 6.3 Content
- Tracks uploaded per week
- Artist signup rate
- Average tracks per artist
- Track approval rate

### 6.4 Revenue
- Monthly recurring revenue (MRR)
- Subscription conversion rate
- Average revenue per user (ARPU)
- Churn rate

---

## 7. Risks & Mitigation

### 7.1 Technical Risks
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Audio playback compatibility | High | Medium | Implement multiple codec support, fallback mechanisms |
| Scalability issues | High | Medium | Use CDN, implement caching, database optimization |
| File storage costs | Medium | High | Compress audio, use efficient formats, implement cleanup |
| Real-time DJ mixing latency | High | High | Use Web Audio API, optimize buffer sizes, local processing |

### 7.2 Business Risks
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Copyright infringement | High | Medium | Content moderation, DMCA process, artist verification |
| Low artist adoption | High | Medium | Marketing, creator incentives, easy onboarding |
| Competition from major platforms | High | High | Focus on DJ features, niche marketing |
| Revenue sustainability | High | Medium | Multiple revenue streams, cost optimization |

### 7.3 Legal Risks
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Music licensing issues | High | Medium | Clear ToS, artist-uploaded content only |
| Data privacy violations | High | Low | GDPR compliance, privacy policy, data encryption |
| User-generated content liability | Medium | Medium | Content moderation, reporting system |

---

## 8. Timeline & Milestones

### Phase 1: MVP (Current - Week 8)
**Status:** 60% Complete

- ✅ User authentication
- ✅ Artist profiles
- ✅ Track upload
- ⚠️ Audio playback (buggy)
- ⚠️ Search (frontend only)
- 🔲 Playlists
- 🔲 Admin panel

### Phase 2: Core Features (Week 9-16)
- Track editing
- Public artist profiles
- Full search implementation
- Analytics dashboard
- Payment integration
- Content moderation

### Phase 3: DJ Features (Week 17-24)
- DJ session creation
- Mixing tools
- Waveform visualization
- Session recording
- Live streaming (beta)

### Phase 4: Growth & Polish (Week 25-32)
- Mobile optimization
- Performance optimization
- Social features
- Recommendation engine
- Marketing site
- API documentation

---

## 9. Dependencies

### 9.1 External Services
- **Email**: SendGrid / AWS SES (not implemented)
- **Storage**: AWS S3 / Cloudinary (future)
- **CDN**: Cloudflare / AWS CloudFront (future)
- **Payments**: Stripe (not implemented)
- **Analytics**: Google Analytics / Mixpanel (future)
- **Error Tracking**: Sentry (future)

### 9.2 Third-Party Libraries
- React Router (navigation)
- Lucide React (icons)
- Tailwind CSS (styling)
- Axios (HTTP client)
- Prisma (ORM)
- bcryptjs (password hashing)
- jsonwebtoken (JWT)
- Multer (file uploads)

---

## 10. Open Questions

1. **Audio Format**: Should we transcode all uploads to a single format for consistency?
2. **Storage Strategy**: When should we migrate to cloud storage (S3)?
3. **Revenue Split**: What percentage should artists receive from streams?
4. **Content Moderation**: Automated moderation tools or manual review?
5. **Mobile Apps**: Native apps or PWA approach?
6. **DJ Features**: Priority over other features or delay to Phase 3?
7. **API Public Access**: Should we expose a public API for third-party integrations?

---

## 11. Appendix

### 11.1 Glossary
- **MAU**: Monthly Active Users
- **MRR**: Monthly Recurring Revenue
- **ARPU**: Average Revenue Per User
- **CDN**: Content Delivery Network
- **PWA**: Progressive Web App
- **JWT**: JSON Web Token
- **CORS**: Cross-Origin Resource Sharing

### 11.2 References
- [Backend README](./mixflow/backend/README.md)
- [Database Schema](./mixflow/backend/prisma/schema.prisma)
- [Nx Documentation](https://nx.dev)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

### 11.3 Change Log
| Date | Version | Changes |
|------|---------|---------|
| 2025-10-07 | 1.0 | Initial PRD creation |
