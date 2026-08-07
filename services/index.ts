/**
 * Central Services Export
 */

// Core API
export * from './core/api';

// Wellonge ID Service
export * from './wellongeid/wellongeIdService';

// Wellongepay Service
export * from './wellongepay/wellongepayService';

// Onboarding Service
export * from './onboarding/onboardingApi';

// registerPersonalAccount / createPersonalProfile / createPersonalPreferences /
// createOrganization exist in both wellongeIdService (raw backend calls) and
// onboardingApi (wraps those same calls, normalizing the response shape --
// flat `.data.id`, `.error` instead of `.errors`). The two `export *` above
// left this ambiguous -- TypeScript silently drops both from the barrel's
// type surface, leaving the actual winner up to bundler tie-breaking.
// register/page.tsx's usage (`accountResponse.data.id`, `.error` fallback)
// matches onboardingApi's shape, so re-export those explicitly to make that
// the guaranteed, documented behavior instead of an implicit bundler order.
export {
  registerPersonalAccount,
  createPersonalProfile,
  createPersonalPreferences,
  createOrganization,
} from './onboarding/onboardingApi';
