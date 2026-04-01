

# Dashboard Loop Diagnosis for mdelatorrep@gmail.com

## User Data State (healthy, not the cause)
- `user_id`: `9146aff2-d0b3-4cc6-8878-02e9d08f634b`
- Onboarding: completed (step 5/5, journey completed)
- Profile: exists, `user_type = 'company'`, `full_name` set
- Company: exists with `journey_current_step = 5`

No redirect loop exists — the routing logic correctly lands on `mando-central`. The problem is a **performance death spiral** caused by massive query duplication on mount.

## Root Cause: ~60 parallel queries on every dashboard load

When the dashboard loads, `ResponsiveLayout` and `BusinessHealthDashboard` both independently call the same hooks:

```text
ResponsiveLayout                    BusinessHealthDashboard
├── useCompanyCredits ──────────┐   ├── useCompanyCredits ────────┐
│   └── check-subscription-status   │   └── check-subscription-status
│       (edge function call)        │       (DUPLICATE edge call)
├── useCompanyState ────────────┐   ├── useCompanyState ──────────┐
│   └── 14 parallel DB queries  │   │   └── 14 parallel DB queries
│       (SAME queries)          │   │       (DUPLICATE 14 queries)
├── usePlatformAgents           │   ├── usePlatformAgents (DUP)
├── useDepartmentUnlocking      │   ├── useDepartmentUnlocking (DUP)
├── useJourneyProgression       │   ├── useNextBestAction
│   └── checkAndAdvance         │   └── useBusinessHealth
│       6 queries (pointless    │       more queries...
│       at step 5)              │
└── checkOnboardingStatus       │
    2 queries                   │
```

**Evidence**: Edge function logs show `check-subscription-status` called 8+ times in 30 seconds after login. Auth logs show 10+ `/user` requests within seconds.

**Additional issue**: `useDashboardMetrics` (used by `Dashboard360`) has no metrics data for this user and no `calculate-dashboard-metrics` edge function deployed. If this component ever mounts, it would call a non-existent edge function, fail silently, and the metrics stay null — but the guard `calculating` prevents an actual infinite loop.

## Fix Plan (4 steps)

### Step 1: Skip journey checks when already at step 5
In `ResponsiveLayout.tsx`, the `useEffect` at line ~388 calls `checkAndAdvance()` on every mount, running 6 DB queries even though the user is at step 5. Add an early return.

```typescript
// In the useEffect that calls fetchAndAdvance:
const fetchAndAdvance = async () => {
  const { data } = await supabase
    .from('companies')
    .select('journey_current_step')
    .eq('id', companyId)
    .maybeSingle();
  
  const step = data?.journey_current_step || 1;
  setJourneyStep(step);
  
  // Only run checkAndAdvance if not yet completed
  if (step < 5) {
    await checkAndAdvance();
  }
};
```

Also add the same guard inside `useJourneyProgression.checkAndAdvance`:
```typescript
// Fetch current step first; skip if already at 5
const { data: company } = await supabase
  .from('companies')
  .select('journey_current_step')
  .eq('id', companyId)
  .single();
if (company?.journey_current_step >= 5) return;
```

### Step 2: Deduplicate hooks via CompanyContext
The `CompanyContext` already exists but `ResponsiveLayout` and `BusinessHealthDashboard` both independently call `useCompanyState`, `useCompanyCredits`, `usePlatformAgents`, and `useDepartmentUnlocking`. 

- Move `useCompanyCredits` and `useCompanyState` results into `CompanyContext` (or a new `DashboardDataContext`)
- Both `ResponsiveLayout` and `BusinessHealthDashboard` consume from context instead of calling hooks independently
- This eliminates ~30 duplicate queries per page load

### Step 3: Cache `check-subscription-status` results
In `useCompanyCredits.ts`, the edge function is called on every mount with no caching. Add a session-level cache:

```typescript
const CACHE_KEY = 'subscription-status-cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Check cache before calling edge function
const cached = sessionStorage.getItem(CACHE_KEY);
if (cached) {
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp < CACHE_TTL) {
    // Use cached data instead of calling edge function
    return data;
  }
}
```

### Step 4: Guard `useDashboardMetrics` auto-calculate
Add a `hasAttemptedCalculation` ref to prevent repeated attempts when the edge function doesn't exist:

```typescript
const hasAttemptedRef = useRef(false);

useEffect(() => {
  if (!loading && userId && !hasAttemptedRef.current && 
      (!metrics || isDataOld(metrics.last_calculated_at))) {
    hasAttemptedRef.current = true;
    calculateMetrics();
  }
}, [loading, userId, metrics]);
```

## Expected Impact

| Metric | Before | After |
|--------|--------|-------|
| DB queries on load | ~60 | ~20 |
| Edge function calls | 8+ | 1 (cached) |
| Journey check queries | 6 (pointless) | 0 |
| Duplicate hook instances | 4 hooks x2 | 0 |

