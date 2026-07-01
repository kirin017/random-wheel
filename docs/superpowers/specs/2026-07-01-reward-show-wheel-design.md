# Reward Show Wheel Design

Date: 2026-07-01

## Goal

Upgrade the existing prize wheel into a more impressive, tactile, and suspenseful experience while preserving the current prize logic and lead-capture flow.

The selected direction is **Reward Show with Product Spotlight**:

- The wheel should feel physically weighted, with acceleration, fast spin, gradual deceleration, a small pointer/tick reaction, and a final settle bounce.
- After the wheel stops, the app should run a 2.5-3.5 second Product Spotlight reveal before showing the existing claim form.
- Effects should feel premium and controlled, not loud casino-style.
- Prize selection, quantity handling, winner capture, and Google Sheets sync must continue to work as they do now.

## Selected Approach

Use a centralized GSAP timeline for the main spin and reveal choreography.

Supporting libraries:

- `gsap` for the spin timeline, easing, blur, zoom, glow, pointer reaction, and Product Spotlight sequencing.
- `howler` for short, controlled audio cues with easier volume management than raw Web Audio.
- `@tsparticles/react` with a lightweight preset for controlled start/win particles.
- Existing `canvas-confetti` remains for the final celebration.

This approach gives the strongest control over timing while avoiding a fully custom physics engine. Prize fairness and final landing accuracy remain driven by the existing `pickWeightedPrize` and `calcTargetAngle` logic.

## User Experience

Spin flow:

1. User presses `Quay ngay`.
2. Button compresses briefly and plays a soft whoosh if sound is enabled.
3. A small particle burst appears from the wheel center.
4. Wheel accelerates quickly, enters a fast spin phase, then decelerates with visible inertia.
5. Pointer ticks as segments pass under it. Tick frequency naturally slows as the wheel decelerates.
6. During the final approach, the wheel zooms slightly and the surrounding glow increases.
7. Wheel settles with a small bounce into the winning segment.
8. Winning segment glows for a short beat.
9. Product Spotlight overlay appears for 2.5-3.5 seconds.
10. The current winner claim flow appears after the spotlight reveal.

The desired emotional arc is:

- Immediate response on press.
- Fast launch.
- Suspense during deceleration.
- Clean final stop.
- Premium product-focused reveal.
- Clear path to claim the prize.

## Architecture

Keep animation responsibilities separated from prize/business logic.

### `src/hooks/useSpin.ts`

Responsibilities:

- Guard against double spin while already spinning.
- Pick the winner through `pickWeightedPrize`.
- Calculate final target angle through `calcTargetAngle`.
- Start the GSAP spin timeline.
- Update store state at the correct moments.
- Trigger audio, haptic feedback, particle bursts, and confetti through small helper APIs.
- Clean up or kill any active timeline before starting a new one.

The hook should still expose `spin` and `rotationRef`.

### `src/utils/spin.ts`

Responsibilities:

- Keep `pickWeightedPrize` unchanged unless a bug is found.
- Keep `calcTargetAngle` as the source of truth for final landing.
- Add helper utilities:
  - Normalize rotation to 0-360.
  - Resolve segment index from rotation.
  - Resolve winning segment index for glow/tick behavior.

### `src/components/Wheel.tsx`

Responsibilities:

- Render the SVG wheel, pointer, rim, hub, and spin button.
- Provide refs needed by GSAP:
  - wheel group ref
  - pointer ref
  - wheel container ref
  - optional winning segment refs
- Render transient effect layers:
  - glow ring
  - motion blur state
  - light sweep
  - winning segment highlight
- Keep hover tooltip behavior disabled while spinning.

`Wheel.tsx` should not contain large timeline orchestration code. It should expose refs and visual states to the hook or small effect helpers.

### Product Spotlight Reveal

Add a focused reveal component:

- `ProductSpotlightReveal.tsx`, used by `WinnerOverlay`.

This is intentionally separate because the reveal is visually rich and should not make `WinnerOverlay.tsx` harder to maintain.

Responsibilities:

- Show a dim overlay with controlled blur.
- Show the prize image as the main visual if available.
- Fall back to emoji/name when image loading fails.
- Animate product scale, glow, particles, and brief text reveal.
- After the reveal duration, transition to the existing `reveal` claim step.

### Audio Helper

Create a small helper around Howler rather than calling Howler directly throughout components.

Responsibilities:

- Respect `soundEnabled`.
- Play soft cues:
  - press/whoosh
  - subtle tick
  - short win chime
- Keep volume low by default.
- Avoid overlapping too many tick sounds during fast spin.

Use short generated audio assets for the first implementation if no brand audio files are available. Howler remains the playback interface.

### Haptic Helper

Create a small helper around `navigator.vibrate`.

Rules:

- Button press: one short `10ms` vibration.
- Tick: short `8ms` vibration throttled to at most once every `120ms`, not on every very fast segment crossing.
- Win: one soft pattern, for example `[18, 35, 22]`.
- No haptic behavior when `navigator.vibrate` is unavailable.

## State

Keep prize and winner models unchanged.

Use non-persisted UI state only:

- `spinPhase`: idle, launching, spinning, decelerating, settling, spotlight.
- `winningSegmentKey`: used for glow/highlight because the same prize can appear in multiple visual segment entries.
- `spotlightActive`: owned locally by `WinnerOverlay` while the Product Spotlight is playing.

Do not move animation internals into persisted Zustand state. Timeline refs, previous segment index, velocity, and temporary tick counters should stay in refs/local component state.

## Motion Spec

The exact values can be tuned during implementation, but the initial target is:

| Phase | Duration | Behavior |
| --- | ---: | --- |
| Press | 0.12s | Button scale `1 -> 0.96 -> 1` |
| Launch | 0.6s | Rapid acceleration, center particle burst, wheel scale `1 -> 1.015` |
| Cruise | 1.2-1.8s | Fast spin, motion blur `4-8px` |
| Decelerate | 2.8-3.8s | Ease out, blur reduces to `0px` |
| Near stop | Last 0.6s | Wheel zoom `1.04-1.07`, glow pulse increases |
| Settle | 0.35-0.5s | Small bounce into the final angle |
| Winner glow | 0.4-0.7s | Winning segment glow/drop-shadow |
| Product Spotlight | 2.5-3.5s | Prize scale, glow, particle, controlled confetti |

Recommended easing:

- Main deceleration: GSAP `power4.out`.
- Settle bounce: small `back.out`, with low overshoot.
- Product reveal: `back.out` for product scale, `power2.out` for overlay and glow.

Avoid a linear spin feel.

## Tick And Pointer Behavior

Tick is based on segment crossing, not a fixed interval.

Implementation approach:

1. During the GSAP update callback, read current rotation.
2. Normalize it to the visual wheel angle.
3. Compute the segment under the fixed top pointer.
4. If segment index changed:
   - Animate pointer `rotate(-8deg) -> rotate(10deg) -> rotate(0deg)`.
   - Play a low-volume tick if sound is enabled and tick sound is not throttled.
   - Trigger short haptic feedback only when not too frequent.

The pointer should not tick when the wheel is idle.

## Motion Blur And Glow

Motion blur should track the spin phase.

Simple initial mapping:

- Launch/cruise: `filter: blur(4-8px)` on the rotating wheel group.
- Deceleration: animate blur back to `0px`.
- Settle/winner: no blur.

Glow:

- While spinning: soft radial ring behind the wheel.
- Near stop: ring brightens slightly.
- Winner: render a duplicate color-matched winning segment overlay path with drop shadow and fade it out after the Product Spotlight starts.

The implementation must avoid leaving blur active after the spin completes.

## Product Spotlight Reveal

The Product Spotlight is the selected reward reveal style.

Visual behavior:

- Background darkens lightly with backdrop blur.
- Prize image or fallback prize visual appears centered and large.
- Product visual animates `scale(0.78) -> scale(1.08) -> scale(1)`.
- Glow ring uses the winner color, with citrus/brand accents.
- Particle motion is subtle and concentrated around the product.
- Confetti is moderate, not screen-filling.
- The reveal then hands off to the existing claim form.

Copy should remain concise. Avoid extra instructional text on the visual effect itself.

## Sound And Haptic Direction

Selected direction: light and premium.

Sound rules:

- Soft whoosh on launch.
- Soft tick on segment crossing.
- Short win chime after final settle.
- Low volume by default.
- No loud casino fanfare.

Haptic rules:

- Minimal and mobile-only.
- No repeated vibration during fast spin beyond a throttle limit.
- Respect browser support and fail silently.

## Accessibility And Reduced Motion

The existing flow must remain accessible.

Requirements:

- `prefers-reduced-motion: reduce` disables or sharply reduces blur, particles, zoom, and bounce.
- Reduced motion still lands on the correct winner.
- Spin button remains disabled while spinning.
- Overlay content remains keyboard dismissible through the existing Escape behavior where applicable.
- Audio respects `soundEnabled`.
- Animation effects must not hide or block form controls after the reveal.
- Text must remain legible on mobile and desktop.

## Error Handling

- If a prize image fails to load, spotlight uses emoji/fallback styling.
- If Howler cannot play because of browser autoplay restrictions, the spin still proceeds.
- If particles fail to initialize, the wheel still spins and reveal still appears.
- If confetti fails, the claim flow still appears.
- If a timeline is interrupted, cleanup should remove blur/glow/transient classes before returning to idle.

## Testing And Verification

Run:

- `npm run build`

Manual/browser verification:

- Desktop wheel spin.
- Mobile wheel spin.
- Sound enabled and sound disabled.
- Product image success and image failure fallback.
- Multiple spins in sequence.
- Double-click on spin button does not start overlapping timelines.
- Reduced motion mode.
- Winner claim form still records lead, decrements quantity, and attempts Sheet sync.

Behavior checks:

- Weighted prize selection still uses `pickWeightedPrize`.
- Final wheel angle still lands on the selected winner.
- Pointer tick only fires during spin.
- Blur returns to zero after spin.
- Spotlight lasts 2.5-3.5 seconds before claim UI.
- Confetti/particles do not block claim buttons.

## Out Of Scope

- Three.js or React Three Fiber wheel.
- Full 3D wheel geometry.
- Reward chest/box opening, because Product Spotlight was selected.
- Loud game-show audio pack.
- Server-side animation analytics.
- Changes to prize weighting rules.
- Changes to Google Sheets payload behavior except preserving existing flow.

## Acceptance Criteria

- Wheel spin clearly has acceleration, fast spin, deceleration, and final settle.
- Pointer visibly ticks as segments pass.
- Tick sound and haptic feedback are subtle and respect user/browser settings.
- Motion blur appears only while spinning quickly and is removed at the end.
- Winning segment glows after the wheel stops.
- Product Spotlight reveal runs for 2.5-3.5 seconds before the claim flow.
- Prize image fallback is handled gracefully.
- Existing lead capture and winner recording behavior still works.
- The project builds successfully.
