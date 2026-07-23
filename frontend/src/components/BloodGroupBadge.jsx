import { CheckCircle2, AlertCircle } from "lucide-react";

export default function BloodGroupBadge({ group, verified, size = "default" }) {
  return (
    <span
      className={`blood-group-badge ${verified ? "blood-group-badge-verified" : "blood-group-badge-self"}`}
    >
      {verified ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
      {group}
    </span>
  );
}
