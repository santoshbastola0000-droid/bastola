import PushNotificationSetup from "@/components/PushNotificationSetup";
import { UserPreferenceForm } from "@/components/user/preferences/UserPreferenceForm";

export default function UserPreferencesPage() {
  return (
    <div className="space-y-5">
      <PushNotificationSetup />
      <UserPreferenceForm />
    </div>
  );
}
