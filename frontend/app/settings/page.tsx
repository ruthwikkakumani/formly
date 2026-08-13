import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { SettingsWorkspace } from "@/components/settings/SettingsWorkspace";

export default function SettingsPage() {
  return (
    <WorkspaceShell>
      <SettingsWorkspace />
    </WorkspaceShell>
  );
}
