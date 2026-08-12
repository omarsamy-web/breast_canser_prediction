export default function ChartCard({ title, children }) {
  return (
    <section className="glass rounded-xl p-5">
      <h2 className="mb-4 text-base font-bold">{title}</h2>
      <div className="h-72">{children}</div>
    </section>
  );
}
