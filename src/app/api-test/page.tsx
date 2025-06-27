export default async function ApiTestPage() {
  // Server-side fetch
  const res = await fetch("http://localhost:4433/api/feed?limit=3", {
    cache: "no-store",
  });

  const data = await res.json();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test (Server-Side)</h1>
      <pre className="bg-gray-800 p-4 rounded overflow-auto text-xs">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
