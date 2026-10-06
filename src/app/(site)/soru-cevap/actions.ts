"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createStaticClient } from "@/lib/supabase/static";
import { checkSubmission, TOKEN_PATTERN, type SubmissionInput } from "@/lib/qa";
import { mapQuestionStatus, type QuestionStatus, type QuestionStatusRow } from "@/types/faq";

export type SubmitQuestionPayload = SubmissionInput & {
  /** Bal küpü: gerçek ziyaretçi bu alanı görmez, doldurmaz. */
  website: string;
  /** Formun açıldığı an (ms). Birkaç saniyeden kısa sürede gelen gönderim bottur. */
  startedAt: number;
};

export type SubmitQuestionResult =
  | { ok: true; token: string }
  | { ok: false; error: string; field?: keyof SubmissionInput };

const GENERIC_ERROR = "Sorun gönderilemedi. Biraz sonra yeniden dene.";

/**
 * İstemci özeti: IP adresi saklanmaz; günlük değişen tuzla özetlenir. Yalnız
 * hız sınırı için kullanılır ve ertesi gün başka bir değere dönüşür.
 */
async function clientHash(): Promise<string | null> {
  const list = await headers();
  const ip =
    list.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    list.get("x-real-ip")?.trim() ||
    "";
  if (!ip) return null;
  const salt = process.env.QA_HASH_SALT ?? "hedefim-lise-soru-cevap";
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${salt}:${day}:${ip}`).digest("hex");
}

export async function submitQuestion(payload: SubmitQuestionPayload): Promise<SubmitQuestionResult> {
  const elapsed = Date.now() - Number(payload.startedAt);
  if (payload.website || !Number.isFinite(elapsed) || elapsed < 3000) {
    // Bota başarı görünümü verme, ama kaydetme de.
    return { ok: false, error: GENERIC_ERROR };
  }

  const check = checkSubmission({
    question: String(payload.question ?? ""),
    details: String(payload.details ?? ""),
    categoryId: String(payload.categoryId ?? ""),
    nickname: String(payload.nickname ?? ""),
  });
  if (!check.ok) return { ok: false, error: check.error, field: check.field };

  const supabase = createStaticClient();
  const { data, error } = await supabase.rpc("submit_question", {
    p_question: check.value.question,
    p_details: check.value.details,
    p_category_id: check.value.categoryId,
    p_nickname: check.value.nickname,
    p_client_hash: await clientHash(),
  });

  if (error) {
    if (error.message.includes("qa:rate_limited"))
      return { ok: false, error: "Kısa sürede çok soru gönderdin. Bir saat sonra yeniden deneyebilirsin." };
    if (error.message.includes("qa:busy"))
      return { ok: false, error: "Şu anda çok soru geliyor. Biraz sonra yeniden dene." };
    if (error.message.includes("qa:question_length"))
      return { ok: false, field: "question", error: "Sorun 10 ile 300 karakter arasında olmalı." };
    console.error("Soru gönderilemedi:", error.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  const token = String(data ?? "");
  if (!TOKEN_PATTERN.test(token)) return { ok: false, error: GENERIC_ERROR };
  return { ok: true, token };
}

/** Takip anahtarıyla soru durumu. Anahtar geçersizse ya da kayıt yoksa null. */
export async function getQuestionStatus(token: string): Promise<QuestionStatus | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  const supabase = createStaticClient();
  const { data, error } = await supabase.rpc("get_question_status", { p_token: token });
  if (error) {
    console.error("Soru durumu okunamadı:", error.message);
    return null;
  }
  const row = (data as QuestionStatusRow[] | null)?.[0];
  return row ? mapQuestionStatus(row) : null;
}

/** "Sorduklarım" listesi: tarayıcıda saklı anahtarların durumları (en çok 20). */
export async function getQuestionStatuses(
  tokens: string[],
): Promise<{ token: string; status: QuestionStatus | null }[]> {
  const unique = [...new Set(Array.isArray(tokens) ? tokens : [])]
    .filter((token) => typeof token === "string" && TOKEN_PATTERN.test(token))
    .slice(0, 20);
  return Promise.all(unique.map(async (token) => ({ token, status: await getQuestionStatus(token) })));
}
