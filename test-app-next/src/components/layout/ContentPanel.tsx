type Props = {
  children: React.ReactNode;
};

export default function ContentPanel({ children }: Props) {
  return (
    <div className="p-6">
      <div className="min-h-[calc(100vh-3rem)] rounded-2xl bg-surface px-8 py-7">
        {children}
      </div>
    </div>
  );
}
