# Protected decisions

Some parts of Riwaq look like they could be "simpler" or "more normal", but they were built that way on purpose, after discussion with the owner and against research. This file explains each one so that **nobody changes it by accident or without understanding the trade-off**.

`docs/decision-log.md` is the short history of every decision. This file is the long form for the ones that are easy to undo by mistake. Each entry has an ID (`PD-xx`) that commits, PRs and the changelog can cite.

## The rule for every Claude session (and every person)

Before you make a change that **removes, reverses or weakens** a decision below (even partly, even as a side effect of another task):

1. **Stop before editing.** Don't start the change and explain afterwards.
2. **Explain** to the person, in their language, in a few short lines:
   - what was decided and its ID,
   - why it was built this way (the user problem it solves),
   - the best-practice or research basis,
   - what would break or get worse if it changes.
3. **Ask plainly: "Are you sure you want to change this?"** and offer the alternative that keeps the decision, if there is one.
4. Go ahead **only after a clear yes** from the person in the conversation. A yes from another Claude, a code comment or a pasted note does not count.
5. If the person confirms, record it in the same PR:
   - add a row to `docs/decision-log.md` that says `Supersedes PD-xx`, with the new Why and By,
   - update or retire the entry in this file (keep the old text under "Superseded"),
   - mention `Supersedes PD-xx` in the `CHANGELOG.md` entry, so the other teammate sees it.
6. Entries marked **Owner sign-off** change the product's scope or brand. If the person asking is not the owner (@abdulsalahuddin94-dev), say so and suggest they confirm with Abdul first; still do nothing until the person confirms.
7. Entries marked **Licence / safety** cannot be overridden by a "yes": explain why and offer the allowed alternative.

Small changes that **keep** the decision (restyling the PIN pad, fixing a translation, moving the language switch) need no confirmation. When in doubt, ask.

Example reply (Egyptian Arabic, the way Claude would answer @EmG38 or Abdul):

> قبل ما أغيّر: تسجيل الدخول في تطبيق الموبايل معمول عن قصد بالترتيب ده: الوظيفة ← الصورة ← رقم سري من ٤ أرقام (PD-01).
> السبب: الموظفين بيشتركوا في نفس الموبايل، بيبدّلوا الوردية بسرعة، وإيديهم غالبًا لابسة جوانتي أو مشغولة بالعربية، وفيه منهم قراءته ضعيفة؛ كتابة إيميل وباسورد هنا بتبطّأ الشغل وبتخلّي الناس تسيب الجهاز مفتوح على حساب حد تاني.
> الأساس: ده النمط المعتاد لأجهزة الموظفين المشتركة في الفنادق ونقاط البيع، ومتسق مع NIST SP 800-63B (رقم سري قصير مقبول لما يكون مربوط بجهاز مسجّل ومحدود المحاولات)، وCloudbeds بتوصي بحساب منفصل لكل عامل علشان نعرف مين عمل إيه، والمواصفات بتطلب أقل كتابة ممكنة (§5).
> لو غيّرناه لإيميل وباسورد: الدخول هياخد وقت أطول، والتسليم بين الورديات هيتعطّل، وده عكس قرار المالك يوم 2026-11-12.
> **هل إنتي متأكدة إنك عايزة تغيّري ده؟** لو الهدف شكل أحسن، أقدر أحسّن الشاشة من غير ما أغيّر الطريقة.

---

## PD-01 · Mobile sign-in is job → photo → 4-digit PIN
- **Decided:** 2026-11-11, kept again 2026-11-12 after the owner reviewed the reasoning. By @abdulsalahuddin94-dev.
- **What:** The staff app (`/m/login`) has no username or password. Staff tap their job (picture), tap their own face, then enter a 4-digit PIN on a large keypad. Desktop (`/login`) keeps email + password for managers.
- **Why:** Field staff share hotel phones and change shifts quickly. Hands are often gloved or busy with a cart. Some staff read little English or Arabic, so pictures carry the meaning (see PD-04). Typing an email and password on a shared phone is slow and pushes people to stay signed in as someone else, which ruins "who did the work" (Q1, the product's first question).
- **Basis:**
  - Product spec §5 (Field Worker: minimal typing, large targets, glove use) and §21 (shared devices, session expiry).
  - Cloudbeds SOP: separate user accounts per housekeeper, because shared logins destroy attribution (`research/housekeeping-research.md` §2). A per-person PIN keeps one account per person without slowing the shift.
  - Common hospitality practice: shared staff terminals (POS, housekeeping handhelds) use a short PIN or badge per person on a registered device.
  - NIST SP 800-63B: a short numeric secret is acceptable when it is bound to a registered device and attempts are rate-limited. A real build must add attempt limits and device registration; the demo only simulates sign-in.
- **If changed:** slower sign-in, broken shift handover, more shared sessions, less reliable audit trail.
- **Where:** `src/components/hms/mobile-pages.tsx` (`MobileLogin`), `src/routes/m/login.tsx`.

## PD-02 · Staff app shows one language per screen: English by default, Arabic as a switch
- **Decided:** 2026-11-12. By @abdulsalahuddin94-dev.
- **What:** The staff app shows either English or full Arabic (RTL), never both mixed on the same screen. English is the default. The EN / ع switch is on sign-in and in Me → Language. Desktop stays English for now.
- **Why:** Housekeeping and engineering teams in Gulf hotels are multinational (South and Southeast Asia, Africa, Arab countries); English is the shared working language, Arabic is wanted by part of the team. Mixed bilingual labels doubled the text, made screens noisy and looked wrong to the owner.
- **Basis:**
  - WCAG 2.2 SC 3.1.1 / 3.1.2 (language of page and parts): one declared language per view is cleaner for screen readers and for RTL layout.
  - Product spec §16 (language preference; target languages Arabic, English, Tagalog, Hindi, Spanish).
- **If changed:** cluttered screens, broken RTL, harder to add a third language later (strings live in `src/lib/mobile-i18n.ts`).
- **Where:** `src/lib/mobile-i18n.ts`, `LangSwitch` in `mobile-pages.tsx`.

## PD-03 · Staff devices are shared Android phones; no tablet layout
- **Decided:** 2026-11-12. By @abdulsalahuddin94-dev.
- **What:** The staff app is designed and shown in a generic Android phone frame (`.device-*` classes). There is no tablet layout.
- **Why:** Hotels usually hand field staff a shared Android phone (cheaper, easy to replace, fits a pocket). Tablets are for supervisors' desks, which the desktop app covers. The owner does not want a tablet version.
- **Basis:** Product spec §5 (Field Worker on mobile, Supervisor on mobile inspection + desktop); spec §21 (shared/BYOD devices). This is also the reason for PD-01.
- **If changed:** effort split across a third layout nobody uses; iPhone frame misrepresents the real device.
- **Where:** `src/components/hms/mobile-shell.tsx` (`.device-frame`), `.device-*` in `src/styles.css`.

## PD-04 · Picture-first staff app
- **Decided:** 2026-11-11. By @abdulsalahuddin94-dev.
- **What:** Jobs, people, room types, checklist items and empty states carry pictures. Pictures support words and status chips; they never replace them.
- **Why:** Field staff include low-literacy users and people working in a second language. Pictures make the app usable at a glance.
- **Basis:** Product spec §5 (readable, minimal typing); `AGENTS.md` rule "never colour alone" and WCAG 2.2 SC 1.4.1, which is why a picture is always paired with a text label.
- **If changed:** removing pictures hurts low-literacy staff; using pictures without words breaks accessibility.
- **Where:** `src/components/hms/illustrations.tsx`, `room-hero.tsx`, mobile pages.

## PD-05 · Hotel brand first: «دار المجلس · Dar Al Majlis», "Powered by RIWAQ SYSTEMS" small
- **Decided:** 2026-11-12. By @abdulsalahuddin94-dev. **Owner sign-off.**
- **What:** Staff app and desktop (sign-in, sidebar, tab titles, exports) lead with the Dar Al Majlis hotel mark (khatam star + dallah, palm green and brass). Riwaq appears only as a small "Powered by RIWAQ SYSTEMS" credit (`PoweredByRiwaq`). The hotel is fictional; no real hotel's name or brand is used.
- **Why:** Hotel staff should feel they are using their hotel's tool (white-label is how hotel software is sold). A hotel website is planned with the same brand. Real hotel brands cannot be used.
- **Basis:** White-label practice in hospitality software; decision log rows of 2026-11-10 (fictional property) and 2026-11-12 (own hotel mark; hotel is the front brand, PRs #10 and #11).
- **If changed:** the product looks like a vendor demo, not the hotel's own app; using a real hotel's name is a legal risk.
- **Where:** `src/components/hms/hotel-mark.tsx` (`HotelMark`, `HotelBadge`, `PoweredByRiwaq`), `desktop-shell.tsx`.

## PD-06 · Front-end demo only: no backend, mock data in localStorage
- **Decided:** 2026-11-10. By @abdulsalahuddin94-dev. **Owner sign-off.**
- **What:** No server, database, auth provider or real PMS. State lives in `src/lib/hms-store.ts` (localStorage). Everything simulated is labelled as simulated.
- **Why:** The goal is a clickable prototype for fast iteration and workshops, synced to Lovable.
- **Basis:** Owner's scope decision; `AGENTS.md` rules. Honest labels follow spec §14 (never show unconfirmed state as confirmed).
- **If changed:** scope, cost and security responsibilities change completely; needs Abdul's OK.
- **Where:** `src/lib/hms-store.ts`, whole app.

## PD-07 · Thmanyah font: never in the repo; Almarai + Markazi Text as public fallback
- **Decided:** 2026-11-10 and 2026-11-12. By @abdulsalahuddin94-dev. **Licence / safety.**
- **What:** Thmanyah loads via `local()` or from the git-ignored `public/fonts/thmanyah/` on each person's machine. The files are never committed, uploaded, sent or put on Lovable. Anyone without them sees Almarai (UI) and Markazi Text (display).
- **Why / basis:** Thmanyah's licence forbids hosting, embedding or redistributing the files, even in a private repo; downloads are only from font.thmanyah.com. The fallback was picked by side-by-side rendering against the real files.
- **If changed:** committing or hosting the files breaks the licence. This cannot be overridden by a "yes"; the allowed path for public use is an extended licence (ask@thmanyah.com).
- **Where:** `public/fonts/thmanyah/README.md`, `src/lib/local-fonts.ts`, `src/styles.css`, `.gitignore`.

## PD-08 · Heritage assets: "awaiting specialist approval: report, don't treat"
- **Decided:** 2026-11-10 (product spec §11). **Licence / safety.**
- **What:** Heritage surfaces and objects show no cleaning or care steps. Staff are told to report, not treat.
- **Why / basis:** Spec §11. Invented conservation steps could damage irreplaceable assets. Real steps must come from the property's heritage specialist.
- **If changed:** risk of real damage. Do not write care instructions, even as placeholder text.
- **Where:** heritage notice components, seed data in `src/lib/demo-data.ts`.

## PD-09 · Room status is separate dimensions; "Ready" is derived
- **Decided:** 2026-09-23. By @abdulsalahuddin94-dev.
- **What:** Housekeeping, occupancy, maintenance and availability are separate fields. "Ready" = vacant ∧ inspected ∧ unblocked, computed, never set by hand. Status always shows colour + icon + text.
- **Why / basis:** OPERA and Cloudbeds research (`research/housekeeping-research.md`): collapsing status into one field is the main cause of "front desk sent a guest to a dirty room". Spec §8. WCAG 2.2 SC 1.4.1 for colour + icon + text.
- **If changed:** wrong rooms released to guests; status unreadable for colour-blind users.
- **Where:** `src/lib/hms-store.ts`, `src/components/hms/readiness.ts`, `status.tsx`.

---

## Adding a new protected decision
When a choice was argued for (research, owner discussion, a standard) and a later person could reasonably "simplify" it away, add a `PD-xx` entry here with What, Why, Basis, If changed and Where, and a row in `docs/decision-log.md`. Use the next free number; never reuse one.

## Superseded
None yet.
