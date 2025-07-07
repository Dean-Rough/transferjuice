import Script from "next/script";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-8 max-w-7xl">
        <header className="mb-12 border-b border-border py-8">
          <div className="flex items-center">
            {/* Logo lockup on the left */}
            <div className="flex items-center gap-3">
              <img 
                src="/transfer-icon.svg" 
                alt="TransferJuice Icon" 
                className="h-12 w-auto"
              />
              <img 
                src="/transfer-logo-cream.svg" 
                alt="TransferJuice" 
                className="h-12 w-auto"
              />
            </div>
            
            {/* Spacer */}
            <div className="flex-1"></div>
            
            {/* Links to briefings */}
            <Link 
              href="/briefings" 
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-bouchers text-lg transition-colors"
            >
              VIEW BRIEFINGS
            </Link>
          </div>
        </header>
      </div>

      {/* Main content - centered RSS widget */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-6xl">
          <div dangerouslySetInnerHTML={{ 
            __html: '<rssapp-wall id="_zMqruZvtL6XIMNVY"></rssapp-wall>' 
          }} />
        </div>
      </div>

      {/* RSS Widget Script */}
      <Script 
        src="https://widget.rss.app/v1/wall.js" 
        strategy="afterInteractive"
        async
      />
    </div>
  );
}
