/**
 * Performance Optimization for SEO
 * Handles Core Web Vitals and performance metrics
 */

export class PerformanceOptimizer {
  /**
   * Initialize performance monitoring
   */
  static initializeMonitoring() {
    if (typeof window === "undefined") return;

    // Core Web Vitals monitoring
    this.monitorCoreWebVitals();

    // Page load optimization
    this.optimizePageLoad();

    // Image optimization
    this.optimizeImages();
  }

  /**
   * Monitor Core Web Vitals
   */
  private static monitorCoreWebVitals() {
    // LCP (Largest Contentful Paint)
    this.observeLCP();

    // FID (First Input Delay)
    this.observeFID();

    // CLS (Cumulative Layout Shift)
    this.observeCLS();
  }

  /**
   * Observe Largest Contentful Paint
   */
  private static observeLCP() {
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        // Send to analytics
        this.reportMetric("LCP", lastEntry.startTime);
      });

      observer.observe({ entryTypes: ["largest-contentful-paint"] });
    }
  }

  /**
   * Observe First Input Delay
   */
  private static observeFID() {
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Send to analytics
          this.reportMetric(
            "FID",
            (entry as any).processingStart - entry.startTime,
          );
        }
      });

      observer.observe({ entryTypes: ["first-input"] });
    }
  }

  /**
   * Observe Cumulative Layout Shift
   */
  private static observeCLS() {
    if ("PerformanceObserver" in window) {
      let clsValue = 0;

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }

        // Send to analytics
        this.reportMetric("CLS", clsValue);
      });

      observer.observe({ entryTypes: ["layout-shift"] });
    }
  }

  /**
   * Optimize page load
   */
  private static optimizePageLoad() {
    // Preload critical resources
    this.preloadCriticalResources();

    // Prefetch next page content
    this.prefetchNextContent();

    // Optimize font loading
    this.optimizeFontLoading();
  }

  /**
   * Preload critical resources
   */
  private static preloadCriticalResources() {
    const criticalResources = [
      { href: "/fonts/inter-var.woff2", as: "font", type: "font/woff2" },
      { href: "/images/logo.webp", as: "image" },
    ];

    criticalResources.forEach((resource) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.href = resource.href;
      link.as = resource.as;
      if (resource.type) link.type = resource.type;
      if (resource.as === "font") link.crossOrigin = "anonymous";

      document.head.appendChild(link);
    });
  }

  /**
   * Prefetch next page content
   */
  private static prefetchNextContent() {
    // Prefetch likely next pages on hover
    document.addEventListener(
      "mouseover",
      (event) => {
        const target = event.target as HTMLElement;
        const link = target.closest("a");

        if (link && link.hostname === window.location.hostname) {
          const prefetchLink = document.createElement("link");
          prefetchLink.rel = "prefetch";
          prefetchLink.href = link.href;

          document.head.appendChild(prefetchLink);
        }
      },
      { once: true },
    );
  }

  /**
   * Optimize font loading
   */
  private static optimizeFontLoading() {
    // Use font-display: swap for better performance
    const style = document.createElement("style");
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        font-display: swap;
        src: url('/fonts/inter-var.woff2') format('woff2');
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Optimize images
   */
  private static optimizeImages() {
    // Lazy load images below the fold
    if ("IntersectionObserver" in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute("data-src");
              imageObserver.unobserve(img);
            }
          }
        });
      });

      // Observe all images with data-src
      document.querySelectorAll("img[data-src]").forEach((img) => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Report metric to analytics
   */
  private static reportMetric(name: string, value: number) {
    // Send to Google Analytics 4
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", name, {
        event_category: "Web Vitals",
        value: Math.round(value),
        non_interaction: true,
      });
    }

    // Send to internal analytics
    fetch("/api/analytics/web-vitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        value,
        url: window.location.href,
        timestamp: Date.now(),
      }),
    }).catch(() => {
      // Fail silently
    });
  }

  /**
   * Optimize critical rendering path
   */
  static optimizeCriticalRenderingPath() {
    // Inline critical CSS
    const criticalCSS = `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      .header { background: #1a365d; color: white; }
      .loading { opacity: 0.6; }
    `;

    const style = document.createElement("style");
    style.textContent = criticalCSS;
    document.head.appendChild(style);

    // Load non-critical CSS asynchronously
    const loadCSS = (href: string) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.media = "print";
      link.onload = () => {
        link.media = "all";
      };
      document.head.appendChild(link);
    };

    // Load non-critical stylesheets
    loadCSS("/css/non-critical.css");
  }

  /**
   * Service Worker registration for caching
   */
  static registerServiceWorker() {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered: ", registration);
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError);
        });
    }
  }

  /**
   * Generate performance budget warnings
   */
  static checkPerformanceBudgets() {
    if (typeof window === "undefined") return;

    setTimeout(() => {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;

      const budgets = {
        FCP: 1800, // First Contentful Paint
        LCP: 2500, // Largest Contentful Paint
        TTI: 3800, // Time to Interactive
        totalSize: 1000000, // 1MB total size
      };

      // Check FCP
      if (navigation.loadEventEnd - navigation.fetchStart > budgets.FCP) {
        console.warn("Performance budget exceeded: First Contentful Paint");
      }

      // Check total resource size
      const resources = performance.getEntriesByType("resource");
      const totalSize = resources.reduce((total, resource) => {
        return total + ((resource as any).transferSize || 0);
      }, 0);

      if (totalSize > budgets.totalSize) {
        console.warn("Performance budget exceeded: Total resource size");
      }
    }, 2000);
  }
}

export default PerformanceOptimizer;
