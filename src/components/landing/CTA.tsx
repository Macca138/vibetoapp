import Link from 'next/link';
import WaitlistForm from './WaitlistForm';

export default function CTA() {
  return (
    <section className="py-24 sm:py-32">
      <div className="px-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Plan Like a Pro?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of vibe coders who've transformed their chaotic ideas into successful projects.
          </p>
          
          {/* Waitlist Form */}
          <div className="mt-10 flex justify-center">
            <div className="w-full max-w-md">
              <h3 className="text-base font-semibold text-white mb-4">
                Be the first to know when we launch
              </h3>
              <WaitlistForm source="cta" />
            </div>
          </div>
          
          <div className="mt-8 text-sm text-gray-300">
            <p>Already have an account? 
              <Link href="/auth/signin" className="ml-2 font-semibold text-white hover:text-purple-400">
                Sign in <span aria-hidden="true">→</span>
              </Link>
            </p>
            <p className="mt-2">No credit card required • Free to start • Cancel anytime</p>
          </div>
        </div>
      </div>
    </section>
  );
}