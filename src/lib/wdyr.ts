// /// <reference types="why-did-you-render" /> // TODO: Install why-did-you-render types if needed
import React from "react";

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const whyDidYouRender = require("why-did-you-render");
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    trackHooks: true,
    logOwnerReasons: true,
    collapseGroups: true,
    include: [/.*/], // Track all components
    exclude: [/^BrowserRouter/, /^Router/, /^Route/], // Exclude router components
  });
}
