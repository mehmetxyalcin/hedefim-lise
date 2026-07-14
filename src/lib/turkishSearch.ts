// Türkçe okul adı araması için büyük/küçük harf duyarsız desen üretir.
//
// Postgres'in `~*` (imatch) operatörü ASCII harflerini ve ş/ç/ö/ü/ğ gibi çoğu
// Türkçe harfi doğru katlar; ancak noktalı/noktasız i ailesini (İ/i, I/ı) katlamaz.
// Bu yüzden i ailesindeki harfleri, tüm biçimleri kapsayan bir karakter sınıfına
// çeviririz. Böylece "imam" araması "İmam Hatip" okulunu da bulur.
//
// Dönen değer bir POSIX regex desenidir; `.regexIMatch("name", pattern)` ile
// kullanılır. Bağlanmamış (unanchored) olduğu için "içeren" araması yapar.
export function buildTurkishNameRegex(input: string): string {
  // Regex özel karakterlerini kaçır (kullanıcı girdisi düz metin olarak eşleşmeli).
  const escaped = input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // i ailesindeki her harfi, dört biçimi de kapsayan sınıfa çevir.
  return escaped.replace(/[iıİI]/g, "[iıİI]");
}
