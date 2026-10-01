export default function BackgroundGlow() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute top-20 left-[38%] size-80 rounded-full bg-[#5B92F5]/50 blur-sm" />
      <div className="absolute -bottom-28 -left-24 size-96 rounded-full bg-[#93E8C1]/50 blur-sm" />
      <div className="absolute -bottom-20 left-[52%] size-64 rounded-full bg-[#93E8C1]/50 blur-xl" />
      <div className="absolute right-16 bottom-16 size-72 rounded-full bg-[#5B92F5]/50 blur-xl" />
    </div>
  );
}