import DeveloperVoiceTraining from '@/components/DeveloperVoiceTraining';
export default function AiDeveloperPage() {
  return <main className="mx-auto max-w-3xl space-y-5 p-4 md:p-8">
    <section className="rounded-xl border p-5">
      <h1 className="text-2xl font-bold">AI Developer अहिले बन्द छ</h1>
      <p className="mt-2 text-sm text-muted-foreground">AI credit खर्च घटाउन code analysis, proposal र apply गर्ने सुविधा रोकिएको छ।</p>
    </section>
    <DeveloperVoiceTraining />
  </main>;
}
