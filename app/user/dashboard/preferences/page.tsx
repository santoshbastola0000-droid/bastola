import { UserPreferenceForm } from "@/components/user/preferences/UserPreferenceForm";
import PushNotificationSetup from "@/components/PushNotificationSetup";

export default function UserPreferencesPage() {
  return (
    <div className="space-y-5">
      <PushNotificationSetup />
      <UserPreferenceForm />
    </div>
  );
}
