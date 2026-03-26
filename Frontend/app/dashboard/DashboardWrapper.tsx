'use client';

import { ReactNode } from 'react';
import TokenExpiryMonitor from '../components/TokenExpiryMonitor';

export default function DashboardWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      <TokenExpiryMonitor />
      {children}
    </>
  );
}