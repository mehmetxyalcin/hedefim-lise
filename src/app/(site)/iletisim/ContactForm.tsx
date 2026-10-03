"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Loader2, Send } from "lucide-react";
import { sendContactMessage } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { buildTurkishNameRegex } from "@/lib/turkishSearch";

const SCHOOL_SUBJECTS = [
  "Okul Bilgisi Güncelleme",
  "Yeni Okul Ekleme Talebi",
  "Hatalı Bilgi Bildirimi",
];

const SUBJECTS = [
  ...SCHOOL_SUBJECTS,
  "Teknik Sorun",
  "Öneri ve Görüş",
  "Diğer",
];

type SchoolResult = {
  id: number;
  name: string;
  district: string;
};

// Anasayfa belge dünyasının (.landing) kontrol dili: kâğıt zeminli kutu,
// odakta teal çerçeve + halka. ScoreScale ve FilterSelect ile aynı ölçüler.
const INPUT_CLASS =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--doc-ground)] px-4 py-2.5 text-base text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-faint)] focus:border-[var(--teal)] focus:bg-[var(--doc-panel)] focus:ring-4 focus:ring-[var(--teal-ring)]";
const LABEL_CLASS =
  "mb-2 flex items-baseline gap-2 font-display text-sm font-bold text-[var(--ink)]";
const OPTIONAL = (
  <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--ink-faint)]">
    isteğe bağlı
  </span>
);
const TEXT_ACTION =
  "inline-flex items-center gap-1.5 rounded-md font-display text-sm font-bold text-[var(--teal)] transition-colors hover:text-[var(--teal-deep)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--teal-ring)]";
const MIN_MESSAGE = 20;

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [schoolQuery, setSchoolQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<SchoolResult | null>(null);
  const [schoolNotInList, setSchoolNotInList] = useState(false);
  const [message, setMessage] = useState("");

  const [schoolResults, setSchoolResults] = useState<SchoolResult[]>([]);
  const [schoolDropdownOpen, setSchoolDropdownOpen] = useState(false);
  const [schoolLoading, setSchoolLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isSchoolSubject = SCHOOL_SUBJECTS.includes(subject);
  const schoolQueryReady = schoolQuery.trim().length >= 2;
  const visibleSchoolResults = schoolQueryReady ? schoolResults : [];
  const schoolListOpen = schoolDropdownOpen && schoolQueryReady;

  // Okul arama debounce
  useEffect(() => {
    if (!isSchoolSubject || selectedSchool || schoolNotInList) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Kısa sorguda istek atılmaz; eski sonuçlar render'da gizlenir.
    if (schoolQuery.trim().length < 2) return;

    debounceRef.current = setTimeout(async () => {
      setSchoolLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("schools")
        .select("id, name, district")
        .eq("is_active", true)
        .regexIMatch("name", buildTurkishNameRegex(schoolQuery.trim()))
        .limit(8);

      setSchoolResults((data ?? []) as SchoolResult[]);
      setSchoolDropdownOpen(true);
      setSchoolLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [schoolQuery, isSchoolSubject, selectedSchool, schoolNotInList]);

  // Dropdown dışına tıklayınca kapat
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSchoolDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setSubject("");
    setSchoolQuery("");
    setSelectedSchool(null);
    setSchoolNotInList(false);
    setMessage("");
    setServerError("");
    setSuccess(false);
    setSchoolResults([]);
    setSchoolDropdownOpen(false);
  }

  function isFormValid() {
    if (!name.trim() || !email.trim() || !subject.trim()) return false;
    if (message.trim().length < MIN_MESSAGE) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    setSubmitting(true);

    const result = await sendContactMessage({
      name,
      email,
      phone,
      subject,
      schoolId: selectedSchool?.id ?? null,
      schoolNameText: selectedSchool ? selectedSchool.name : schoolNotInList ? schoolQuery : "",
      message,
    });

    setSubmitting(false);

    if (result.success) {
      setSuccess(true);
    } else {
      setServerError(result.error);
    }
  }

  function chooseSubject(value: string) {
    setSubject(value);
    setSelectedSchool(null);
    setSchoolQuery("");
    setSchoolNotInList(false);
    setSchoolResults([]);
    setSchoolDropdownOpen(false);
  }

  const messageLength = message.trim().length;

  if (success) {
    return (
      <div role="status" className="border-t border-[var(--line)] pt-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--teal-tint)]">
          <Check className="h-6 w-6 text-[var(--teal)]" strokeWidth={2.5} />
        </span>
        <h3 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-[var(--ink)]">
          Mesajınız bize ulaştı.
        </h3>
        <p className="mt-2 max-w-md text-[var(--ink-soft)]">
          En kısa sürede size dönüş yapacağız. Teşekkür ederiz.
        </p>
        <button
          type="button"
          onClick={resetForm}
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--line)] px-5 py-3 font-display text-sm font-bold tracking-wide text-[var(--ink)] transition-colors hover:border-[var(--teal)] hover:text-[var(--teal)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--teal-ring)]"
        >
          Yeni mesaj gönder
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Konu — seçim formun geri kalanını belirler, o yüzden en başta. */}
      <fieldset>
        <legend className={LABEL_CLASS}>Konu</legend>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((s) => (
            <label key={s} className="cursor-pointer">
              <input
                type="radio"
                name="subject"
                value={s}
                checked={subject === s}
                onChange={() => chooseSubject(s)}
                className="peer sr-only"
              />
              <span className="inline-flex items-center rounded-lg border border-[var(--line)] bg-[var(--doc-ground)] px-3.5 py-2 font-display text-sm font-semibold text-[var(--ink-soft)] transition-colors peer-checked:border-[var(--teal)] peer-checked:bg-[var(--teal)] peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-[var(--teal-ring)] hover:border-[var(--ink-faint)] hover:text-[var(--ink)] peer-checked:hover:text-white">
                {s}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Okul arama — sadece okul konularında */}
      {isSchoolSubject && (
        <div>
          <label htmlFor="school" className={LABEL_CLASS}>
            İlgili okul {OPTIONAL}
          </label>

          {selectedSchool ? (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--teal)] bg-[var(--teal-tint)] px-4 py-3">
              <span className="min-w-0 font-display text-base font-bold text-[var(--ink)]">
                {selectedSchool.name}
                <span className="ml-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                  {selectedSchool.district}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedSchool(null);
                  setSchoolQuery("");
                }}
                className={`${TEXT_ACTION} shrink-0`}
              >
                Değiştir
              </button>
            </div>
          ) : schoolNotInList ? (
            <div className="space-y-3">
              <input
                id="school"
                type="text"
                value={schoolQuery}
                onChange={(e) => setSchoolQuery(e.target.value)}
                placeholder="Okulun tam adını yazın"
                className={INPUT_CLASS}
              />
              <button
                type="button"
                onClick={() => {
                  setSchoolNotInList(false);
                  setSchoolQuery("");
                }}
                className={TEXT_ACTION}
              >
                <ArrowLeft className="h-4 w-4" />
                Listeden seç
              </button>
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <input
                id="school"
                type="text"
                value={schoolQuery}
                onChange={(e) => {
                  setSchoolQuery(e.target.value);
                }}
                onFocus={() => {
                  if (visibleSchoolResults.length > 0) setSchoolDropdownOpen(true);
                }}
                placeholder="Okul adıyla arayın"
                autoComplete="off"
                className={`${INPUT_CLASS} pr-10`}
              />
              {schoolLoading && (
                <div className="absolute top-3.5 right-3.5">
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--ink-faint)]" />
                </div>
              )}
              {schoolListOpen && (
                <div className="listbox-down absolute z-10 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--doc-panel)] p-1 shadow-lg">
                  {visibleSchoolResults.map((school) => (
                    <button
                      key={school.id}
                      type="button"
                      onClick={() => {
                        setSelectedSchool(school);
                        setSchoolDropdownOpen(false);
                        setSchoolQuery("");
                      }}
                      className="flex w-full flex-col rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[var(--doc-ground)] focus-visible:bg-[var(--doc-ground)] focus-visible:outline-none"
                    >
                      <span className="font-display text-[15px] font-bold text-[var(--ink)]">
                        {school.name}
                      </span>
                      <span className="mt-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                        {school.district}
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSchoolNotInList(true);
                      setSchoolDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left font-display text-sm font-bold text-[var(--teal)] transition-colors hover:bg-[var(--teal-tint)] focus-visible:bg-[var(--teal-tint)] focus-visible:outline-none ${
                      visibleSchoolResults.length > 0 ? "mt-1 border-t border-[var(--line)] pt-3" : ""
                    }`}
                  >
                    Okulumu listede göremiyorum
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
              {!schoolListOpen && schoolQueryReady && !schoolLoading && visibleSchoolResults.length === 0 && (
                <button
                  type="button"
                  onClick={() => setSchoolNotInList(true)}
                  className={`${TEXT_ACTION} mt-3`}
                >
                  Okulumu listede göremiyorum
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Ad Soyad + E-posta + Telefon: geniş ekranda tek satır */}
      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
        <div>
          <label htmlFor="name" className={LABEL_CLASS}>
            Ad Soyad
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adınız Soyadınız"
            autoComplete="name"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="email" className={LABEL_CLASS}>
            E-posta
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@mail.com"
            autoComplete="email"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="phone" className={LABEL_CLASS}>
            Telefon {OPTIONAL}
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05XX XXX XX XX"
            autoComplete="tel"
            className={`${INPUT_CLASS} tabular`}
          />
        </div>
      </div>

      {/* Mesaj */}
      <div>
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor="message" className={LABEL_CLASS}>
            Mesajınız
          </label>
          <span
            aria-live="polite"
            className={`tabular mb-2 font-mono text-[11px] font-medium tracking-[0.08em] ${
              messageLength < MIN_MESSAGE ? "text-[var(--ink-faint)]" : "text-[var(--teal)]"
            }`}
          >
            {messageLength < MIN_MESSAGE
              ? `${messageLength} / ${MIN_MESSAGE}`
              : `${messageLength} karakter`}
          </span>
        </div>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Mesajınızı buraya yazın (en az 20 karakter)"
          className={`${INPUT_CLASS} resize-y leading-relaxed`}
        />
      </div>

      {/* Sunucu hatası — landing kuralı: satır içi mono hata, vermilyon koyu. */}
      {serverError && (
        <p role="alert" className="font-mono text-[12px] font-semibold text-[var(--vermilion-deep)]">
          {serverError}
        </p>
      )}

      {/* Submit — KVKK: aydınlatma bilgi toplanırken yapılır; ayrıntı /gizlilik'te. */}
      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[46ch] text-sm leading-relaxed text-[var(--ink-faint)]">
          Bilgilerinizi yalnızca mesajınızı yanıtlamak ve bildirdiğiniz düzeltmeyi
          yapmak için kullanır, en geç 1 yıl içinde sileriz. Ayrıntılar:{" "}
          <Link
            href="/gizlilik"
            className="font-semibold text-[var(--teal)] underline decoration-1 underline-offset-[3px] hover:text-[var(--teal-deep)] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--teal-ring)]"
          >
            Gizlilik ve kişisel veriler
          </Link>
        </p>
        <button
          type="submit"
          disabled={!isFormValid() || submitting}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--teal)] px-6 py-3 font-display text-sm font-bold tracking-wide text-white transition-colors hover:bg-[var(--teal-deep)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--teal-ring)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--teal)]"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Gönderiliyor
            </>
          ) : (
            <>
              Mesajı gönder
              <Send className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
