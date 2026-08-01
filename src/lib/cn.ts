// Küçük, bağımlılıksız className birleştirici (clsx benzeri).
// Falsy değerleri atar, kalanları boşlukla birleştirir. Sonda gelen sınıflar
// önceki sınıfları CSS'te ezmez — çakışan utility'leri elle ele almaya dikkat et.
export type ClassValue = string | number | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
