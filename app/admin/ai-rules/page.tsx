export default function AiRulesPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        AI Rules
      </h1>

      <button className="bg-black text-white px-4 py-2 rounded mb-6">
        + Add New Rule
      </button>

      <div className="bg-white rounded-lg p-6 shadow">

        <h2 className="text-xl font-semibold mb-4">
          Rule
        </h2>

        <textarea
          className="w-full border rounded p-3 h-40"
          placeholder="Write AI rule description..."
        />

        <div className="mt-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked />
            Enabled
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button className="bg-blue-600 text-white px-5 py-2 rounded">
            Save
          </button>

          <button className="border px-5 py-2 rounded">
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
