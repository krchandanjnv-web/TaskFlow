import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <DashboardClient
      user={{
        id:    session.user.id!,
        name:  session.user.name  ?? "User",
        email: session.user.email ?? "",
      }}
    />
  );
}
