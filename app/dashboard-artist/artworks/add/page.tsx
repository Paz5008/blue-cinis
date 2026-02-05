import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/dashboard-artist/customization/profile?modal=artwork');
}
