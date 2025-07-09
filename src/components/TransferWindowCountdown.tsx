"use client";

import { useState, useEffect } from "react";

export function TransferWindowCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isWindowOpen: true,
    message: "",
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      
      // Transfer window dates
      const summerWindowDates = {
        start: new Date(currentYear, 5, 16), // June 16
        end: new Date(currentYear, 8, 1, 23, 59, 59), // September 1 at 23:59:59
      };
      
      const winterWindowDates = {
        start: new Date(currentYear + 1, 0, 1), // January 1 next year
        end: new Date(currentYear + 1, 1, 2, 23, 59, 59), // February 2 next year at 23:59:59
      };
      
      // Adjust for current year if January/February
      if (now.getMonth() <= 1) {
        winterWindowDates.start = new Date(currentYear, 0, 1);
        winterWindowDates.end = new Date(currentYear, 1, 2, 23, 59, 59);
        summerWindowDates.start = new Date(currentYear, 5, 16);
        summerWindowDates.end = new Date(currentYear, 8, 1, 23, 59, 59);
      }

      let targetDate: Date;
      let isWindowOpen = false;
      let message = "";

      // Check if we're in a transfer window
      if (now >= summerWindowDates.start && now <= summerWindowDates.end) {
        // Summer window is open
        targetDate = summerWindowDates.end;
        isWindowOpen = true;
        message = "Until the transfer window closes";
      } else if (now >= winterWindowDates.start && now <= winterWindowDates.end) {
        // Winter window is open
        targetDate = winterWindowDates.end;
        isWindowOpen = true;
        message = "Until the transfer window closes";
      } else if (now < summerWindowDates.start) {
        // Before summer window
        targetDate = summerWindowDates.start;
        message = "Until the transfer window opens";
      } else if (now > summerWindowDates.end && now < winterWindowDates.start) {
        // Between summer and winter
        targetDate = winterWindowDates.start;
        message = "Until the transfer window opens";
      } else {
        // After winter window (shouldn't happen in normal flow)
        targetDate = new Date(currentYear + 1, 5, 16); // Next summer
        message = "Until the transfer window opens";
      }

      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeLeft({ days, hours, minutes, seconds, isWindowOpen, message });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  return (
    <div className="bg-black border-b border-orange-500/20">
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl py-3">
        <div className="flex items-center justify-center gap-4 text-orange-500 font-mono">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tabular-nums">
                {formatNumber(timeLeft.days)}
              </span>
              <span className="text-sm uppercase tracking-wider opacity-70">Days</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tabular-nums">
                {formatNumber(timeLeft.hours)}
              </span>
              <span className="text-sm uppercase tracking-wider opacity-70">Hours</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tabular-nums">
                {formatNumber(timeLeft.minutes)}
              </span>
              <span className="text-sm uppercase tracking-wider opacity-70">Mins</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tabular-nums text-orange-600 animate-pulse">
                {formatNumber(timeLeft.seconds)}
              </span>
              <span className="text-sm uppercase tracking-wider opacity-70">Secs</span>
            </div>
          </div>
          <div className="text-sm uppercase tracking-wider ml-4">
            {timeLeft.message}
          </div>
        </div>
      </div>
    </div>
  );
}