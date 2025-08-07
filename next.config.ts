import type { NextConfig } from 'next';
import './backend/env/server';
import './backend/env/client';

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    reactCompiler: true,
  },
};

export default nextConfig;
