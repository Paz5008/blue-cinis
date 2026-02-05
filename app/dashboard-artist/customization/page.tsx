import { redirect } from "next/navigation";

export default function CustomizationRootRedirect() {
  redirect("/dashboard-artist/customization/profile");
}
