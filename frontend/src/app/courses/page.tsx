const courses = [
  {
    id: 1,
    title: "Sanskrit Basics",
    level: "Beginner",
    lessons: 12,
    description: "Learn Devanagari script, basic grammar, and common phrases.",
  },
  {
    id: 2,
    title: "Hindi for Beginners",
    level: "Beginner",
    lessons: 10,
    description: "Start speaking Hindi with confidence — script, vocabulary, and conversations.",
  },
  {
    id: 3,
    title: "Intermediate Sanskrit",
    level: "Intermediate",
    lessons: 15,
    description: "Deeper grammar, compound words, and reading original texts.",
  },
]

export default function CoursesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Learning Hub</h1>
        <button className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100">
          Create Course
        </button>
      </div>

      <div className="flex gap-2">
        <button className="rounded-full bg-sansi-100 px-4 py-1 text-sm text-sansi-800">
          All
        </button>
        <button className="rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-600 hover:bg-gray-200">
          Beginner
        </button>
        <button className="rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-600 hover:bg-gray-200">
          Intermediate
        </button>
        <button className="rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-600 hover:bg-gray-200">
          Advanced
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <span className="rounded-full bg-sansi-100 px-3 py-1 text-xs font-medium text-sansi-700">
              {course.level}
            </span>
            <h3 className="mt-3 text-lg font-semibold text-gray-900">{course.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{course.description}</p>
            <p className="mt-4 text-sm text-gray-500">{course.lessons} lessons</p>
          </div>
        ))}
      </div>
    </div>
  )
}
