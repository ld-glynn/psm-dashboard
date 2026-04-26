"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type EntityType = "problem" | "pattern" | "hypothesis" | "agent";

interface EntityDetailState {
  open: boolean;
  entityType: EntityType | null;
  entityId: string | null;
}

interface EntityDetailContextValue {
  state: EntityDetailState;
  openDetail: (type: EntityType, id: string) => void;
  closeDetail: () => void;
}

const EntityDetailContext = createContext<EntityDetailContextValue | null>(null);

export function EntityDetailProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EntityDetailState>({
    open: false,
    entityType: null,
    entityId: null,
  });

  const openDetail = useCallback((type: EntityType, id: string) => {
    setState({ open: true, entityType: type, entityId: id });
  }, []);

  const closeDetail = useCallback(() => {
    setState({ open: false, entityType: null, entityId: null });
  }, []);

  return (
    <EntityDetailContext.Provider value={{ state, openDetail, closeDetail }}>
      {children}
    </EntityDetailContext.Provider>
  );
}

export function useEntityDetail() {
  const ctx = useContext(EntityDetailContext);
  if (!ctx) throw new Error("useEntityDetail must be used within EntityDetailProvider");
  return ctx;
}
