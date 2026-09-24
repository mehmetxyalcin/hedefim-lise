import { DISTRICTS } from '@/data/districts';
import { SCHOOL_TYPES } from '@/data/schoolTypes';
import { SCHOOL_PROGRAMS } from '@/lib/school-programs';

export type FieldRule = {
  label: string;
  required?: boolean;
  multiple?: boolean;
  kind?: 'number' | 'integer' | 'uuid' | 'url' | 'link' | 'email' | 'phone' | 'time' | 'file';
  min?: number;
  max?: number;
  choices?: readonly string[];
};
export type FormRules = Record<string, FieldRule>;
const text = (label: string, required = false, max = 50000): FieldRule => ({ label, required, max });
const integer = (label: string, required = true, min = 1, max = Number.MAX_SAFE_INTEGER): FieldRule => ({ label, required, kind: 'integer', min, max });
const number = (label: string, max: number): FieldRule => ({ label, kind: 'number', min: 0, max });
const uuid = (label: string, required = true): FieldRule => ({ label, required, kind: 'uuid' });
const choice = (label: string, choices: readonly string[], required = false): FieldRule => ({ label, choices, required });
const url = (label: string): FieldRule => ({ label, kind: 'url', max: 2048 });
const upload: FieldRule = { label: 'Görsel', kind: 'file', max: 5 * 1024 * 1024 };
const schoolId = { school_id: integer('Okul') };
const child = { ...schoolId, id: uuid('Kayıt') };
const contact: FormRules = {
  address: text('Adres'), phone: { label: 'Telefon', kind: 'phone' },
  website: url('Web sitesi'), transportation_info: text('Ulaşım bilgisi'),
};
const basic: FormRules = {
  name: text('Okul adı', true, 300), slug: text('Slug', true, 300),
  type: choice('Okul türü', SCHOOL_TYPES, true), district: choice('İlçe', DISTRICTS, true),
  logo: text('Logo / kısa kod', true, 100), color: text('Renk sınıfı', true, 300),
  description: text('Açıklama', true), institution_code: integer('Kurum kodu', false),
  placement_type: choice('Yerleştirme türü', ['yerel', 'merkezi', 'yerel_merkezi']),
  education_type: choice('Eğitim şekli', ['normal', 'ikili']),
  boarding_type: choice('Pansiyon', ['yok', 'kiz', 'erkek', 'kiz_erkek']),
  programs: { ...choice('Program', SCHOOL_PROGRAMS), multiple: true },
  school_hours_start: { label: 'Başlangıç saati', kind: 'time' },
  school_hours_end: { label: 'Bitiş saati', kind: 'time' },
  school_hours_note: text('Saat açıklaması'), features: text('Özellikler'), languages: text('Diller'),
  image_file: upload, current_image: url('Mevcut görsel'),
  is_active: choice('Yayın durumu', ['on']), remove_image: choice('Görseli kaldır', ['on']),
};
const named = { name: text('Ad', true, 300) };
const scholarship = { ...schoolId, title: text('Burs başlığı', true, 300), description: text('Açıklama'), amount_info: text('Burs tutarı', false, 1000) };
const project = { ...schoolId, title: text('Proje başlığı', true, 300), description: text('Açıklama'), link_url: url('Proje bağlantısı'), image_file: upload };
const reorder = { ...child, direction: choice('Sıralama yönü', ['up', 'down'], true) };

export const schoolFormRules: Record<string, FormRules> = {
  createSchool: { ...basic, ...contact, projects: text('Projeler'), other_info: text('Diğer bilgiler'), vocational_field_ids: { ...integer('Meslek alanı'), required: false, multiple: true } },
  updateSchool: { ...basic, id: integer('Okul') },
  deleteSchool: { id: integer('Okul') },
  toggleSchoolStatus: { id: integer('Okul'), is_active: choice('Yayın durumu', ['true', 'false'], true) },
  bulkUpdateSchoolStatus: { ids: { ...integer('Okul'), multiple: true }, is_active: choice('Yayın durumu', ['true', 'false'], true) },
  updateSchoolContact: { ...schoolId, ...contact },
  updateSchoolOtherInfo: { ...schoolId, other_info: text('Diğer bilgiler') },
  upsertSchoolScore: { ...schoolId, year: integer('Yıl', true, 2000, 2100), id: uuid('Puan kaydı', false), scope: text('Puan kapsamı', false, 100), obp_score: number('OBP', 100), lgs_score: number('LGS', 500), percentile: number('Yüzdelik', 100) },
  deleteSchoolScore: child,
  upsertSchoolQuota: { ...schoolId, year: integer('Yıl', true, 2000, 2100), id: uuid('Kontenjan kaydı', false), sinavli_count: integer('Sınavlı kontenjan', false, 0, 100000), sinavsiz_count: integer('Sınavsız kontenjan', false, 0, 100000) },
  deleteSchoolQuota: child,
  syncSchoolFacilities: { ...schoolId, facility_ids: { ...uuid('Tesis', false), multiple: true } },
  addSchoolFacility: named,
  syncSchoolVocationalFull: { ...schoolId, vocational_field_ids: { ...integer('Meslek alanı', false), multiple: true }, branch_ids: { ...uuid('Dal', false), multiple: true } },
  addVocationalBranch: { ...named, vocational_field_id: integer('Meslek alanı') },
  addSchoolScholarship: scholarship, updateSchoolScholarship: { ...scholarship, id: uuid('Burs kaydı') },
  deleteSchoolScholarship: child, reorderSchoolScholarship: reorder,
  addSchoolProject: project, updateSchoolProject: { ...project, id: uuid('Proje kaydı') },
  deleteSchoolProject: child, reorderSchoolProject: reorder,
};

// Accept only explicit public web addresses; navigation also allows local paths,
// fragments and contact links. Never accept protocol-relative or executable URLs.
export function isSafeLink(value: string, navigation = false): boolean {
  if (/[\u0000-\u0020\u007f\\]/.test(value)) return false;
  if (navigation && ((value.startsWith('/') && !value.startsWith('//')) || value.startsWith('#'))) return true;
  if (navigation && /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value)) return true;
  if (navigation && /^tel:\+?[\d().-]+$/i.test(value)) return true;
  try {
    const parsed = new URL(value);
    return /^https?:\/\//i.test(value) && ['http:', 'https:'].includes(parsed.protocol) && !!parsed.hostname && !parsed.username && !parsed.password;
  } catch { return false; }
}

export function validateAdminForm(form: FormData, rules: FormRules): string | null {
  for (const [key, rule] of Object.entries(rules)) {
    const values = form.getAll(key);
    if (!rule.multiple && values.length > 1) return `${rule.label} birden fazla gönderilemez.`;
    if (rule.required && !values.length) return `${rule.label} zorunludur.`;
    for (const raw of values) {
      if (rule.kind === 'file') {
        if (typeof raw === 'string') return `${rule.label} bir dosya olmalıdır.`;
        if (!raw.size) continue;
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'].includes(raw.type)) return `${rule.label} desteklenen bir görsel dosyası olmalıdır.`;
        if (raw.size > (rule.max ?? 0)) return `${rule.label} en fazla ${(rule.max ?? 0) / 1024 / 1024} MB olabilir.`;
        continue;
      }
      if (typeof raw !== 'string') return `${rule.label} metin olmalıdır.`;
      const value = raw.trim();
      if (!value) {
        if (rule.required || rule.multiple || rule.choices) return `${rule.label} boş olamaz.`;
        continue;
      }
      if (rule.choices && !rule.choices.includes(raw)) return `${rule.label} için listeden geçerli bir seçenek seçin.`;
      if (rule.kind === 'number') {
        const numeric = value.replace(',', '.');
        if (!/^\d+(?:\.\d+)?$/.test(numeric) || !Number.isFinite(Number(numeric)) || Number(numeric) < (rule.min ?? 0) || Number(numeric) > (rule.max ?? 100)) return `${rule.label} ${rule.min ?? 0}–${rule.max ?? 100} arasında bir sayı olmalıdır.`;
      } else if (rule.kind === 'integer') {
        const number = Number(value);
        if (!/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < (rule.min ?? 0) || number > (rule.max ?? Number.MAX_SAFE_INTEGER)) return `${rule.label} ${rule.min ?? 0}–${rule.max ?? Number.MAX_SAFE_INTEGER} arasında bir tam sayı olmalıdır.`;
      } else if (value.length > (rule.max ?? 50000)) return `${rule.label} en fazla ${rule.max ?? 50000} karakter olabilir.`;
      if (rule.kind === 'uuid' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return `${rule.label} geçersiz; sayfayı yenileyip tekrar deneyin.`;
      if ((rule.kind === 'url' || rule.kind === 'link') && !isSafeLink(value, rule.kind === 'link')) return `${rule.label} geçerli bir ${rule.kind === 'url' ? 'http:// veya https:// adresi' : 'site yolu veya bağlantı'} olmalıdır.`;
      if (rule.kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `${rule.label} geçerli bir e-posta adresi olmalıdır.`;
      if (rule.kind === 'phone' && (!/^[+\d\s().-]+$/.test(value) || value.replace(/\D/g, '').length < 7 || value.replace(/\D/g, '').length > 15)) return `${rule.label} 7–15 rakam içeren geçerli bir telefon numarası olmalıdır.`;
      if (rule.kind === 'time' && !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value)) return `${rule.label} geçerli bir saat olmalıdır (ör. 08:30).`;
    }
  }
  return null;
}

const link = { ...text('Bağlantı', true, 2048), kind: 'link' as const };
const navigation = { label: text('Etiket', true, 300), href: link, target: choice('Açılma şekli', ['_self', '_blank']) };
const faq = { question: text('Soru', true, 3000), answer: text('Yanıt', true), category: text('Kategori', true, 300), sort_order: integer('Sıra', false, 0, 2147483647), source_page: integer('Kaynak sayfa', false, 1, 2147483647), is_published: choice('Yayın durumu', ['on']) };
const blogPost: FormRules = {
  id: uuid('Kayıt', false), title: text('Başlık', true, 200), slug: text('Adres (slug)', false, 120),
  excerpt: text('Özet', true, 300), body: text('Yazı metni', true, 100000), category: text('Kategori', true, 60),
  highlight: text('Kapak vurgusu', false, 24),
  cover_file: { ...upload, label: 'Kapak görseli' }, current_cover: url('Mevcut kapak'), cover_image_alt: text('Kapak açıklaması', false, 300),
  remove_cover: choice('Kapağı kaldır', ['on']), status: choice('Yayın durumu', ['taslak', 'yayinda'], true),
  published_at: text('Yayın tarihi', false, 16), author_id: uuid('Yazar', false),
};
const blogAuthor: FormRules = {
  id: uuid('Kayıt', false), name: text('Ad soyad', true, 120), slug: text('Adres (slug)', false, 120),
  title: text('Unvan', false, 160), bio: text('Hakkında', false, 5000),
  photo_file: { ...upload, label: 'Fotoğraf' }, current_photo: url('Mevcut fotoğraf'), remove_photo: choice('Fotoğrafı kaldır', ['on']),
  email: { label: 'E-posta', kind: 'email', max: 254 }, phone: { label: 'Telefon', kind: 'phone' },
  website_url: url('Web sitesi'), instagram_url: url('Instagram'), x_url: url('X'), linkedin_url: url('LinkedIn'), youtube_url: url('YouTube'),
};
export const contentFormRules: Record<string, FormRules> = {
  saveBlogPost: blogPost, deleteBlogPost: { id: uuid('Kayıt') },
  saveBlogAuthor: blogAuthor, deleteBlogAuthor: { id: uuid('Kayıt') },
  createFaq: faq, updateFaq: { ...faq, id: uuid('Kayıt') }, deleteFaq: { id: uuid('Kayıt') },
  updateSiteSettings: { site_title: text('Site başlığı', true, 300), logo_alt: text('Logo alt metni', true, 300), current_logo_url: url('Logo adresi'), logo_file: { ...upload, max: 2 * 1024 * 1024 } },
  createNavigationItem: navigation, updateNavigationItem: { ...navigation, id: uuid('Kayıt'), is_visible: choice('Görünürlük', ['on']) },
  deleteNavigationItem: { id: uuid('Kayıt') }, moveNavigationItem: { id: uuid('Kayıt'), direction: reorder.direction },
  toggleNavigationItemVisibility: { id: uuid('Kayıt'), is_visible: choice('Görünürlük', ['true', 'false'], true) },
  updateFooterSettings: { copyright_text: text('Telif hakkı metni', true, 1000), about_text: text('Hakkında'), contact_email: { label: 'E-posta', kind: 'email', max: 254 }, contact_phone: { label: 'Telefon', kind: 'phone' }, address: text('Adres') },
  updateFooterSectionTitle: { partners_title: text('Bölüm başlığı', true, 300) },
  createFooterLink: { section_title: text('Bölüm adı', true, 300), label: navigation.label, href: link },
  deleteFooterLink: { id: uuid('Kayıt') }, createSocialLink: { platform: text('Platform', true, 100), url: { ...url('Sosyal medya adresi'), required: true } }, deleteSocialLink: { id: uuid('Kayıt') },
};

export function validateAdminValues(values: Record<string, unknown>, rules: FormRules): string | null {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (typeof value !== 'string') return `${rules[key]?.label ?? 'Değer'} metin olmalıdır.`;
    form.set(key, value);
  }
  return validateAdminForm(form, rules);
}
export const managementRules = {
  field: { id: integer('Meslek alanı'), ...named },
  branch: { id: uuid('Dal'), ...named },
  newBranch: { vocationalFieldId: integer('Meslek alanı'), ...named },
  message: { id: uuid('Mesaj'), status: choice('Mesaj durumu', ['read', 'replied'], true) },
};
