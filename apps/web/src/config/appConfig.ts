/**
 * MinesQuiz Global Application Configuration & Statutory Defaults
 * Conforms to DGMS examination guidelines and monorepo security protocol.
 */

export const APP_CONFIG = {
  appName: 'MinesQuiz',
  domain: 'https://minesquiz.com',
  regulatoryBase: 'Coal Mines Regulations 2017 (CMR 2017)',
  masterAdminEmails: [
    (process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAIL || 'subhamkhandual215@gmail.com').toLowerCase().trim(),
  ],

  /**
   * Checks whether the given email has developer/master inspection exemption.
   */
  isMasterEmail: (email?: string | null): boolean => {
    if (!email) return false;
    const normalized = email.toLowerCase().trim();
    return APP_CONFIG.masterAdminEmails.includes(normalized);
  },

  /**
   * Secure cookie string builder enforcing SameSite=Strict and conditional Secure flag.
   */
  buildCookieString: (key: string, value: string, maxAgeSeconds: number = 604800): string => {
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const secureFlag = isHttps ? '; Secure' : '';
    return `${key}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Strict${secureFlag}`;
  },

  /**
   * Secure cookie clearing helper removing cookies across paths and secure flags.
   */
  clearCookie: (key: string): void => {
    if (typeof document === 'undefined') return;
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const secureFlags = isHttps ? ['', '; Secure'] : [''];
    const paths = ['/', '/exam', '/candidate', ''];
    paths.forEach((p) => {
      secureFlags.forEach((sec) => {
        const pathAttr = p ? `; path=${p}` : '';
        document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0${pathAttr}; SameSite=Strict${sec}`;
        document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0${pathAttr}${sec}`;
      });
    });
  },
};
