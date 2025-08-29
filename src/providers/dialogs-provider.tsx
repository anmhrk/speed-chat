'use client';

import { createContext, useContext, useState } from 'react';
import ApiKeysDialog from '@/components/api-keys-dialog';
import { SearchDialog } from '@/components/search-dialog';

type DialogsContextType = {
  isApiKeysOpen: boolean;
  setIsApiKeysOpen: (isApiKeysOpen: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (isSearchOpen: boolean) => void;
};

const DialogsContext = createContext<DialogsContextType | undefined>(undefined);

export function DialogsProvider({ children }: { children: React.ReactNode }) {
  const [isApiKeysOpen, setIsApiKeysOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <DialogsContext
      value={{ isApiKeysOpen, setIsApiKeysOpen, isSearchOpen, setIsSearchOpen }}
    >
      {children}
      <ApiKeysDialog onOpenChange={setIsApiKeysOpen} open={isApiKeysOpen} />
      <SearchDialog onOpenChange={setIsSearchOpen} open={isSearchOpen} />
    </DialogsContext>
  );
}

export function useDialogs() {
  const context = useContext(DialogsContext);
  if (!context) {
    throw new Error('useDialogs must be used within a DialogsProvider');
  }
  return context;
}
