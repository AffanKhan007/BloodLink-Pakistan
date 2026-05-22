import { AlertCircle, CheckCircle2, Clock3, ShieldBan } from "lucide-react";

const iconByTone = {
  approved: CheckCircle2,
  available: CheckCircle2,
  accepted: CheckCircle2,
  completed: CheckCircle2,
  fulfilled: CheckCircle2,
  resolved: CheckCircle2,
  rejected: ShieldBan,
  blocked: ShieldBan,
  cancelled: ShieldBan,
  dismissed: ShieldBan,
  pending: Clock3,
  "pending-approval": Clock3,
  "pending-review": Clock3,
  reviewed: Clock3,
  suspended: ShieldBan,
  matched: AlertCircle,
  critical: AlertCircle,
};

export default function StatusBadge({ value }) {
  const tone = String(value || "")
    .toLowerCase()
    .replace(/_/g, "-");
  const Icon = iconByTone[tone] || Clock3;

  return (
    <span className={`status-badge status-${tone}`}>
      <Icon size={14} />
      {String(value || "").replace(/_/g, " ")}
    </span>
  );
}
