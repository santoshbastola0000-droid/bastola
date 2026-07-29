import { Card, CardContent } from "@/components/ui/card";

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        🤖 AI Dashboard
      </h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold">
              AI Rules
            </h2>

            <p className="text-gray-500 mt-2">
              Manage AI behavior rules.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold">
              AI Knowledge
            </h2>

            <p className="text-gray-500 mt-2">
              Manage AI knowledge base.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold">
              AI Memory
            </h2>

            <p className="text-gray-500 mt-2">
              View user AI memory.
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
