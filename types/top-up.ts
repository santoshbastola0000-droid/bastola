import { CommissionSettings } from "./unlock.types";

export interface TopUpRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: CommissionSettings | null;
  onSuccess?: () => void;
}
