import { redirect } from "next/navigation";

export default function ArtistRegistrationPage() {
    redirect("/register?type=artist");
}
