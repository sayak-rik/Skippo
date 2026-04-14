import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 32 }}>
      <h1>Skippo Workspace</h1>
      <p>
        Open the <Link href="/dashboard">dashboard</Link>.
      </p>
    </main>
  );
}
