"use server";

import { oryIdentityAdmin } from "@/lib/ory-admin";
import { revalidatePath } from "next/cache";

export async function disableIdentity(id: string) {
  await oryIdentityAdmin.patchIdentity({
    id,
    jsonPatch: [{ op: "replace", path: "/state", value: "inactive" }],
  });
  revalidatePath("/admin/identities");
}

export async function enableIdentity(id: string) {
  await oryIdentityAdmin.patchIdentity({
    id,
    jsonPatch: [{ op: "replace", path: "/state", value: "active" }],
  });
  revalidatePath("/admin/identities");
}

export async function deleteIdentity(id: string) {
  await oryIdentityAdmin.deleteIdentity({ id });
  revalidatePath("/admin/identities");
}
