// pages/index.tsx
import dynamic from 'next/dynamic';

// Main app component - contains the full property management system
const PropertyNexus = dynamic(() => import('../src/components/PropertyNexus'), { ssr: false });

export default function HomePage() {
  return <PropertyNexus />;
}
