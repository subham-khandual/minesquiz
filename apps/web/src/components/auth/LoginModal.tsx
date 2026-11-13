'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/useAuthStore';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../../lib/firebase';
import {
  validateLegalName,
  validatePasswordStrict,
  calculatePasswordStrength,
} from '@mines-quiz/utils';
import {
  ShieldCheck,
  User,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  CheckCircle2,
  Circle,
  UserPlus,
  Mail,
  Lock,
  Key,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@mines-quiz/ui';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SUPER_ADMIN_EMAIL = 'subhamkhandual215@gmail.com';

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [roleTab, setRoleTab] = useState<'student' | 'admin'>('student');
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Admin View States: 'first_time_setup' (Initial OTP) | 'login' (Direct Email+Password) | 'otp' (Verify OTP) | 'set_new_password' (Fresh Password)
  const [adminView, setAdminView] = useState<'first_time_setup' | 'login' | 'otp' | 'set_new_password'>('login');
  const [isAdminSetupComplete, setIsAdminSetupComplete] = useState<boolean | null>(null);
  const [adminResetToken, setAdminResetToken] = useState('');
  const [adminOtp, setAdminOtp] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Check Admin Setup Status on open or admin tab switch
  const checkAdminStatus = async () => {
    try {
      const res = await fetch('/api/admin/status');
      const data = await res.json();
      if (data.success) {
        const setupDone = Boolean(data.isSetupComplete);
        setIsAdminSetupComplete(setupDone);
        if (setupDone) {
          setAdminView('login');
        } else {
          setAdminView('first_time_setup');
        }
      } else {
        // If server returns error, default to password login
        setAdminView('login');
      }
    } catch (err) {
      console.warn('Failed to fetch admin status:', err);
      // Default to direct password login rather than forcing OTP
      setAdminView('login');
    }
  };

  useEffect(() => {
    if (isOpen && roleTab === 'admin') {
      checkAdminStatus();
    }
  }, [isOpen, roleTab]);

  // Resend Countdown Timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Strict Live Validation Hooks (Student Mode)
  const nameValidation = useMemo(
    () => validateLegalName(fullName, roleTab),
    [fullName, roleTab]
  );

  const passwordCriteria = useMemo(
    () =>
      validatePasswordStrict(password, {
        role: roleTab,
      }),
    [password, roleTab]
  );

  const passwordStrength = useMemo(
    () => calculatePasswordStrength(password, roleTab),
    [password, roleTab]
  );

  // Admin New Password Validation (Strict Admin Policy: 10 chars, upper, lower, numbers, symbols)
  // Identity restriction relaxed so Admin can use any chosen password including Subham@2005
  const adminNewPasswordCriteria = useMemo(
    () =>
      validatePasswordStrict(newAdminPassword, {
        role: 'admin',
      }),
    [newAdminPassword]
  );

  const adminNewPasswordStrength = useMemo(
    () => calculatePasswordStrength(newAdminPassword, 'admin'),
    [newAdminPassword]
  );

  const adminPasswordsMatch =
    confirmAdminPassword.length > 0 && newAdminPassword === confirmAdminPassword;
  const studentPasswordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  if (!isOpen) return null;

  // Send Real Gmail OTP (for setup or forgot_password)
  const handleSendAdminOtp = async (reason: 'setup' | 'forgot_password' = 'setup') => {
    setErrorMessage(null);
    setSuccessNotice(null);
    setIsOtpSending(true);

    try {
      const res = await fetch('/api/admin/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: SUPER_ADMIN_EMAIL, reason }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to send OTP to Gmail. Please try again.');
        setIsOtpSending(false);
        return;
      }

      setSuccessNotice(`Verification code sent to ${SUPER_ADMIN_EMAIL}`);
      setAdminView('otp');
      setResendCountdown(60);
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      setErrorMessage('Network error while requesting verification code.');
    } finally {
      setIsOtpSending(false);
    }
  };

  // Verify Admin OTP
  const handleVerifyAdminOtp = async () => {
    setErrorMessage(null);

    if (adminOtp.trim().length !== 6) {
      setErrorMessage('Please enter the complete 6-digit OTP code.');
      return;
    }

    setIsOtpVerifying(true);

    try {
      const res = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: SUPER_ADMIN_EMAIL,
          otp: adminOtp.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Invalid or expired OTP code.');
        setIsOtpVerifying(false);
        return;
      }

      setAdminResetToken(data.resetToken || '');
      setSuccessNotice('OTP verified successfully. Please configure your Master Password below.');
      setAdminView('set_new_password');
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      setErrorMessage('Network error while verifying OTP.');
    } finally {
      setIsOtpVerifying(false);
    }
  };

  // Save Fresh Admin Password and Login
  const handleSaveFreshAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    if (!adminNewPasswordCriteria.isValid) {
      setErrorMessage(adminNewPasswordCriteria.error || 'Password must meet all security requirements.');
      setIsLoading(false);
      return;
    }

    if (newAdminPassword !== confirmAdminPassword) {
      setErrorMessage('Passwords do not match. Please verify both entries.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: SUPER_ADMIN_EMAIL,
          resetToken: adminResetToken,
          newPassword: newAdminPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to save master password.');
        setIsLoading(false);
        return;
      }

      setIsAdminSetupComplete(true);
      setUser(data.user, data.token);

      setIsLoading(false);
      if (onSuccess) onSuccess();
      onClose();
      if (data.user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/candidate');
      }
    } catch (err: any) {
      console.error('Admin password update error:', err);
      setErrorMessage('Network error while saving master password.');
      setIsLoading(false);
    }
  };

  // Direct Admin Login (Email + Password) or Student Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    // ==========================================
    // DIRECT ADMIN LOGIN (Email + Password)
    // ==========================================
    if (roleTab === 'admin') {
      const emailToUse = identifier.trim().toLowerCase() || SUPER_ADMIN_EMAIL;

      if (emailToUse !== SUPER_ADMIN_EMAIL.toLowerCase()) {
        setErrorMessage(`Unauthorized: Only ${SUPER_ADMIN_EMAIL} can access Administrator console.`);
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailToUse,
            password: password,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          if (data.needsSetup) {
            setErrorMessage(data.error || 'First-time setup required.');
            setIsAdminSetupComplete(false);
            setAdminView('first_time_setup');
          } else {
            setErrorMessage(data.error || 'Incorrect master password.');
          }
          setIsLoading(false);
          return;
        }

        setUser(data.user, data.token);

        setIsLoading(false);
        if (onSuccess) onSuccess();
        onClose();
        if (data.user?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/candidate');
        }
        return;
      } catch (err: any) {
        console.error('Admin login error:', err);
        setErrorMessage('Network error while logging into Admin console.');
        setIsLoading(false);
        return;
      }
    }

    // ==========================================
    // STUDENT SUBMIT (Register or Sign In)
    // ==========================================
    const emailToUse = identifier.includes('@') ? identifier.trim() : `${identifier.trim()}@minesquiz.com`;

    if (authMode === 'register') {
      if (!nameValidation.isValid) {
        setErrorMessage(nameValidation.error || 'Please enter a valid legal name.');
        setIsLoading(false);
        return;
      }
      if (!passwordCriteria.isValid) {
        setErrorMessage(passwordCriteria.error || 'Please satisfy all password security requirements.');
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify both entries.');
        setIsLoading(false);
        return;
      }
    }

    try {
      if (authMode === 'register') {
        const res = await signUpWithEmail(emailToUse, password);
        const token = await res.user.getIdToken();

        setUser(
          {
            id: res.user.uid,
            firebaseUid: res.user.uid,
            email: res.user.email || emailToUse,
            displayName: nameValidation.formattedName || 'Candidate Student',
            role: 'student',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          token
        );
      } else {
        const res = await signInWithEmail(emailToUse, password);
        const token = await res.user.getIdToken();

        setUser(
          {
            id: res.user.uid,
            firebaseUid: res.user.uid,
            email: res.user.email || emailToUse,
            displayName: res.user.displayName || 'Candidate Student',
            role: 'student',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          token
        );
      }

      setIsLoading(false);
      if (onSuccess) onSuccess();
      onClose();
      router.push('/candidate');
    } catch (err: any) {
      console.warn('Firebase student auth error:', err);

      if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        setErrorMessage('Invalid credentials. Please verify your email and password.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMessage('Password is too weak. Please use at least 8 characters with numbers and symbols.');
      } else if (err.code === 'auth/wrong-password') {
        setErrorMessage('Incorrect password. Please try again.');
      } else {
        setErrorMessage(err.message || 'Authentication failed. Please verify your email and password.');
      }
      setIsLoading(false);
    }
  };

  // Google SSO Handler (Student Only)
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await signInWithGoogle();
      if (!res || !res.user) {
        throw new Error('Google sign-in was not completed.');
      }

      const googleEmail = (res.user.email || '').toLowerCase().trim();

      // If signing in with the designated Administrator email, guide directly to Admin Master Password login
      if (googleEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
        setIsLoading(false);
        setErrorMessage(
          `Notice: ${SUPER_ADMIN_EMAIL} is registered as the Administrator. Google Sign-In is disabled for administrator security. Please enter your Master Password below.`
        );
        setRoleTab('admin');
        setAdminView('login');
        return;
      }

      const token = await res.user.getIdToken();

      setUser(
        {
          id: res.user.uid,
          firebaseUid: res.user.uid,
          email: res.user.email || 'candidate@minesquiz.com',
          displayName: res.user.displayName || 'Candidate Student',
          role: 'student',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token
      );

      setIsLoading(false);
      if (onSuccess) onSuccess();
      onClose();
      router.push('/candidate');
    } catch (err: any) {
      console.warn('Firebase Google SSO notice:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Google sign-in window was closed before completing.');
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Pop-up window was blocked by your browser. Please allow pop-ups for this site.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setErrorMessage('This domain is not authorized in Firebase Console. Please sign in using your email and password.');
      } else if (err.code === 'auth/network-request-failed') {
        setErrorMessage('Network error during Google authentication. Please check your internet connection.');
      } else {
        setErrorMessage(err.message || 'Google authentication failed. Please sign in with your email and password.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-7">
          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 shadow-sm">
              {roleTab === 'admin' ? (
                <ShieldCheck className="w-6 h-6 text-purple-600" />
              ) : authMode === 'register' ? (
                <UserPlus className="w-6 h-6" />
              ) : (
                <ShieldCheck className="w-6 h-6" />
              )}
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-poppins">
              {roleTab === 'admin'
                ? adminView === 'first_time_setup'
                  ? 'Admin First-Time Setup'
                  : adminView === 'login'
                  ? 'Admin Portal'
                  : adminView === 'otp'
                  ? 'Verify Gmail OTP'
                  : 'Set Master Admin Password'
                : authMode === 'register'
                ? 'Create Student Account'
                : 'Student Login'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-inter">
              {roleTab === 'admin'
                ? adminView === 'first_time_setup'
                  ? `Initial security verification required for ${SUPER_ADMIN_EMAIL}`
                  : adminView === 'login'
                  ? 'Direct password sign-in for authorized Administrator'
                  : adminView === 'otp'
                  ? `Enter the 6-digit code sent to ${SUPER_ADMIN_EMAIL}`
                  : 'Configure your Master Admin Password'
                : authMode === 'register'
                ? 'Sign up for secure, AI-proctored online examinations'
                : 'Access your examinations and proctoring scorecard'}
            </p>
          </div>

          {/* Role Tabs: Student vs Admin */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5 text-xs font-bold font-inter">
            <button
              type="button"
              onClick={() => {
                setRoleTab('student');
                setErrorMessage(null);
                setSuccessNotice(null);
              }}
              className={`py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                roleTab === 'student'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{authMode === 'register' ? 'Student Register' : 'Student Login'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRoleTab('admin');
                setErrorMessage(null);
                setSuccessNotice(null);
                setIdentifier(SUPER_ADMIN_EMAIL);
                if (isAdminSetupComplete === false) {
                  setAdminView('first_time_setup');
                } else {
                  setAdminView('login');
                }
              }}
              className={`py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                roleTab === 'admin'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Login</span>
            </button>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Notice */}
          {successNotice && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* ADMIN AUTH FLOW                                           */}
          {/* ========================================================= */}
          {roleTab === 'admin' ? (
            <div className="space-y-4 font-inter">
              {/* STATE 0: FIRST-TIME SETUP (WHEN PASSWORD IS NOT CONFIGURED YET) */}
              {adminView === 'first_time_setup' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 text-xs">
                    <p className="text-purple-900 dark:text-purple-200 font-bold mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Initial Security Setup Required</span>
                    </p>
                    <p className="text-purple-700 dark:text-purple-300 text-[11px] leading-relaxed">
                      Welcome, Administrator! An initial setup is required to configure your Master Password. A 6-digit verification code will be sent to your verified Gmail address.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Admin Email (Verified)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        readOnly
                        value={SUPER_ADMIN_EMAIL}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-slate-50 dark:bg-slate-800/60 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-not-allowed select-none"
                      />
                      <Lock className="w-4 h-4 text-purple-500 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    isLoading={isOtpSending}
                    onClick={() => handleSendAdminOtp('setup')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl shadow-md shadow-purple-600/20 cursor-pointer"
                  >
                    Send Setup Verification Code to Gmail
                  </Button>

                  <div className="text-center text-[11px] text-slate-400">
                    🔒 Only {SUPER_ADMIN_EMAIL} is authorized to access Administrator console.
                  </div>
                </div>
              )}

              {/* STATE 1: DIRECT ADMIN LOGIN (DEFAULT ONCE PASSWORD IS SET) */}
              {adminView === 'login' && (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Admin Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        readOnly
                        value={SUPER_ADMIN_EMAIL}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-slate-50 dark:bg-slate-800/60 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-not-allowed select-none"
                      />
                      <Lock className="w-4 h-4 text-purple-500 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Admin Master Password
                      </label>
                      <button
                        type="button"
                        onClick={() => handleSendAdminOtp('forgot_password')}
                        disabled={isOtpSending}
                        className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                      >
                        {isOtpSending ? 'Sending OTP...' : 'Forgot Password?'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    isLoading={isLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl shadow-md shadow-purple-600/20 cursor-pointer"
                  >
                    Login to Admin Console
                  </Button>

                  <div className="pt-2 text-center text-[11px] text-slate-400">
                    🔒 Google Sign-In is disabled for Administrator security.
                  </div>
                </form>
              )}

              {/* STATE 2: ENTER 6-DIGIT OTP */}
              {adminView === 'otp' && (
                <div className="space-y-3.5">
                  <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 text-xs">
                    <p className="text-purple-900 dark:text-purple-200 font-semibold mb-1">
                      Verification code sent to Gmail
                    </p>
                    <p className="text-purple-700 dark:text-purple-300 text-[11px]">
                      Enter the 6-digit code delivered to <strong>{SUPER_ADMIN_EMAIL}</strong> to configure your password.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Enter 6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={adminOtp}
                      onChange={(e) => setAdminOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full text-center tracking-[12px] text-2xl font-black px-3.5 py-2.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />

                    <div className="flex items-center justify-between mt-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setAdminView(isAdminSetupComplete ? 'login' : 'first_time_setup');
                          setErrorMessage(null);
                        }}
                        className="font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3 h-3" /> Back
                      </button>

                      {resendCountdown > 0 ? (
                        <span className="text-slate-400 font-medium">Resend in {resendCountdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendAdminOtp(isAdminSetupComplete ? 'forgot_password' : 'setup')}
                          disabled={isOtpSending}
                          className="font-bold text-purple-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" /> Resend OTP
                        </button>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    isLoading={isOtpVerifying}
                    onClick={handleVerifyAdminOtp}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl shadow-md shadow-purple-600/20 cursor-pointer"
                  >
                    Verify OTP & Proceed to Password
                  </Button>
                </div>
              )}

              {/* STATE 3: SET FRESH ADMIN PASSWORD (AFTER OTP IS VERIFIED) */}
              {adminView === 'set_new_password' && (
                <form onSubmit={handleSaveFreshAdminPassword} className="space-y-3.5">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>OTP Verified for {SUPER_ADMIN_EMAIL}</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        New Master Password
                      </label>
                      {newAdminPassword.length > 0 && (
                        <span className={`text-[11px] font-bold ${adminNewPasswordStrength.color}`}>
                          {adminNewPasswordStrength.label} ({adminNewPasswordStrength.score}%)
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Live Strength Checklist */}
                    {newAdminPassword.length > 0 && (
                      <div className="mt-2 space-y-2">
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${adminNewPasswordStrength.bgColor}`}
                            style={{ width: `${adminNewPasswordStrength.score}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                          <div className={`flex items-center gap-1.5 ${adminNewPasswordCriteria.hasMinLength ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                            {adminNewPasswordCriteria.hasMinLength ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                            <span>Min 10 characters</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${adminNewPasswordCriteria.hasUpperAndLower ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                            {adminNewPasswordCriteria.hasUpperAndLower ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                            <span>Upper & lower letter</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${adminNewPasswordCriteria.hasNumber ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                            {adminNewPasswordCriteria.hasNumber ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                            <span>Min 2 numbers (0-9)</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${adminNewPasswordCriteria.hasSpecial ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                            {adminNewPasswordCriteria.hasSpecial ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                            <span>Special symbol (@, #)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={confirmAdminPassword}
                        onChange={(e) => setConfirmAdminPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      {adminPasswordsMatch && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    isLoading={isLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl shadow-md shadow-purple-600/20 cursor-pointer"
                  >
                    Save Fresh Password & Enter Admin Console
                  </Button>
                </form>
              )}
            </div>
          ) : (
            /* ========================================================= */
            /* STUDENT AUTH FLOW (EMAIL + PASSWORD + GOOGLE SSO)         */
            /* ========================================================= */
            <>
              <form onSubmit={handleSubmit} className="space-y-4 font-inter">
                {/* Full Legal Name Field (Register Mode Only) */}
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Legal Candidate Name
                      <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Ananya Sharma (First & Last Name)"
                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                          fullName.length > 0
                            ? nameValidation.isValid
                              ? 'border-emerald-500 focus:ring-emerald-500/20'
                              : 'border-amber-400 focus:ring-amber-400/20'
                            : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500'
                        }`}
                      />
                      {fullName.length > 0 && nameValidation.isValid && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>

                    {fullName.length > 0 && (
                      <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                        {nameValidation.isValid ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Format verified: {nameValidation.formattedName}
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {nameValidation.error}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Candidate Email / Roll No.
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="candidate@minesquiz.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password
                      <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    {authMode === 'register' && password.length > 0 && (
                      <span className={`text-[11px] font-bold ${passwordStrength.color}`}>
                        {passwordStrength.label} ({passwordStrength.score}%)
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all pr-10 ${
                        authMode === 'register' && password.length > 0
                          ? passwordCriteria.isValid
                            ? 'border-emerald-500 focus:ring-emerald-500/20'
                            : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength & Checklist for Register Mode */}
                  {authMode === 'register' && password.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${passwordStrength.bgColor}`}
                          style={{ width: `${passwordStrength.score}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                        <div className={`flex items-center gap-1.5 ${passwordCriteria.hasMinLength ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                          {passwordCriteria.hasMinLength ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                          <span>Min 8 characters</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordCriteria.hasUpperAndLower ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                          {passwordCriteria.hasUpperAndLower ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                          <span>Upper & lower letter</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                          {passwordCriteria.hasNumber ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                          <span>Min 1 number (0-9)</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordCriteria.hasSpecial ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                          {passwordCriteria.hasSpecial ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                          <span>Special symbol (@, #)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password (Register Mode Only) */}
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm Password
                      <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                          confirmPassword.length > 0
                            ? studentPasswordsMatch
                              ? 'border-emerald-500 focus:ring-emerald-500/20'
                              : 'border-red-400 focus:ring-red-400/20'
                            : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500'
                        }`}
                      />
                      {studentPasswordsMatch && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  </div>
                )}

                {/* Remember Me (Sign-In Mode Only) */}
                {authMode === 'signin' && (
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600"
                      />
                      <span>Remember me</span>
                    </label>
                    <a href="#forgot" className="font-semibold text-indigo-600 hover:text-indigo-500">
                      Forgot Password?
                    </a>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  className="w-full text-white font-bold py-2.5 rounded-xl shadow-md transition-all cursor-pointer bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                >
                  {authMode === 'register' ? 'Register as Student' : 'Login as Student'}
                </Button>
              </form>

              {/* Social Divider */}
              <div className="relative my-4 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <span className="relative bg-white dark:bg-slate-900 px-3 text-xs text-slate-400 font-medium">
                  or
                </span>
              </div>

              {/* Google SSO Button (Student Only) */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Already registered? Sign In / Don't have an account? Register Toggle */}
              <div className="mt-4 text-center text-xs font-inter text-slate-500 dark:text-slate-400">
                {authMode === 'signin' ? (
                  <p>
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setErrorMessage(null);
                      }}
                      className="font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 underline underline-offset-2 cursor-pointer transition-colors"
                    >
                      Register here
                    </button>
                  </p>
                ) : (
                  <p>
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signin');
                        setErrorMessage(null);
                      }}
                      className="font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 underline underline-offset-2 cursor-pointer transition-colors"
                    >
                      Sign In
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
