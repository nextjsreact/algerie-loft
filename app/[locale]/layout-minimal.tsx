export default function MinimalLocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1>Minimal Layout Works!</h1>
      {children}
    </div>
  );
}