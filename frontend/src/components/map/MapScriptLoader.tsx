"use client";

import Script from 'next/script';

export default function MapScriptLoader() {
  return (
    <Script
      src="https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.js"
      strategy="beforeInteractive"
      onLoad={() => {
        if (typeof window !== 'undefined') {
          // Notify components that MapLibre is ready
          window.dispatchEvent(new CustomEvent('maplibregl-ready'));
        }
      }}
    />
  );
}
