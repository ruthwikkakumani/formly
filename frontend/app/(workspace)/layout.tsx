import { ReactNode } from "react";

import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { RouteEnter } from "@/components/shared/RouteEnter";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceShell>
      <RouteEnter>{children}</RouteEnter>
    </WorkspaceShell>
  );
}
