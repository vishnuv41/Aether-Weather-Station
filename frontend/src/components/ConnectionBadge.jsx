import { Cloud, Radio } from "lucide-react";
import { useConnection } from "../context/ConnectionContext";

export default function ConnectionBadge({ online }) {
  const { mode } = useConnection();
  const isCloud = mode === "cloud";

  return (
    <div className="glass flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium">
      {isCloud ? <Cloud size={14} className="text-sky" /> : <Radio size={14} className="text-teal" />}
      <span className="text-textPrimary">{isCloud ? "Cloud" : "Local"}</span>
      <span className="w-px h-3 bg-line" />
      <span className={`h-2 w-2 rounded-full ${online ? "bg-teal animate-pulseDot" : "bg-coral"}`} />
      <span className={online ? "text-teal" : "text-coral"}>{online ? "Online" : "Offline"}</span>
    </div>
  );
}
