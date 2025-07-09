"use client";

import { formatTextWithHighlights } from "@/lib/textFormatting";

export function FormattedText({ text }: { text: string }) {
  const formattedHtml = formatTextWithHighlights(text);
  
  return (
    <span 
      dangerouslySetInnerHTML={{ __html: formattedHtml }}
    />
  );
}