import { Secret, TOTP } from 'otpauth';

/** Temporary enrollment for the local preview. Real enrollment belongs to Keycloak. */
export function createAuthenticatorSecret() { return new Secret({size:20}).base32; }
export function demoAuthenticator(secret: string, brand: string, account: string) {
  const label = (value: string,fallback: string,limit: number) => Array.from(value.replace(/:/g,' ').trim()).filter(char => {const code=char.codePointAt(0)!;return code<0xd800 || code>0xdfff;}).slice(0,limit).join('') || fallback;
  return new TOTP({issuer:label(brand,'Theme Studio',48)+' (Demo)',label:label(account,'camille@aurora.fr',128),secret,algorithm:'SHA1',digits:6,period:30});
}
export function verifyAuthenticatorCode(secret: string, token: string, timestamp=Date.now()) {
  return /^[0-9]{6}$/.test(token) && new TOTP({secret,algorithm:'SHA1',digits:6,period:30}).validate({token,timestamp,window:1}) !== null;
}
