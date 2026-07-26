export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Progress</h3>
          <p className="mt-2 text-3xl font-bold text-sansi-600">0%</p>
          <p className="text-sm text-gray-500">Courses completed</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Words Learned</h3>
          <p className="mt-2 text-3xl font-bold text-sansi-600">0</p>
          <p className="text-sm text-gray-500">Across all lessons</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Contributions</h3>
          <p className="mt-2 text-3xl font-bold text-sansi-600">0</p>
          <p className="text-sm text-gray-500">Texts & corrections</p>
        </div>
      </div>
    </div>
  )
}
