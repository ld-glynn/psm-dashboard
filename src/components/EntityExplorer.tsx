"use client";

interface EntityExplorerProps {
  title: string;
  description: string;
  listPanel: React.ReactNode;
  detailPanel: React.ReactNode;
  emptyDetail?: React.ReactNode;
  hasSelection: boolean;
}

export function EntityExplorer({
  title,
  description,
  listPanel,
  detailPanel,
  emptyDetail,
  hasSelection,
}: EntityExplorerProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-sm font-bold text-foreground">{title}</h1>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>

      <div className="flex gap-4" style={{ height: "calc(100vh - 160px)" }}>
        {/* List panel */}
        <div className="w-80 shrink-0 overflow-y-auto border border-border rounded-lg bg-card">
          {listPanel}
        </div>

        {/* Detail panel */}
        <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-card">
          {hasSelection ? detailPanel : (
            emptyDetail || (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                Select an item from the list to view details
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/** Reusable list item for the left panel */
export function EntityListItem({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 border-b border-border/50 transition-colors ${
        selected ? "bg-accent" : "hover:bg-accent/50"
      }`}
    >
      {children}
    </button>
  );
}
