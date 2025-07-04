'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { m } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';

const errorMessages: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The verification token has expired or has already been used.',
  Default: 'An error occurred during authentication.',
  OAuthSignin: 'Error in constructing an authorization URL.',
  OAuthCallback: 'Error in handling the response from an OAuth provider.',
  OAuthCreateAccount: 'Could not create OAuth account.',
  EmailCreateAccount: 'Could not create email account.',
  Callback: 'Error in the OAuth callback handler route.',
  OAuthAccountNotLinked: 'The email on the account is already linked, but not with this OAuth account.',
  EmailSignin: 'The e-mail could not be sent.',
  CredentialsSignin: 'The credentials you entered are incorrect.',
  SessionRequired: 'You must be signed in to access this page.',
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <m.div 
        className="max-w-md w-full space-y-8"
        initial="initial"
        animate="animate"
        variants={fadeInUp}
      >
        <div className="text-center">
          <m.div 
            className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100"
            variants={fadeInUp}
          >
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </m.div>
          
          <m.h2 
            className="mt-6 text-3xl font-extrabold text-gray-900"
            variants={fadeInUp}
          >
            Authentication Error
          </m.h2>
          
          <m.p 
            className="mt-2 text-sm text-gray-600"
            variants={fadeInUp}
          >
            {errorMessages[error] || errorMessages.Default}
          </m.p>
        </div>

        <m.div 
          className="mt-8 space-y-4"
          variants={fadeInUp}
        >
          <Link
            href="/auth/signin"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            Try signing in again
          </Link>
          
          <Link
            href="/"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            Go back home
          </Link>
        </m.div>

        <m.div 
          className="text-center text-xs text-gray-500"
          variants={fadeInUp}
        >
          Error code: {error}
        </m.div>
      </m.div>
    </div>
  );
}