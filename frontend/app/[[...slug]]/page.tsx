"use client";

import dynamic from "next/dynamic";

// The original app (src/App.jsx) owns its own routing via react-router's
// BrowserRouter, exactly as it did under Vite. Mounting it once here, at a
// Next.js catch-all route, means every path under "/" is handled by the
// untouched React-Router tree — so the UI, navigation, and page components
// are 100% identical to the original app. ssr:false is required because the
// app (and several of its dependencies, e.g. charts/leaflet/quill) expect a
// browser environment.
const App = dynamic(() => import("@/App.jsx"), { ssr: false });

export default function CatchAllPage() {
  return <App />;
}
