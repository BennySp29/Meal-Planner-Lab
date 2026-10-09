# Antigravity Agent Guidelines

## 1. UI & UX Integrity (Absolute Priority)
- **Visual Smoothness**: Prioritize high-performance, smooth transitions, and complete layout integrity. Never break existing UI structures, flex/grid alignments, or spacing patterns.
- **Ease of Use**: Layouts must be intuitive and clean. Avoid unnecessary visual noise. Keep interactive elements easily accessible and interactive states (hover, active, loading) visually obvious.
- **Visual Verification**: Use your built-in browser capability (`/browser`) and screenshots to visually verify UI adjustments before generating your final walkthrough artifact.
- **Cross-Platform Phone Friendly (Pixel 11 Pro & iPhone 17)**:
  - **Primary User:** Google Pixel 11 Pro (Android / Chrome PWA). Must support Android gesture navigation, Chrome PWA lifecycle, dynamic Android status/nav bar integration, and Android push/badge capabilities.
  - **Partner (Wife):** iPhone 17 (iOS Safari PWA added to Home Screen). Must account for standalone WebKit caching quirks, Dynamic Island & home bar safe-area insets (`env(safe-area-inset-top)` / `env(safe-area-inset-bottom)`), smooth iOS momentum scrolling, and touch target sizing.
  - **Real-Time Cross-Device Sync:** Both phones share data in real-time via Firebase. Every change must seamlessly propagate between Pixel (Android) and iPhone (iOS) without stale cache states on either device.

## 2. Live-Sync & Data Freshness
- **Real-Time Data State**: When working with state and database syncing (e.g., Firebase), prioritize robust, real-time listeners over single-get calls to eliminate stale data issues across concurrent users.
- **Race Condition Prevention**: Ensure local UI states update optimistically or show distinct loading indicators while waiting for remote database confirmations to prevent UI stutter.
- **State Integrity**: Always clean up active listeners and subscriptions when components unmount to prevent memory leaks and duplicate sync processes.

## 3. Interactive Mentorship & Teaching
- **Teach as We Build**: Do not silently write code or execute plans. Act as an expert, patient developer-mentor.
- **Explain the "Why"**: For every major design choice or architectural implementation plan, briefly explain the logic behind it, the pros and cons of the approach, and how it functions under the hood.
- **Actionable Summaries**: In your `walkthrough.md` files, highlight the key programming concepts or design patterns used so I can learn from them and reproduce them myself.

## 4. Testing as a consumer to work out any issues
- **Test all changes**: Any changes you make test them, make any changes needed and test again, repeat this as needed.
