import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { TeamView } from "@/components/team/TeamView";

export default function SettingsPage() {
  return (
    <WorkspaceShell>
      <AccountSettings />
      <TeamView embedded />
    </WorkspaceShell>
  );
}
