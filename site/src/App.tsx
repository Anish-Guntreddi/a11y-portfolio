import React from 'react';
import { ThemeProvider } from '@a11y-portfolio/novaui';
import '@a11y-portfolio/novaui/style.css';
import './index.css';

import { SiteHeader } from './components/SiteHeader';
import { Hero } from './components/Hero';
import { Gallery } from './components/Gallery';
import { AuditDemo } from './components/AuditDemo';
import { Architecture } from './components/Architecture';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <ThemeProvider>
      {/* Skip-to-content link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <SiteHeader />

      <main id="main-content">
        <Hero />
        <Gallery />
        <AuditDemo />
        <Architecture />
      </main>

      <Footer />
    </ThemeProvider>
  );
}
