import { TanstackQueryClientProvider } from './query-client-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return <TanstackQueryClientProvider>{children}</TanstackQueryClientProvider>;
}
