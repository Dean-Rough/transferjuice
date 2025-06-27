"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/Card";

interface NewsletterSignupProps {
  variant?: "card" | "inline" | "hero" | "compact";
  className?: string;
}

export function NewsletterSignup({
  variant = "card",
  className = "",
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // TODO: Implement actual newsletter signup
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      setSuccess(true);
      setEmail("");
    } catch (err) {
      setError("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  if (variant === "hero") {
    return (
      <div className={`max-w-md mx-auto ${className}`}>
        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              You&apos;re in!
            </h3>
            <p className="text-muted-foreground">
              Welcome to the Transfer Juice family. Your first briefing is on
              its way.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              required
              size="lg"
            />
            <Button
              type="submit"
              loading={loading}
              disabled={!validateEmail(email)}
              size="lg"
              className="w-full"
            >
              Get Transfer Updates
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              3x daily briefings. Unsubscribe anytime. No spam, just transfers.
            </p>
          </form>
        )}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`${className}`}>
        {success ? (
          <div className="flex items-center justify-center p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <svg
                className="w-5 h-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="text-sm font-medium text-green-500">
                Successfully subscribed!
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              className="flex-1"
              required
            />
            <Button
              type="submit"
              loading={loading}
              disabled={!validateEmail(email)}
            >
              Subscribe
            </Button>
          </form>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={className}>
        {success ? (
          <div className="text-center">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-zinc-100 mb-1">
              Subscribed!
            </p>
            <p className="text-xs text-zinc-400">Check your email</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              size="sm"
              required
            />
            <Button
              type="submit"
              loading={loading}
              disabled={!validateEmail(email)}
              size="sm"
              className="w-full"
            >
              Subscribe
            </Button>
            <p className="text-xs text-zinc-500 text-center font-mono">
              3x daily briefings
            </p>
          </form>
        )}
      </div>
    );
  }

  // Card variant
  return (
    <Card variant="elevated" className={className}>
      <CardHeader>
        <CardTitle>Never Miss a Transfer</CardTitle>
        <CardDescription>
          Get the latest ITK updates delivered to your inbox. 3x daily briefings
          covering all the transfer gossip.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              You&apos;re subscribed!
            </h3>
            <p className="text-sm text-muted-foreground">
              Check your email for confirmation and your first briefing.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              required
            />
            <Button
              type="submit"
              loading={loading}
              disabled={!validateEmail(email)}
              className="w-full"
            >
              Subscribe to Transfer Juice
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              By subscribing, you agree to receive our transfer updates.
              Unsubscribe at any time.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
