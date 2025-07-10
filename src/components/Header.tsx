import Link from "next/link";
import { TransferWindowCountdown } from "./TransferWindowCountdown";

export function Header() {
  return (
    <>
      <header className="border-b border-border">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl py-4 sm:py-6">
          <div className="flex items-center">
            {/* Logo lockup on the left */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <img
                src="/transfer-icon.svg"
                alt="TransferJuice Icon"
                className="h-8 sm:h-10 md:h-12 w-auto"
              />
              <img
                src="/transfer-logo-cream.svg"
                alt="TransferJuice"
                className="h-8 sm:h-10 md:h-12 w-auto hidden sm:block"
              />
            </Link>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Get the news button */}
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-lg text-sm sm:text-base md:text-xl transition-colors font-bouchers tracking-wider shadow-lg hover:shadow-xl touch-target">
              <span className="hidden sm:inline">GET THE NEWS</span>
              <span className="sm:hidden">SUBSCRIBE</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Transfer window countdown */}
      <TransferWindowCountdown />
    </>
  );
}