export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-emerald-100/70 blur-3xl" />
      <div className="absolute -bottom-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-teal-50 blur-3xl" />
      <div className="absolute left-1/3 top-1/2 h-[22rem] w-[22rem] rounded-full bg-emerald-50 blur-3xl" />
    </div>
  );
}
