export default function Loader({ label = "Loading..." }) {
  return (
    <div className="flex items-center gap-3 text-textMuted text-sm py-6">
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full rounded-full bg-sky opacity-60 animate-ping" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-sky" />
      </span>
      {label}
    </div>
  );
}
