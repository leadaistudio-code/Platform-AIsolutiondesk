import type { SocialPersona } from '@aisolutiondesk/types';
import { getServerApi } from '@/lib/api-server';
import { Card } from '@/components/ui/card';
import { PersonaForm } from '@/components/social/persona-form';

/** AI brand-voice editor — shapes every post the AI generates. */
export default async function SocialPersonaPage() {
  let persona: SocialPersona = {};
  let error: string | null = null;
  try {
    const api = await getServerApi();
    persona = await api.getSocialPersona();
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Brand Persona</h1>
        <p className="text-muted-foreground">
          Define your voice once — the AI uses it when generating every LinkedIn and
          X post. Leave any field blank to give the AI more freedom.
        </p>
      </div>

      {error ? (
        <Card className="p-4 text-sm text-rose-300">Couldn&apos;t load persona: {error}</Card>
      ) : (
        <PersonaForm initial={persona} />
      )}
    </div>
  );
}
