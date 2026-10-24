/** Navigation commands only. Credentials are verified exclusively by the backend. */
export function developerVoiceCommand(text:string):'ON'|'OFF'|null {
  const value=text.toLowerCase().replace(/[।.!?,]/g,'').replace(/\s+/g,' ').trim();
  const match=value.match(/^(?:please |कृपया )?(?:developer|डेभलपर) (?:mode|mood|मोड|मुड) (on|अन|खोल|खोल्नुहोस्|खोलिदेऊ|off|अफ|बन्द)(?: (?:gara|gar|garnuhos|गर|गर्नुहोस्|गर्नुस्))?$/);
  if(!match)return null;
  return ['on','अन','खोल','खोल्नुहोस्','खोलिदेऊ'].includes(match[1])?'ON':'OFF';
}
