import { LiveFeedContainer } from '@/components/feed/LiveFeedContainer';
import { NewsletterSignup } from '@/components/features/NewsletterSignup';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-b from-background to-card/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              Live Global Transfer Feed
            </h1>
            <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
              Real-time football transfer news with Terry&apos;s unfiltered commentary
            </p>
          </div>

          {/* Morning Briefing Signup */}
          <div className="max-w-md mx-auto mt-8">
            <NewsletterSignup variant="hero" />
          </div>
        </div>
      </section>

      {/* Main Feed Container */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <LiveFeedContainer />
      </section>

      {/* Terry's Corner - Fixed on Desktop */}
      <aside className="hidden lg:block fixed bottom-8 right-8 w-80">
        <div className="bg-card border border-border rounded-lg p-6 shadow-lg rotate-1 hover:rotate-0 transition-transform">
          <h3 className="text-xl font-black mb-4">🎭 Terry&apos;s Corner</h3>
          <div className="space-y-4">
            <div className="terry-voice text-orange-500">
              &quot;Transfer deadline day is just Black Friday for billionaires with too much money and not enough sense.&quot;
            </div>
            <div className="text-xs text-muted-foreground data-mono">
              LIVE FEED ACTIVE
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}