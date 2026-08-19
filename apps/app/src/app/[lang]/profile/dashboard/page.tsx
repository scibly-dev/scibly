import { routes } from "@scibly/routes";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  redirect(routes.app.profile.userSettings);
}
