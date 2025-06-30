import Link from 'next/link';
import WaitlistForm from './WaitlistForm';

export default function CTA() {
  return (
    <section className="bg-indigo-600">
      <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to bring your app idea to life?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-indigo-100">
            Join thousands of entrepreneurs and innovators who are turning their ideas into successful apps with VibeToApp.
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
          
          <div className="mt-8 text-sm text-indigo-200">
            <p>Already have an account? 
              <Link href="/auth/signin" className="ml-2 font-semibold text-white hover:text-indigo-100">
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