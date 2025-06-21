export default function TestPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-4xl font-bold text-orange-500 mb-4">
        TransferJuice Fresh Build Works! 🎉
      </h1>
      <p className="text-xl text-foreground">
        The Terry says: &quot;Well look at that, we&apos;ve escaped the webpack haunted house.&quot;
      </p>
      <div className="mt-8 p-6 bg-card rounded-lg border border-border">
        <h2 className="text-2xl font-semibold mb-2">Next Steps:</h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>✅ Basic Next.js setup working</li>
          <li>✅ Tailwind CSS configured</li>
          <li>✅ Dark theme active</li>
          <li>⏳ Feed components need API data</li>
        </ul>
      </div>
    </div>
  );
}