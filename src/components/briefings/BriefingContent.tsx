/**
 * Briefing Content Component
 * Renders the main article content with Terry's commentary
 */

import React from 'react';
import type { BriefingSection } from '@/types/briefing';

interface BriefingContentProps {
  sections: BriefingSection[];
  feedItems: any[];
}

export function BriefingContent({ sections, feedItems }: BriefingContentProps) {
  return (
    <div className="briefing-content">
      {sections.map((section) => (
        <section 
          key={section.id} 
          className={`content-section section-${section.type}`}
          data-section-type={section.type}
        >
          {renderSection(section)}
        </section>
      ))}
    </div>
  );
}

function renderSection(section: BriefingSection) {
  switch (section.type) {
    case 'intro':
      return <IntroSection content={section.content} />;
    
    case 'transfer':
      return <TransferSection section={section} />;
    
    case 'partner':
      return <PartnerSection section={section} />;
    
    case 'analysis':
      return <AnalysisSection section={section} />;
    
    case 'outro':
      return <OutroSection content={section.content} />;
    
    default:
      return <GenericSection section={section} />;
  }
}

// Section Components

function IntroSection({ content }: { content: string }) {
  return (
    <div className="intro-section mb-8">
      <div 
        dangerouslySetInnerHTML={{ __html: content }} 
        className="text-lg text-zinc-300 leading-relaxed"
      />
    </div>
  );
}

function TransferSection({ section }: { section: BriefingSection }) {
  const isBreaking = section.metadata?.priority === 'BREAKING';
  
  return (
    <div className="transfer-section mb-10">
      {section.title && (
        <h2 className={`text-3xl font-bold mb-4 ${isBreaking ? 'text-red-500' : 'text-white'}`}>
          {isBreaking && <span className="animate-pulse mr-2">🚨</span>}
          {section.title}
        </h2>
      )}
      
      <div 
        dangerouslySetInnerHTML={{ __html: section.content }}
        className="transfer-content space-y-4"
      />
      
      {section.feedItemIds && section.feedItemIds.length > 0 && (
        <div className="mt-4 text-sm text-zinc-500">
          <span>{section.feedItemIds.length} sources</span>
        </div>
      )}
    </div>
  );
}

function PartnerSection({ section }: { section: BriefingSection }) {
  return (
    <div className="partner-callout mb-10">
      {section.title && (
        <h4 className="text-xl font-bold mb-3">{section.title}</h4>
      )}
      
      <div 
        dangerouslySetInnerHTML={{ __html: section.content }}
        className="partner-content"
      />
    </div>
  );
}

function AnalysisSection({ section }: { section: BriefingSection }) {
  const isBullshit = section.title?.toLowerCase().includes('bullshit');
  
  return (
    <div className={`analysis-section mb-10 ${isBullshit ? 'bullshit-corner' : ''}`}>
      {section.title && (
        <h4 className="text-2xl font-bold mb-4">{section.title}</h4>
      )}
      
      <div 
        dangerouslySetInnerHTML={{ __html: section.content }}
        className="analysis-content"
      />
    </div>
  );
}

function OutroSection({ content }: { content: string }) {
  return (
    <div className="outro-section mt-12 mb-8 text-center">
      <div className="w-16 h-1 bg-tj-orange mx-auto mb-6" />
      <div 
        dangerouslySetInnerHTML={{ __html: content }}
        className="text-lg text-zinc-400 italic"
      />
    </div>
  );
}

function GenericSection({ section }: { section: BriefingSection }) {
  return (
    <div className="generic-section mb-8">
      {section.title && (
        <h3 className="text-2xl font-bold mb-4">{section.title}</h3>
      )}
      <div dangerouslySetInnerHTML={{ __html: section.content }} />
    </div>
  );
}