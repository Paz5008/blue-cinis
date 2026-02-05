import { redirect } from "next/navigation";

export default function ClientRegistrationPage() {
  redirect("/register?type=client");
}
