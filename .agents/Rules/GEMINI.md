# Antigravity Agent Guidelines

## 1. UI & UX Integrity (Absolute Priority)
- **Visual Smoothness**: Prioritize high-performance, smooth transitions, and complete layout integrity. Never break existing UI structures, flex/grid alignments, or spacing patterns.
- **Ease of Use**: Layouts must be intuitive and clean. Avoid unnecessary visual noise. Keep interactive elements easily accessible and interactive states (hover, active, loading) visually obvious.
- **Visual Verification**: Use your built-in browser capability (`/browser`) and screenshots to visually verify UI adjustments before generating your final walkthrough artifact.
- **Phone friendly**: the project is going to be used as a PWA, added to homescreen from safari on Iphone, so we need to make sure all changes are made with this in mind and that we make sure any changes appear on the current users versions on their phones.

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
