import { connection } from "next/server";
import { createStaticClient } from "./static";

// Genel sayfaların istek başına, oturumsuz client'ı. Bu sayfalar yalnızca
// kamuya açık veriyi okur; cookie'li client ise giriş yapmış bir adminin süresi
// dolan oturumunu her istekte yenilemeye çalışıyordu. Sunucu bileşeni yeni
// anahtarı cookie'ye yazamadığı için aynı yenileme anahtarı tekrar tekrar
// gönderiliyor, Supabase bunu kötüye kullanım sayıp oturumu iptal ediyor ve
// istekleri sınırlıyordu (429). connection(): cookie okumayan sayfa statik
// üretime kaymasın, her istekte güncel veriyle çizilsin.
export async function createVisitorClient() {
  await connection();
  return createStaticClient();
}
