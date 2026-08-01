"use client";

import { useState, useEffect, useRef } from "react";
import { Send, CheckCircle, Loader2 } from "lucide-react";
import { sendContactMessage } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { buildTurkishNameRegex } from "@/lib/turkishSearch";
import { Button } from "@/components/ui/Button";

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

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-slate-700";

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

  // Okul arama debounce
  useEffect(() => {
    if (!isSchoolSubject || selectedSchool || schoolNotInList) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (schoolQuery.trim().length < 2) {
      setSchoolResults([]);
      setSchoolDropdownOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSchoolLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("schools")
        .select("id, name, district")
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
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) return false;
    if (message.trim().length < 20) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return false;
    return true;
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

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Mesajınız Gönderildi!</h2>
          <p className="mt-2 text-sm text-slate-500">
            En kısa sürede size dönüş yapacağız. Teşekkür ederiz.
          </p>
        </div>
        <Button onClick={resetForm} size="lg" className="mt-2">
          Yeni Mesaj Gönder
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Ad Soyad + E-posta */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={LABEL_CLASS}>
            Ad Soyad <span className="text-red-500">*</span>
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
            E-posta <span className="text-red-500">*</span>
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
      </div>

      {/* Telefon */}
      <div>
        <label htmlFor="phone" className={LABEL_CLASS}>
          Telefon
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="05XX XXX XX XX"
          autoComplete="tel"
          className={INPUT_CLASS}
        />
      </div>

      {/* Konu */}
      <div>
        <label htmlFor="subject" className={LABEL_CLASS}>
          Konu <span className="text-red-500">*</span>
        </label>
        <select
          id="subject"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            setSelectedSchool(null);
            setSchoolQuery("");
            setSchoolNotInList(false);
            setSchoolResults([]);
            setSchoolDropdownOpen(false);
          }}
          className={INPUT_CLASS}
        >
          <option value="">Konu seçiniz...</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Okul arama — sadece okul konularında */}
      {isSchoolSubject && (
        <div>
          <label className={LABEL_CLASS}>İlgili Okul</label>

          {selectedSchool ? (
            <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <span className="text-sm font-medium text-blue-800">
                {selectedSchool.name}
                <span className="ml-1.5 font-normal text-blue-600">({selectedSchool.district})</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedSchool(null);
                  setSchoolQuery("");
                }}
                className="ml-4 text-xs font-semibold text-blue-500 hover:text-blue-700"
              >
                Değiştir
              </button>
            </div>
          ) : schoolNotInList ? (
            <div className="space-y-2">
              <input
                type="text"
                value={schoolQuery}
                onChange={(e) => setSchoolQuery(e.target.value)}
                placeholder="Okul adını yazın (listede olmayan)"
                className={INPUT_CLASS}
              />
              <button
                type="button"
                onClick={() => {
                  setSchoolNotInList(false);
                  setSchoolQuery("");
                }}
                className="text-xs font-semibold text-blue-500 hover:text-blue-700"
              >
                ← Listeden seç
              </button>
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <input
                type="text"
                value={schoolQuery}
                onChange={(e) => {
                  setSchoolQuery(e.target.value);
                }}
                onFocus={() => {
                  if (schoolResults.length > 0) setSchoolDropdownOpen(true);
                }}
                placeholder="Okul adı ile arayın..."
                className={INPUT_CLASS}
              />
              {schoolLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                </div>
              )}
              {schoolDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
                  {schoolResults.map((school) => (
                    <button
                      key={school.id}
                      type="button"
                      onClick={() => {
                        setSelectedSchool(school);
                        setSchoolDropdownOpen(false);
                        setSchoolQuery("");
                      }}
                      className="flex w-full flex-col px-4 py-3 text-left text-sm hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl"
                    >
                      <span className="font-medium text-slate-900">{school.name}</span>
                      <span className="text-xs text-slate-500">{school.district}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSchoolNotInList(true);
                      setSchoolDropdownOpen(false);
                    }}
                    className="flex w-full items-center px-4 py-3 text-left text-sm font-medium text-blue-600 hover:bg-blue-50 last:rounded-b-xl"
                  >
                    Okulumu listede göremiyorum
                  </button>
                </div>
              )}
              {!schoolDropdownOpen && schoolQuery.length >= 2 && !schoolLoading && schoolResults.length === 0 && (
                <button
                  type="button"
                  onClick={() => setSchoolNotInList(true)}
                  className="mt-1.5 text-xs font-semibold text-blue-500 hover:text-blue-700"
                >
                  Okulumu listede göremiyorum →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mesaj */}
      <div>
        <label htmlFor="message" className={LABEL_CLASS}>
          Mesajınız <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Mesajınızı buraya yazın... (en az 20 karakter)"
            className={`${INPUT_CLASS} resize-none pb-7`}
          />
          <span
            className={`absolute bottom-2.5 right-3 text-xs ${
              message.length < 20 ? "text-slate-400" : "text-emerald-600"
            }`}
          >
            {message.length} karakter
          </span>
        </div>
      </div>

      {/* Sunucu hatası */}
      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {serverError}
        </div>
      )}

      {/* Submit */}
      <Button type="submit" size="lg" disabled={!isFormValid() || submitting}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Gönderiliyor...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Mesaj Gönder
          </>
        )}
      </Button>
    </form>
  );
}
