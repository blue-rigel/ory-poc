import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { oryIdentityAdmin } from "@/lib/ory-admin";

export const dynamic = "force-dynamic";
import { disableIdentity, enableIdentity, deleteIdentity } from "./actions";

export default async function AdminIdentitiesPage() {
  const { data: identities } = await oryIdentityAdmin.listIdentities({ pageSize: 100 });

  return (
    <div className="w-full max-w-4xl m-auto mt-16">
      <Card>
        <CardHeader>
          <CardTitle>Identities</CardTitle>
          <CardDescription>
            Admin API — list, disable, and delete identities ({identities.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">State</th>
                <th className="py-2 pr-4 font-medium">Created</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {identities.map((identity) => {
                const traits = (identity.traits ?? {}) as Record<string, unknown>;
                const isActive = identity.state !== "inactive";
                return (
                  <tr key={identity.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      {String(traits.email ?? identity.id)}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge variant={isActive ? "default" : "secondary"}>
                        {identity.state ?? "unknown"}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {identity.created_at
                        ? new Date(identity.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <form
                          action={async () => {
                            "use server";
                            if (isActive) {
                              await disableIdentity(identity.id);
                            } else {
                              await enableIdentity(identity.id);
                            }
                          }}
                        >
                          <Button type="submit" variant="outline" size="sm">
                            {isActive ? "Disable" : "Enable"}
                          </Button>
                        </form>
                        <form
                          action={async () => {
                            "use server";
                            await deleteIdentity(identity.id);
                          }}
                        >
                          <Button type="submit" variant="destructive" size="sm">
                            Delete
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
