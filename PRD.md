# Product Requirements Document: Proofly (v1.0)

**Status:** Draft | **Author:** Senior Product Manager | **Date:** March 29, 2026

---

## 1. Executive Summary
**Proofly** is a productivity platform designed to solve the "trust gap" for early-career developers. While GitHub shows *that* you coded, it doesn’t explain *what* you learned or the context of your work. Proofly bridges this by merging manual daily reflections with GitHub-verified activity to create a "Proof of Work" profile and automated CVs.

### Problem Statement
Junior developers and students struggle to prove their consistency and growth. Standard CVs are static and often unverified, while GitHub contribution graphs lack context. There is no central "source of truth" that combines coding activity with the narrative of daily progress.

### The Solution
A web app that incentivizes daily "Proof of Work." Users log their daily progress (manual) which is then cross-referenced with GitHub API data (verified). This data feeds into a dynamic streak system and an automated CV builder.

---

## 2. Goals & Success Metrics
* **Primary Goal:** Establish a daily habit of logging work and committing code.
* **Secondary Goal:** Reduce the time it takes to create a technical CV from hours to minutes.

| Metric | Target |
| :--- | :--- |
| **7-Day Retention** | 40% (Users returning to log daily) |
| **Verification Rate** | 60% of logs linked to at least one GitHub commit |
| **Activation** | User completes onboarding and logs their first "Verified" day |
| **Viral Coefficient** | Public profile shares per active user |

---

## 3. Target Audience
1.  **Students:** Building their first portfolio.
2.  **Junior Developers:** Looking for their first or second role.
3.  **Interns:** Documenting their learning path for conversion to full-time.

---

## 4. Feature Breakdown

### 4.1 Hybrid Proof System (Core)
* **Manual Logs:** A simple text entry (markdown supported) where users describe what they built/learned today.
* **GitHub Sync:** A background check against the GitHub API. If a commit or PR exists for that user on that date, the log is marked as **"Verified."**
* **The Trust Badge:** Logs without GitHub activity are "Unverified" (good for soft skills/learning), while logs with GitHub activity get a "Verified" badge.

### 4.2 Streak Logic
* **Standard Streak:** Increments every day a user submits a manual log.
* **Verified Streak (The "Gold" Streak):** Increments only when a manual log is paired with a GitHub event.
* **Grace Period:** Users get 1 "Freeze" per month to maintain their streak.

### 4.3 CV & Portfolio Generator
* **Automated CV:** Converts the last 30/60/90 days of logs into a professional PDF. Verified logs are highlighted to recruiters as "Proven Activity."
* **Public Proof Page:** A `proofly.io/username` page showing a heat map, recent verified logs, and top languages used.

---

## 5. MVP vs. Future Features

| Feature | MVP (Release 1.0) | Future (v2.0+) |
| :--- | :--- | :--- |
| **Auth** | GitHub OAuth only | Email/Google + GitHub Linking |
| **Logs** | Text + 1 Image upload | Video snippets + Code snippets |
| **GitHub** | Commit count + Repo name | PR reviews + Lines of code changed |
| **Rewards** | Unlock CV PDF at 7-day streak | Custom themes, Job board access |
| **Social** | Public profile link | Follow users, "Clap" for logs |

---

## 6. Technical Specifications

### Data Model (Supabase)
```sql
-- Profiles table
create table profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  full_name text,
  avatar_url text,
  github_access_token text,
  current_streak int default 0,
  best_streak int default 0
);

-- Logs table
create table logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  content text,
  is_verified boolean default false,
  github_data jsonb, -- Stores commit messages/repo names
  created_at timestamp with time zone default now()
);
```

### User Flows
1.  **Onboarding:** GitHub Auth $\rightarrow$ Permissions check $\rightarrow$ Set daily reminder time $\rightarrow$ Redirect to Dashboard.
2.  **Daily Loop:** User receives notification $\rightarrow$ Enters "What did you do today?" $\rightarrow$ System fetches GitHub activity $\rightarrow$ Success modal shows updated streak $\rightarrow$ "Share to X/LinkedIn" prompt.
3.  **Reward Loop:** Reach 7-day streak $\rightarrow$ "CV Generator Unlocked" $\rightarrow$ User selects "Download CV" $\rightarrow$ PDF generated using daily logs as bullet points.

---

## 7. Retention Strategy
* **The Streak Incentive:** Visual "fire" icons and tiered badges (Bronze, Silver, Gold).
* **Progress Visualization:** A "Proof Map" (similar to GitHub's green squares but for verified logs).
* **External Pressure:** Public profiles allow users to put their `proofly.io` link in their Twitter/LinkedIn bio, creating social accountability.

---

## 8. 10-Day MVP Build Plan (Solo Dev)

| Day | Focus | Task |
| :--- | :--- | :--- |
| **1-2** | **Foundations** | Next.js setup, Supabase Auth (GitHub), Tailwind UI Layout. |
| **3-4** | **Logging Engine** | Create/Edit/Delete logs. Integrate GitHub API to check daily events. |
| **5** | **Logic Layer** | Streak calculation (Standard vs. Verified) and Cron jobs for resets. |
| **6-7** | **Public Profile** | Build the `/username` page with a clean, read-only view of logs. |
| **8-9** | **CV Export** | Simple PDF generation (React-PDF) using log data as content. |
| **10** | **Polish & Launch** | SEO tags, OpenGraph images, and deployment on Vercel. |

---

## 9. UI/UX Considerations
* **Minimalism:** The dashboard should look like a "Daily Standup." One big input box. No distractions.
* **Mobile-First:** Most users will check their streak on their phones.
* **Dark Mode by Default:** Targeted at developers.

---

**Next Step:** Would you like me to generate the **System Architecture diagram** or the **Tailwind CSS code** for the main Dashboard UI?