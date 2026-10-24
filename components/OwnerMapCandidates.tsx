import type { OwnerMapResult } from '@/lib/voice/owner-map-lookup';
export function OwnerMapCandidates({result}:{result:OwnerMapResult|null}) {
  if(!result)return null;
  const places=result.reason.startsWith('AMBIGUOUS')?result.anchors||[]:[...(result.anchors||[]),...(result.nearby||[])];
  return <aside className="space-y-2 rounded-lg border p-3 text-sm" aria-label="Map clarification candidates">
    <p className="font-medium">Google Maps · ठाउँ बुझ्न सहयोग</p>
    <p>{result.reason==='CITY_REQUIRED'?'पहिले शहरको नाम भन्नुहोस्।':!result.available?'अहिले map बाट पुष्टि भएन। Owner ले भनेको landmark नै सोध्नुहोस्।':result.reason.startsWith('AMBIGUOUS')?'उस्तै नामका ठाउँ भेटिए। कुन ठाउँ हो स्पष्ट गर्नुहोस्।':'यी map मा भेटिएका ठाउँ हुन्। घरको ठेगाना वा “भित्र” जाने बाटो पुष्टि भएको होइन।'}</p>
    {places.map(place=><div key={place.placeId}>
      <a className="underline" href={place.mapsUrl} target="_blank" rel="noopener noreferrer">{place.name}</a>
      <p className="text-xs opacity-70">{place.address}</p>
      {place.attributions?.map(a=><span className="mr-2 text-xs" key={a.provider+a.providerUri}>{a.providerUri?<a href={a.providerUri} target="_blank" rel="noopener noreferrer">{a.provider}</a>:a.provider}</span>)}
    </div>)}
    {result.available&&!places.length&&<p>मिल्दो ठाउँ भेटिएन।</p>}
  </aside>;
}
