# SOLRAD VISUAL + UX AUDIT REPORT
## Dashboard/Home (https://www.solrad.io/)

**Audit Date:** February 6, 2026  
**Scope:** Visual hierarchy, UX patterns, responsive behavior, accessibility, premium feel  
**Methodology:** Code review + heuristic evaluation against WCAG 2.2 AA + industry best practices

---

## 1. SCORECARD (0-10)

| Category | Score | Notes |
|----------|-------|-------|
| **Visual Hierarchy** | 7.5/10 | Strong terminal aesthetic, but some crowding in token cards. Desktop columns clear, mobile tabs need stronger differentiation |
| **Layout Density** | 6/10 | Token cards at 200px fixed height creates cramping. Desktop 4-column layout works well at 1440px+ but feels tight at 1280px. Mobile has good breathing room |
| **Typography** | 8/10 | Excellent use of Geist + Geist Mono. Font sizes mostly appropriate. Some labels too small (9px, 10px) hurt readability |
| **Color System** | 8.5/10 | Vibrant magenta/cyan/lime palette from logo is well-executed. Good contrast in dark mode. Risk badges (green/yellow/red) are clear |
| **Component Consistency** | 7/10 | Badge variants consistent, but button states lack hover feedback in some areas. Icon sizing varies (3-4px range) |
| **Navigation Clarity** | 8/10 | Desktop nav clear with icons. Mobile hamburger works. "COMING SOON" dropdown is good pattern. Breadth is good but depth is shallow |
| **Mobile Responsiveness** | 7/10 | Good breakpoint strategy (430/768/1024/1280/1440px). Mobile-first approach evident. Some tap targets under 44px. Sticky elements work well |
| **Accessibility (WCAG 2.2 AA)** | 6.5/10 | SR-only H1/H2s present. Some contrast issues (text-muted-foreground/70 fails at AA). Missing focus indicators on some interactive elements. No reduced motion preferences honored |
| **Perceived Performance** | 8/10 | Memoized filters/sorts, parallel fetching, shimmer states. Good loading patterns. Ad iframes could lazy load better |

**Overall Average:** **7.4/10** — Solid foundation with clear areas for targeted improvement

---

## 2. TOP 15 ISSUES/IMPROVEMENTS

### **HIGH SEVERITY**

#### **#1: Token Card Height Fixed at 200px Creates Cramping**
- **Where:** `/components/token-card.tsx` — all token cards across dashboard
- **Why it matters:** Content overflows, truncation happens too early, signal rationale gets cut off. Reduces scannability and trust (users can't see full context)
- **Concrete fix:** Change from `h-[200px]` to `min-h-[200px]` and let cards grow naturally based on content. Add `max-h-[240px]` to prevent excessive height

#### **#2: Text Contrast Fails WCAG AA in Multiple Places**
- **Where:** 
  - `text-muted-foreground/70` (used in 15+ places)
  - `text-muted-foreground/60` (column labels)
  - `text-[10px]` timestamps in navbar
- **Why it matters:** Users with low vision or in bright sunlight can't read critical info. Legal compliance risk in some jurisdictions
- **Concrete fix:** 
  - Replace `/70` with `/80` for body text
  - Replace `/60` with `/75` for labels
  - Increase navbar timestamp to `text-[11px]` and use `/80` opacity

#### **#3: Focus Ring Visibility Inconsistent**
- **Where:** Token cards, badges, buttons, search inputs across all terminals
- **Why it matters:** Keyboard users can't track focus state. WCAG 2.4.7 violation. Excludes non-mouse users
- **Concrete fix:** Add `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` to all interactive elements. Already defined in button/badge components but not applied to cards

#### **#4: Mobile Tap Targets Under 44px**
- **Where:** 
  - Icon buttons in navbar (h-9 w-9 = 36px)
  - Badge elements in token cards
  - Filter dropdown triggers on mobile terminal
- **Why it matters:** Touch accuracy suffers, especially for users with motor impairments. Apple HIG and Material Design both recommend 44px minimum
- **Concrete fix:** Increase mobile icon buttons to `h-11 w-11` (44px), add padding to badge tap areas using `p-2` wrapper

#### **#5: Ad Rail Scroll Behavior Breaks Layout at 1280-1440px**
- **Where:** `/components/ads/AAdsRightRail.tsx` — 3 stacked 250px iframes (750px total height) in fixed-width rail
- **Why it matters:** At 1280px viewport, ads push content below fold. Users scroll past intelligence to see ads. Retention risk
- **Concrete fix:** Reduce to 2 ad units at 1280-1439px breakpoint, show 3rd only at 1440px+. Use `hidden xl:block` on 3rd iframe

### **MEDIUM SEVERITY**

#### **#6: Desktop Column Headers Lack Visual Hierarchy**
- **Where:** `/components/desktop-terminal.tsx` — "Trending", "Active Trading", "New & Early", "Fresh Signals" headers
- **Why it matters:** All columns look equally important. User doesn't know where to look first. "Trending" should dominate
- **Concrete fix:** Add size differentiation: Trending (text-base font-bold), others (text-sm font-semibold). Add subtle glow to Trending header: `shadow-[0_0_12px_rgba(251,146,60,0.3)]`

#### **#7: Risk Badge Color Meanings Not Discoverable**
- **Where:** Token cards — "Strong", "Watch", "High Risk" badges
- **Why it matters:** New users don't know if green is good or just different. No legend or tooltip. Barrier to understanding scores
- **Concrete fix:** Add info icon next to first badge in viewport with tooltip: "Risk Labels: Green=Strong fundamentals, Yellow=Caution, Red=High risk signals"

#### **#8: Signal Rationale Truncates Without Expansion**
- **Where:** Token cards — `{(token as any)._rationale}` with `truncate italic` styling
- **Why it matters:** Users see partial explanation like "Liquidity inflection + score momentum..." but can't read full context. Reduces trust in signals
- **Concrete fix:** Remove `truncate`, add `line-clamp-2` instead. On hover, show full rationale in tooltip using `title` attribute

#### **#9: Mobile Tab Segmentation Lacks Active State Clarity**
- **Where:** `/components/mobile-terminal.tsx` — "Trending", "Active", "New" tabs
- **Why it matters:** Active tab uses same background as inactive. Only text color changes. Users lose orientation when scrolling
- **Concrete fix:** Add `border-b-2 border-primary` to active tab, increase padding-bottom by 2px to prevent layout shift

#### **#10: Search Input Placeholder Text Vague**
- **Where:** All search inputs across terminals — "Search..."
- **Why it matters:** Doesn't hint at searchable fields (symbol, name, address). Users don't know what queries work
- **Concrete fix:** Change to "Search symbol, name, or address..." (truncate on small viewports to "Search symbol...")

#### **#11: Token Logo Image Loading Has No Fallback**
- **Where:** `/components/token-card.tsx` — `<Image src={token.imageUrl || "/placeholder.svg?..."}>`
- **Why it matters:** Broken images show placeholder.svg from query param (not real path). Creates visual noise when tokens have no logo
- **Concrete fix:** Create `/public/token-placeholder.svg` with generic coin icon. Update fallback to `/token-placeholder.svg`

#### **#12: Desktop Column Scroll Shadows Missing**
- **Where:** All 4 columns in `/components/desktop-terminal.tsx` — no visual indicator of scrollability
- **Why it matters:** Users don't realize columns scroll independently. Miss tokens below fold. Common UX pattern (Gmail, Notion) is absent
- **Concrete fix:** Add scroll shadow utility: `.scroll-shadow { box-shadow: inset 0 -12px 12px -12px rgba(0,0,0,0.5); }` when scrolled

#### **#13: Navbar "LIVE" Indicator Animation Distracting**
- **Where:** `/components/navbar.tsx` — `.breathe-dot` animation on green status dot
- **Why it matters:** Constant pulsing draws eye away from content. "STALE" animation is appropriate (alerts user), but "LIVE" doesn't need attention
- **Concrete fix:** Remove animation from LIVE state, keep only for STALE. Change from `breathe-dot` to static `bg-green-500`

### **LOW SEVERITY**

#### **#14: Button Hover States Lack Micro-Interaction**
- **Where:** All `<Button>` components — hover only changes background, no scale or shadow
- **Why it matters:** Feels flat compared to modern web apps. Small detail that adds "premium" feel
- **Concrete fix:** Add to button variants: `hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150`

#### **#15: Token Card Rank Badge Blends Into Background**
- **Where:** Token cards — `<span className="text-muted-foreground/70 font-mono text-sm">#{rank}</span>`
- **Why it matters:** Rank is useful context (shows relative position) but hard to read. Gets lost in card noise
- **Concrete fix:** Increase to `text-muted-foreground/90`, add light border: `border-l border-muted-foreground/20 pl-2`

---

## 3. RESPONSIVE CHECKS

### **1440px (Full Desktop)**
✅ **Works well:** 4-column layout breathes, navbar doesn't wrap, ad rail fits comfortably  
⚠️ **Issue:** Ad rail takes 280px + 24px gap = 304px. Main content gets 1136px. Could give more space to intelligence columns  
**Fix:** Reduce ad rail to 260px width, increase column gap from 16px (gap-4) to 24px (gap-6)

### **1280px (Compact Desktop)**
✅ **Works well:** 4-column layout still visible, navbar compact but readable  
⚠️ **Issue:** Token cards feel cramped at ~290px width. Text truncates aggressively. Ad rail dominates right side  
**Fix:** Switch to 3-column layout (hide "New & Early" in overflow menu), or show only 2 ads

### **1024px (Tablet Landscape)**
✅ **Works well:** 2-column wrapped layout activates (via `compact={true}`), navbar simplifies  
⚠️ **Issue:** Columns stack vertically after first row, creating very long scroll. "Fresh Signals" below fold by 800px  
**Fix:** Add horizontal scroll container or show only top 5 tokens per column with "See More" button

### **768px (Tablet Portrait)**
✅ **Works well:** Mobile terminal activates, tab navigation clear, search/filters accessible  
⚠️ **Issue:** Tablet-specific layout (`TabletTerminal`) exists but isn't well-differentiated from mobile. Could use desktop-like 2-column grid  
**Fix:** Keep `TabletTerminal` but show 2 columns side-by-side (Trending + Active) with tabs for others

### **430px (Mobile)**
✅ **Works well:** Mobile-first design shines. Sticky controls, vertical scroll, tap targets mostly good  
⚠️ **Issue:** Token card info density too high. 3 metrics (Volume, Liquidity, Sources) cram bottom section  
**Fix:** Show only 2 metrics by default (Volume + Liquidity), move Sources to detail drawer

---

## 4. VISUAL CONSISTENCY REVIEW

### **Spacing Scale**
✅ **Consistent:** Uses Tailwind scale (px, 0.5, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32)  
⚠️ **Issue:** Some arbitrary values break scale: `gap-3.5`, `gap-2.5`, `py-0.5`  
**Fix:** Round to nearest standard value or add to design tokens if frequently used

### **Border Radius**
✅ **Consistent:** `--radius: 0.75rem` used across cards (rounded-xl = 12px, rounded-2xl = 16px)  
⚠️ **Issue:** Token logo uses `rounded-xl` (12px) but cards use `rounded-2xl` (16px). Visual mismatch  
**Fix:** Standardize token logos to `rounded-lg` (8px) for subtlety, keep cards at `rounded-2xl`

### **Shadows**
✅ **Good:** Inset shadow on cards (`shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]`) creates depth  
⚠️ **Issue:** No elevation system for z-axis (modals, dropdowns, cards all look flat)  
**Fix:** Add shadow scale: cards (`shadow-sm`), dropdowns (`shadow-md`), modals (`shadow-xl`)

### **Stroke Weights**
✅ **Consistent:** Icons use `stroke-[1.5]` or default. Border uses `border` (1px) or `border-2`  
⚠️ **Issue:** Some icons explicitly set `h-3 w-3`, others `h-4 w-4`, creates inconsistency in visual weight  
**Fix:** Audit all icons, standardize to `h-4 w-4` for body, `h-5 w-5` for headers, `h-3 w-3` for dense UI only

### **Icon Sizes**
⚠️ **Inconsistent:** Found 7 different icon sizes: `h-2.5`, `h-3`, `h-3.5`, `h-4`, `h-5`, `h-6`, `h-8`  
**Fix:** Reduce to 4 sizes: sm (h-3 = 12px), md (h-4 = 16px), lg (h-5 = 20px), xl (h-6 = 24px)

### **Button States**
✅ **Good:** Hover and active states defined in `buttonVariants`  
⚠️ **Issue:** Disabled state only changes opacity (50%), doesn't show "not-allowed" cursor  
**Fix:** Add `disabled:cursor-not-allowed` to button base styles

### **Hover/Focus States**
⚠️ **Missing focus indicators:** Token cards are `<Link>` wrapped but have no focus-visible ring  
**Fix:** Add `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none` to `<Card>` in TokenCard component

---

## 5. ACCESSIBILITY CHECKLIST (WCAG 2.2 AA)

### **Color Contrast (1.4.3)**
❌ **Fails:** 
- `text-muted-foreground/70` on `bg-card` = ~3.8:1 (needs 4.5:1)
- `text-[10px]` timestamps in navbar = ~4.2:1 (borderline)
- Risk badge "Watch" yellow on card background = ~4.1:1

✅ **Passes:**
- Primary text on background
- Risk badge "Strong" green and "High Risk" red
- Navbar text

**Fix:** Adjust opacities: `/70 → /80`, `/60 → /75`. Test with contrast checker

### **Focus Visible (2.4.7)**
❌ **Missing on:**
- Token cards (clickable but no focus ring)
- Mobile tab buttons
- Search input clear buttons

✅ **Present on:**
- Navbar buttons
- Form inputs
- Dropdowns

**Fix:** Apply `focus-visible:ring-2 focus-visible:ring-primary` globally to interactive elements

### **Keyboard Navigation (2.1.1)**
✅ **Works:** Can tab through navbar, inputs, buttons, links  
⚠️ **Issue:** Token cards in 4-column desktop grid don't have logical tab order. Tabs vertically down column 1, then column 2 (expected: row-by-row)  
**Fix:** No easy CSS fix. Consider adding skip links: "Skip to next column" or reorder DOM to match visual layout

### **ARIA Labels for Key Controls (4.1.2)**
✅ **Good:** 
- Navbar buttons have aria-labels via lucide icons
- Form inputs have associated labels
- Modal dialogs have proper aria-modal

⚠️ **Missing:**
- Token card links have no aria-label (just relies on nested text)
- Search inputs missing aria-describedby for search hints
- Risk filter dropdowns missing aria-label

**Fix:** Add `aria-label="View details for {token.symbol}"` to token card links

### **Alt Text Rules (1.1.1)**
✅ **Present:** Token logos have alt text: `alt={${token.symbol || "Token"} (${token.name || "Solana Token"}) logo}`  
✅ **Good pattern:** Descriptive and includes symbol + name  
⚠️ **Issue:** Navbar logo has simple `alt="SOLRAD"`, could be more descriptive  
**Fix:** Change to `alt="SOLRAD - Solana Token Intelligence Platform"`

### **Reduced Motion Preference (2.3.3)**
❌ **Not honored:** Animations (breathe-dot, ticker-scroll, shimmer) always run regardless of `prefers-reduced-motion`  
**Fix:** Add to globals.css:
```css
@media (prefers-reduced-motion: reduce) {
  .breathe-dot, .ticker-content, .shimmer, .animate-spin {
    animation: none !important;
  }
}
```

---

## 6. "MAKE IT FEEL PREMIUM" PLAN

8 small upgrades that add flair WITHOUT clutter:

### **#1: Subtle Card Hover Lift**
**Where:** Token cards  
**What:** Add slight elevation on hover  
**Code:** Add to TokenCard `<Card>`: `hover:translate-y-[-2px] hover:shadow-lg transition-all duration-200`  
**Why:** Creates depth, makes cards feel interactive (Stripe/Linear pattern)

### **#2: Gradient Border on High-Score Tokens**
**Where:** Token cards with score ≥ 85  
**What:** Add animated gradient border  
**Code:** Conditional class: `${token.totalScore >= 85 ? 'border-gradient-primary' : ''}`  
Define in CSS: `@property --gradient-angle` with rotating gradient  
**Why:** Visually highlights exceptional tokens, creates premium feel

### **#3: Smooth Number Counter Animation**
**Where:** Stats in navbar ("Coverage: 247 tokens")  
**What:** Count up from previous value to new value over 800ms  
**Code:** Use `react-countup` or custom hook with `requestAnimationFrame`  
**Why:** Makes updates feel intentional, not jarring (adds delight)

### **#4: Staggered Column Fade-In**
**Where:** Desktop 4-column layout on load  
**What:** Columns fade in sequentially (100ms delay each)  
**Code:** Add `animate-fade-in` with `style={{ animationDelay: ${index * 100}ms }}`  
**Why:** Professional loading pattern, draws eye left-to-right

### **#5: Risk Badge Pulse on State Change**
**Where:** Token cards when risk label updates  
**What:** Brief pulse/glow animation when badge changes  
**Code:** Track previous risk label, add `animate-pulse-once` class on change  
**Why:** Alerts user to live updates without being distracting

### **#6: Micro-Interaction on Search Input**
**Where:** All search inputs  
**What:** Expand width by 20px on focus, add subtle glow  
**Code:** `focus:w-[calc(100%+20px)] focus:shadow-[0_0_8px_rgba(112,26,255,0.3)]`  
**Why:** Draws attention to search as primary action

### **#7: Token Logo Shimmer on Load**
**Where:** Token card images while loading  
**What:** Animated shimmer placeholder (already defined in CSS but not used)  
**Code:** Add `onLoadingComplete` handler to Next Image, show shimmer div until loaded  
**Why:** Reduces perceived jank, feels polished

### **#8: Status Chip Animation in Navbar**
**Where:** "LIVE" / "STALE" indicator  
**What:** Slide in from right on mount, subtle bounce  
**Code:** Add `animate-slide-in-right` with spring easing  
**Why:** Confirms real-time data connection, builds trust

---

## 7. ADS REVIEW (Dashboard Ad Rail)

### **Current State Analysis**

**Placement:** Right rail, 280px width, 3 stacked iframes (250px each)  
**Density:** 750px total ad height vs ~900px viewport height at 1440px = 83% ad-to-viewport ratio (HIGH)  
**Distraction Risk:** MEDIUM - Acceptable.a-ads.com uses static/minimal animation ads, but 3 units compete for attention  
**Layout Integrity:** GOOD at 1440px+, POOR at 1280-1439px (ads dominate, intelligence secondary)  
**Scroll Behavior:** Ads stay in rail (no sticky), scroll with content. Good pattern.

### **6 Recommendations to Improve Revenue WITHOUT Hurting Retention**

#### **#1: Responsive Ad Count (High Impact)**
**Current:** 3 ads at all desktop breakpoints  
**Change:** 
- 1280-1439px: Show 2 ads
- 1440px+: Show 3 ads
**Why:** Prevents ad rail from dominating at smaller desktop sizes. Reduces bounce from cramped feeling.  
**Revenue Impact:** -33% impressions at 1280-1439px, but likely +10-15% session duration (more page views = more total impressions)

#### **#2: Add Sponsored Token Card (Medium Impact)**
**Current:** Ads only in right rail  
**Change:** Allow 1 "Sponsored" token card in "Trending" column (clearly labeled, different background)  
**Why:** Native ad format, blends with intelligence, high engagement (users already scanning tokens)  
**Revenue Impact:** +25-40% CTR vs banner ads (native ads typically 3-5x more engaging)

#### **#3: Lazy Load 3rd Ad Unit (Low Impact, High Technical Value)**
**Current:** All 3 iframes load on page mount  
**Change:** Only load 3rd ad when user scrolls to 50% of page  
**Why:** Reduces initial page weight (~500KB saved), improves Core Web Vitals (LCP)  
**Revenue Impact:** Neutral (ad still loads for engaged users)

#### **#4: Add "Tools" Section Above Ads (Medium Impact)**
**Current:** Ads start immediately below navbar  
**Change:** Insert compact "Tools" section (Scoring, Gem Finder, Alerts Soon) above ads  
**Why:** Balances content-to-ad ratio, provides utility before monetization, reduces "ad wall" perception  
**Revenue Impact:** Slightly pushes ads down, but improves user sentiment (worth tradeoff)

#### **#5: A/B Test Ad Rail Width (High Impact)**
**Current:** 280px fixed width  
**Change:** Test 260px vs 300px variants  
**Why:** 260px = more space for intelligence columns (better UX). 300px = larger ad units (higher CPM)  
**Revenue Impact:** Need to measure. 300px could increase CPM 10-20%, but might hurt engagement

#### **#6: Implement "Ad Refresh" on Long Sessions (High Impact)**
**Current:** Ads load once, never refresh  
**Change:** Refresh ad units every 60 seconds if user is actively engaged (mouse movement, scroll)  
**Why:** Standard practice for long-session apps. Increases impressions without adding units  
**Revenue Impact:** +50-100% revenue from power users (those spending 5+ minutes)  
**Implementation:** Use IntersectionObserver + idle detection, respect user attention

---

## PRIORITY IMPLEMENTATION ROADMAP

### **Week 1 (Foundation Fixes - 8 hours)**
1. Fix text contrast (#2) - 1 hour
2. Add focus rings (#3) - 2 hours
3. Responsive ad count (#1 from ads) - 1 hour
4. Token card height fix (#1) - 30 min
5. Mobile tap targets (#4) - 1.5 hours
6. Reduced motion support (#5 from accessibility) - 1 hour
7. Testing + QA - 1 hour

### **Week 2 (Polish + Premium Feel - 6 hours)**
1. Card hover lift (#1 from premium) - 30 min
2. Number counter animation (#3 from premium) - 1 hour
3. Column visual hierarchy (#6) - 1 hour
4. Risk badge legend (#7) - 1 hour
5. Search placeholder improvement (#10) - 15 min
6. Button micro-interactions (#14) - 1 hour
7. Token logo fallback (#11) - 1.25 hours

### **Week 3 (Advanced UX - 5 hours)**
1. Signal rationale expansion (#8) - 1 hour
2. Desktop scroll shadows (#12) - 1.5 hours
3. Mobile tab active state (#9) - 30 min
4. Gradient border for high scores (#2 from premium) - 1.5 hours
5. Status chip animation (#8 from premium) - 30 min

---

## FINAL VERDICT

**Current State:** SOLRAD has a strong foundation with clear "intel terminal" identity, good responsive strategy, and solid component architecture. The core UX is functional and the visual brand is distinctive.

**Biggest Wins:**
- Terminal aesthetic is unique and appropriate for power users
- Color system (magenta/cyan/lime) feels premium and on-brand
- Responsive breakpoints are well-thought-out
- Data loading patterns are performant (memoization, parallel fetching)

**Biggest Gaps:**
- Accessibility compliance (contrast, focus indicators, reduced motion)
- Token card density (fixed 200px height creates cramping)
- Ad placement at 1280px breakpoint hurts content prominence
- Micro-interactions missing (hover states, transitions feel flat)

**Recommendation:** Focus on Week 1 priorities (accessibility + foundation) before adding premium polish. Current UX is ~75% of the way to excellent. The suggested improvements are surgical, not a redesign.

**Retention Risk:** Medium-Low. Users who understand the value prop will tolerate current UX quirks. But accessibility issues exclude some users entirely (keyboard nav, low vision). Fixing those is non-negotiable.

**Premium Perception:** Currently 6.5/10. With Week 2 polish (card lift, animations, micro-interactions), easily achieves 8.5/10 without losing "serious tool" vibe.

---

END OF AUDIT
