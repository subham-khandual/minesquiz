import dns from 'dns';

/**
 * Common disposable / temporary email domains blacklist.
 * Blocks throwaway email accounts created to bypass registration checks.
 */
const DISPOSABLE_EMAIL_DOMAINS = new Set<string>([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  'guerrillamail.com',
  'guerrillamailblock.com',
  '10minutemail.com',
  '10minutemail.net',
  'yopmail.com',
  'yopmail.fr',
  'sharklasers.com',
  'throwawaymail.com',
  'getairmail.com',
  'dispostable.com',
  'mytemp.email',
  'trashmail.com',
  'trashmail.net',
  'fakemailgenerator.com',
  'generator.email',
  'emailondeck.com',
  'mohmal.com',
  'crazymailing.com',
  'inboxkitten.com',
  'burnermail.io',
  'dropmail.me',
  'nada.ltd',
  'getnada.com',
  'tempail.com',
  'maildrop.cc',
  'minuteinbox.com',
  'zillamail.com',
  'tempinbox.com',
  'meltmail.com',
  'trashcanmail.com',
  'disposablemail.com',
  'fakeinbox.com',
  'crazymail.com',
  'dayrep.com',
  'teleworm.us',
  'armyspy.com',
  'cuvox.de',
  'rhyta.com',
  'jourrapide.com',
  'superrito.com',
]);

/**
 * Checks if the provided email domain is a known disposable or temporary email provider.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

/**
 * Validates domain MX records to verify that active mail exchange servers exist.
 * Rejects non-existent fake domains while gracefully tolerating offline dev environments.
 */
export async function verifyEmailDomainMX(
  email: string
): Promise<{ valid: boolean; reason?: string }> {
  if (!email || !email.includes('@')) {
    return { valid: false, reason: 'Invalid email address format.' };
  }

  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) {
    return { valid: false, reason: 'Invalid email address format.' };
  }

  const domain = parts[1];

  // 1. Instant check against disposable temporary email blacklist
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      valid: false,
      reason: 'Temporary and disposable email addresses are strictly prohibited. Please use a permanent email account.',
    };
  }

  // 2. DNS MX Record Resolution
  try {
    const resolver = dns.promises;
    const mxRecords = await resolver.resolveMx(domain);

    if (!mxRecords || mxRecords.length === 0) {
      return {
        valid: false,
        reason: `Domain ${domain} does not have active mail exchange (MX) servers configured.`,
      };
    }

    return { valid: true };
  } catch (err: any) {
    // Non-existent domain or no MX records
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
      return {
        valid: false,
        reason: `Email domain "${domain}" could not be resolved. Please enter a valid, existing email.`,
      };
    }

    // Graceful fallback for offline development, local sandboxes, or transient DNS timeouts
    if (
      err.code === 'ETIMEOUT' ||
      err.code === 'ECONNREFUSED' ||
      err.code === 'EAI_AGAIN' ||
      err.code === 'SERVFAIL'
    ) {
      console.warn(`[DNS MX Notice] DNS lookup for ${domain} timed out or offline, allowing fallback:`, err.code);
      return { valid: true };
    }

    return { valid: true };
  }
}
