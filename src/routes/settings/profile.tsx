import { createFileRoute } from '@tanstack/react-router';
import { m } from "@/paraglide/messages.js";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { SettingsForm } from "./-settings-form";

function SettingsPage() {
  const profileQuery = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const data = await apiGet<{
        name?: string;
        email?: string;
        image?: string;
      }>("/api/user/profile");
      return {
        name: data.name || "",
        email: data.email || "",
        image: data.image || "",
      };
    },
  });

  if (profileQuery.isPending) {
    return (
      <div className="p-6 text-muted-foreground">{m["settings.profile.loading"]()}</div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-destructive">
          {profileQuery.error?.message || m["settings.profile.save_failed"]()}
        </div>
        <Button type="button" variant="outline" onClick={() => profileQuery.refetch()}>
          {m["common.table.refresh"]()}
        </Button>
      </div>
    );
  }

  const user = profileQuery.data;

  return <SettingsForm name={user.name} email={user.email} image={user.image} />;
}

export const Route = createFileRoute('/settings/profile')({
  component: SettingsPage,
});
