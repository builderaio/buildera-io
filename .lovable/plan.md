

## Bug Analysis: LinkedIn Button in Wizard Redirects to `?view=negocio`

### Root Cause

The `SocialConnectionManager` embedded in the wizard's Step 1 has two redirect problems:

1. **Popup blocked fallback** (line 308 of `SocialConnectionManager.tsx`): When the browser blocks the popup, the code does `window.location.href = data.access_url` — navigating the **main page** away from the wizard entirely.

2. **Callback redirect** (line 92 of `LinkedInCallback.tsx` and line 978 of `SocialConnectionManager.tsx`): After completing the OAuth flow, the callback pages hard-navigate to `/company-dashboard?view=marketing-hub`, which takes the user out of the wizard instead of returning them to it.

### Solution

Three targeted changes, all scoped to the wizard's LinkedIn/social connection flow:

**1. Fix popup-blocked fallback in `SocialConnectionManager.tsx` (line ~304-309)**

Instead of navigating away with `window.location.href`, show a toast error telling the user to allow popups and try again. Never navigate the main window away.

```
Current:  window.location.href = data.access_url;
Fixed:    toast({ title: "Popup bloqueado", description: "Permite ventanas emergentes e intenta de nuevo", variant: "destructive" });
```

**2. Make the callback redirect respect the wizard context**

Update `SocialConnectionManager` to pass the current route as `redirectUrl` when generating the JWT (line 270), so the callback returns to the wizard rather than to marketing-hub.

Change the `redirectUrl` from:
```
`${window.location.origin}/marketing-hub/connections/callback`
```
to include an `origin` parameter:
```
`${window.location.origin}/marketing-hub/connections/callback?origin=activation-wizard`
```

**3. Update `SocialConnectionCallback.tsx` to respect `origin` param**

In `returnToMarketingHub()`, check for the `origin` query parameter. If `origin=activation-wizard`, navigate to `/company-dashboard?view=activation-wizard` instead of `?view=marketing-hub`.

### Technical Details

| File | Change | Lines |
|------|--------|-------|
| `SocialConnectionManager.tsx` | Replace `window.location.href` fallback with toast error + `setConnecting(false)` | ~304-309 |
| `SocialConnectionManager.tsx` | Add `origin` context to `redirectUrl` when used inside the wizard (accept optional prop `returnPath`) | ~270 |
| `SocialConnectionCallback.tsx` | Read `origin` from URL search params; if `activation-wizard`, redirect to `?view=activation-wizard` | ~136-141 |

### What is NOT touched
- URL saving logic
- Card styles or visual presentation
- Other button handlers
- The `?view=negocio` redirect from `ResponsiveLayout` (that mapping is correct for other contexts)

### Popup timeout handling
The existing `connectionWindow.closed` polling interval (lines 112-124) already handles the success case when the popup closes. Adding a 10-second timeout fallback: if `connectionWindow` is still open after 10s without closing, show a reminder toast. This keeps the user informed without disrupting the flow.

