export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        * { cursor: default !important; }
        a, button, select, [role="button"] { cursor: pointer !important; }
        input, textarea { cursor: text !important; }
      `}</style>
      {children}
    </>
  );
}
