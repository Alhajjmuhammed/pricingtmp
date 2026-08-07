/**
 * Small retry helper for the post-registration provisioning calls
 * (Wellonge ID login/profile/org, wellongepay subscription, Client
 * Management, destination systems). These are network calls to other
 * live services -- a transient blip shouldn't mean a customer silently
 * never gets provisioned somewhere after they've already paid.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { attempts = 3, delayMs = 800 }: { attempts?: number; delayMs?: number } = {}
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt))
      }
    }
  }
  throw lastError
}
