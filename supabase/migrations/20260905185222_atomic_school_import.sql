-- Replacements also serve the individual school form. NULL means preserve;
-- an empty array means clear. This works for schools without institution codes.
CREATE OR REPLACE FUNCTION public.admin_replace_school_relations(
  p_school_id bigint,
  p_field_ids integer[] DEFAULT NULL,
  p_branch_ids uuid[] DEFAULT NULL,
  p_facility_ids uuid[] DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  affected integer;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Yönetici yetkisi gerekli.' USING ERRCODE = '42501';
  END IF;
  PERFORM 1 FROM public.schools WHERE id = p_school_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Okul bulunamadı.' USING ERRCODE = 'P0002'; END IF;
  IF p_field_ids IS NOT NULL THEN
    SELECT array_agg(DISTINCT id) INTO p_field_ids FROM unnest(p_field_ids) AS t(id);
    p_field_ids := coalesce(p_field_ids, '{}');
    IF (SELECT count(*) FROM public.vocational_fields WHERE id = ANY(p_field_ids)) <> cardinality(p_field_ids) THEN
      RAISE EXCEPTION 'Geçersiz meslek alanı.' USING ERRCODE = '22023';
    END IF;
  END IF;
  IF p_branch_ids IS NOT NULL THEN
    SELECT array_agg(DISTINCT id) INTO p_branch_ids FROM unnest(p_branch_ids) AS t(id);
    p_branch_ids := coalesce(p_branch_ids, '{}');
    IF (SELECT count(*) FROM public.vocational_branches WHERE id = ANY(p_branch_ids)) <> cardinality(p_branch_ids) OR EXISTS (
      SELECT 1 FROM public.vocational_branches b WHERE b.id = ANY(p_branch_ids)
      AND NOT (b.vocational_field_id = ANY(coalesce(p_field_ids, ARRAY(SELECT vocational_field_id FROM public.school_vocational_fields WHERE school_id = p_school_id))))
    ) THEN RAISE EXCEPTION 'Seçilen dal okulun meslek alanlarına bağlı değil.' USING ERRCODE = '22023'; END IF;
  END IF;
  IF p_facility_ids IS NOT NULL THEN
    SELECT array_agg(DISTINCT id) INTO p_facility_ids FROM unnest(p_facility_ids) AS t(id);
    p_facility_ids := coalesce(p_facility_ids, '{}');
    IF (SELECT count(*) FROM public.facilities WHERE id = ANY(p_facility_ids)) <> cardinality(p_facility_ids) THEN
      RAISE EXCEPTION 'Geçersiz tesis.' USING ERRCODE = '22023';
    END IF;
    DELETE FROM public.school_facilities WHERE school_id = p_school_id;
    IF EXISTS (SELECT 1 FROM public.school_facilities WHERE school_id = p_school_id) THEN RAISE EXCEPTION 'Tesis ilişkileri değiştirilemedi.' USING ERRCODE = '42501'; END IF;
    INSERT INTO public.school_facilities(school_id, facility_id) SELECT p_school_id, unnest(p_facility_ids);
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> cardinality(p_facility_ids) THEN RAISE EXCEPTION 'Tesis ilişkileri kaydedilemedi.'; END IF;
  END IF;
  -- Remove branches first to avoid leaving a branch attached to an absent field.
  IF p_branch_ids IS NOT NULL OR p_field_ids IS NOT NULL THEN
    DELETE FROM public.school_vocational_branches WHERE school_id = p_school_id AND (
      p_branch_ids IS NOT NULL OR branch_id IN (
        SELECT id FROM public.vocational_branches WHERE NOT(vocational_field_id = ANY(p_field_ids))
      )
    );
    IF EXISTS (
      SELECT 1 FROM public.school_vocational_branches sb
      JOIN public.vocational_branches b ON b.id = sb.branch_id
      WHERE sb.school_id = p_school_id AND
        (p_branch_ids IS NOT NULL OR NOT(b.vocational_field_id = ANY(p_field_ids)))
    ) THEN
      RAISE EXCEPTION 'Dal ilişkileri değiştirilemedi.' USING ERRCODE = '42501';
    END IF;
  END IF;
  IF p_field_ids IS NOT NULL THEN
    DELETE FROM public.school_vocational_fields WHERE school_id = p_school_id;
    IF EXISTS (SELECT 1 FROM public.school_vocational_fields WHERE school_id = p_school_id) THEN RAISE EXCEPTION 'Meslek alanları değiştirilemedi.' USING ERRCODE = '42501'; END IF;
    INSERT INTO public.school_vocational_fields(school_id, vocational_field_id) SELECT p_school_id, unnest(p_field_ids);
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> cardinality(p_field_ids) THEN RAISE EXCEPTION 'Meslek alanları kaydedilemedi.'; END IF;
  END IF;
  IF p_branch_ids IS NOT NULL THEN
    INSERT INTO public.school_vocational_branches(school_id, branch_id) SELECT p_school_id, unnest(p_branch_ids);
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> cardinality(p_branch_ids) THEN RAISE EXCEPTION 'Dal ilişkileri kaydedilemedi.'; END IF;
  END IF;
  UPDATE public.schools SET updated_at = now() WHERE id = p_school_id;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 1 THEN RAISE EXCEPTION 'Okul güncellenemedi.' USING ERRCODE = '42501'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_replace_school_relations(bigint, integer[], uuid[], uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_replace_school_relations(bigint, integer[], uuid[], uuid[]) TO authenticated;

-- Apply before deploying the caller. Each RPC is one school's transaction.
-- SECURITY INVOKER keeps existing RLS active. No service-role bypass.
CREATE OR REPLACE FUNCTION public.admin_import_school(p_mode text, p_rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  r jsonb;
  item jsonb;
  code text;
  s public.schools%ROWTYPE;
  score public.school_scores%ROWTYPE;
  quota public.school_quotas%ROWTYPE;
  field_id public.vocational_fields.id%TYPE;
  branch_id public.vocational_branches.id%TYPE;
  facility_id public.facilities.id%TYPE;
  field_ids integer[] := '{}';
  branch_ids uuid[] := '{}';
  facility_ids uuid[] := '{}';
  yr integer;
  value numeric;
  k text;
  txt text;
  new_slug text;
  is_new boolean := false;
  changed boolean := false;
  affected integer;
  seen text[] := '{}';
  score_key text;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Yönetici yetkisi gerekli.' USING ERRCODE = '42501';
  END IF;
  IF p_mode IS NULL OR p_mode NOT IN ('basic', 'scores', 'vocational', 'facilities')
     OR jsonb_typeof(p_rows) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Geçersiz yükleme.' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(p_rows) < 1 OR jsonb_array_length(p_rows) > (CASE WHEN p_mode = 'vocational' THEN 2000 ELSE 500 END) THEN
    RAISE EXCEPTION 'Geçersiz satır sayısı.' USING ERRCODE = '22023';
  END IF;
  code := btrim(p_rows->0->>'institution_code');
  IF code IS NULL OR code = '' OR length(code) > 50 THEN
    RAISE EXCEPTION 'Kurum kodu zorunludur.' USING ERRCODE = '22023';
  END IF;
  FOR r IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    IF jsonb_typeof(r) IS DISTINCT FROM 'object' OR btrim(r->>'institution_code') IS DISTINCT FROM code THEN
      RAISE EXCEPTION 'Bir işlem yalnızca bir okulun satırlarını içerebilir.' USING ERRCODE = '22023';
    END IF;
  END LOOP;

  -- Serializes imports of an existing school. The unique institution code
  -- also prevents two concurrent imports creating duplicate schools.
  SELECT * INTO s FROM public.schools WHERE institution_code = code FOR UPDATE;
  IF s.id IS NULL AND p_mode <> 'basic' THEN
    RAISE EXCEPTION 'Okul bulunamadı: %', code USING ERRCODE = 'P0002';
  END IF;

  IF p_mode = 'basic' THEN
    IF jsonb_array_length(p_rows) <> 1 THEN
      RAISE EXCEPTION 'Aynı kurum kodu birden fazla temel bilgi satırında kullanılmış.' USING ERRCODE = '22023';
    END IF;
    r := p_rows->0;
    IF nullif(r->>'education_type', '') IS NOT NULL AND r->>'education_type' NOT IN ('normal', 'ikili') THEN
      RAISE EXCEPTION 'Geçersiz öğretim şekli.' USING ERRCODE = '22023';
    END IF;
    IF nullif(r->>'boarding_type', '') IS NOT NULL AND r->>'boarding_type' NOT IN ('yok', 'kiz', 'erkek', 'kiz_erkek') THEN
      RAISE EXCEPTION 'Geçersiz pansiyon bilgisi.' USING ERRCODE = '22023';
    END IF;
    IF length(r->>'description') > 1000 THEN
      RAISE EXCEPTION 'Açıklama en fazla 1000 karakter olabilir.' USING ERRCODE = '22023';
    END IF;
    IF s.id IS NULL THEN
      IF nullif(btrim(r->>'name'), '') IS NULL OR nullif(btrim(r->>'district'), '') IS NULL OR nullif(btrim(r->>'school_type'), '') IS NULL THEN
        RAISE EXCEPTION 'Yeni okul için ad, ilçe ve tür zorunludur.' USING ERRCODE = '22023';
      END IF;
      -- Case folding occurs before stripping non-ASCII characters.
      -- Explicit Turkish mapping, independent of the database's locale.
      txt := lower(translate(btrim(r->>'name'), 'IİĞÜŞÖÇığüşöç', 'IIGUSOCigusoc'));
      new_slug := trim(both '-' from regexp_replace(txt, '[^a-z0-9]+', '-', 'g'));
      txt := trim(both '-' from regexp_replace(lower(code), '[^a-z0-9]+', '-', 'g'));
      IF txt = '' THEN RAISE EXCEPTION 'Geçersiz kurum kodu.' USING ERRCODE = '22023'; END IF;
      new_slug := coalesce(nullif(new_slug, ''), txt) || '-' || txt;
      INSERT INTO public.schools(name, slug, type, district, institution_code,
        phone, website, address, education_type, boarding_type, percentile,
        logo, color, description, features, projects, languages, images, is_active)
      VALUES (btrim(r->>'name'), new_slug, btrim(r->>'school_type'), btrim(r->>'district'), code,
        nullif(btrim(r->>'phone'), ''), nullif(btrim(r->>'website'), ''), nullif(btrim(r->>'address'), ''),
        coalesce(nullif(r->>'education_type', ''), 'normal'), coalesce(nullif(r->>'boarding_type', ''), 'yok'), '0',
        upper(left(r->>'name', 2)), 'bg-gradient-to-br from-slate-700 to-slate-900',
        coalesce(btrim(r->>'description'), ''), '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, false)
      RETURNING * INTO s;
      is_new := true;
      changed := true;
    ELSE
      -- Empty cells retain stored values; no whole-row replacement.
      IF EXISTS (SELECT 1 FROM jsonb_each_text(r) AS e(key, val)
        WHERE key IN ('name','school_type','district','phone','website','address','education_type','boarding_type','description') AND nullif(btrim(val), '') IS NOT NULL) THEN
        UPDATE public.schools SET
          name = coalesce(nullif(btrim(r->>'name'), ''), name),
          type = coalesce(nullif(btrim(r->>'school_type'), ''), type),
          district = coalesce(nullif(btrim(r->>'district'), ''), district),
          phone = coalesce(nullif(btrim(r->>'phone'), ''), phone),
          website = coalesce(nullif(btrim(r->>'website'), ''), website),
          address = coalesce(nullif(btrim(r->>'address'), ''), address),
          education_type = coalesce(nullif(r->>'education_type', ''), education_type),
          boarding_type = coalesce(nullif(r->>'boarding_type', ''), boarding_type),
          description = coalesce(nullif(btrim(r->>'description'), ''), description),
          updated_at = now()
        WHERE id = s.id;
        GET DIAGNOSTICS affected = ROW_COUNT;
        IF affected <> 1 THEN RAISE EXCEPTION 'Okul güncellenemedi.' USING ERRCODE = '42501'; END IF;
        changed := true;
      END IF;
    END IF;
    FOREACH yr IN ARRAY ARRAY[2026,2025,2024] LOOP
      IF coalesce(r->('sinavli_' || yr), 'null'::jsonb) <> 'null'::jsonb OR coalesce(r->('sinavsiz_' || yr), 'null'::jsonb) <> 'null'::jsonb THEN
        FOREACH k IN ARRAY ARRAY['sinavli_' || yr,'sinavsiz_' || yr] LOOP
          IF coalesce(r->k, 'null'::jsonb) <> 'null'::jsonb THEN
            value := (r->>k)::numeric;
            IF jsonb_typeof(r->k) <> 'number' OR value < 0 OR value <> trunc(value) OR value > 100000 THEN
              RAISE EXCEPTION 'Geçersiz kontenjan: %', k USING ERRCODE = '22023';
            END IF;
          END IF;
        END LOOP;
        SELECT * INTO quota FROM public.school_quotas WHERE school_id = s.id AND year = yr;
        INSERT INTO public.school_quotas(school_id, year, sinavli_count, sinavsiz_count)
        VALUES (s.id, yr, coalesce((r->>('sinavli_' || yr))::integer, quota.sinavli_count),
          coalesce((r->>('sinavsiz_' || yr))::integer, quota.sinavsiz_count))
        ON CONFLICT (school_id, year) DO UPDATE SET sinavli_count = excluded.sinavli_count, sinavsiz_count = excluded.sinavsiz_count;
        GET DIAGNOSTICS affected = ROW_COUNT;
        IF affected <> 1 THEN RAISE EXCEPTION 'Kontenjan kaydedilemedi.' USING ERRCODE = '42501'; END IF;
        changed := true;
      END IF;
    END LOOP;

  ELSIF p_mode = 'scores' THEN
    FOR r IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
      field_id := NULL;
      IF nullif(btrim(r->>'vocational_field'), '') IS NOT NULL THEN
        SELECT id INTO STRICT field_id FROM public.vocational_fields
          WHERE lower(translate(btrim(title), 'Iİ', 'ıi')) = lower(translate(btrim(r->>'vocational_field'), 'Iİ', 'ıi'));
        IF NOT EXISTS (SELECT 1 FROM public.school_vocational_fields WHERE school_id = s.id AND vocational_field_id = field_id) THEN
          RAISE EXCEPTION 'Seçilen meslek alanı bu okula bağlı değil.' USING ERRCODE = '22023';
        END IF;
      END IF;
      FOREACH yr IN ARRAY ARRAY[2025,2024,2023] LOOP
        IF coalesce(r->('obp_' || yr), 'null'::jsonb) = 'null'::jsonb AND coalesce(r->('lgs_' || yr), 'null'::jsonb) = 'null'::jsonb AND coalesce(r->('percentile_' || yr), 'null'::jsonb) = 'null'::jsonb THEN CONTINUE; END IF;
        score_key := yr || ':' || coalesce(field_id::text, 'school');
        IF score_key = ANY(seen) THEN RAISE EXCEPTION 'Aynı yıl ve alan için birden fazla puan satırı var.' USING ERRCODE = '22023'; END IF;
        seen := array_append(seen, score_key);
        FOREACH k IN ARRAY ARRAY['obp_' || yr,'lgs_' || yr,'percentile_' || yr] LOOP
          IF coalesce(r->k, 'null'::jsonb) <> 'null'::jsonb THEN
            value := (r->>k)::numeric;
            IF jsonb_typeof(r->k) <> 'number' OR value < 0 OR value > (CASE WHEN k LIKE 'lgs_%' THEN 500 ELSE 100 END) THEN
              RAISE EXCEPTION 'Puan sınır dışında: %', k USING ERRCODE = '22023';
            END IF;
          END IF;
        END LOOP;
        BEGIN
          SELECT * INTO STRICT score FROM public.school_scores
            WHERE school_id = s.id AND year = yr AND vocational_field_id IS NOT DISTINCT FROM field_id;
        EXCEPTION WHEN no_data_found THEN score := NULL;
        END;
        IF score.id IS NULL THEN
          INSERT INTO public.school_scores(school_id, year, vocational_field_id, obp_score, lgs_score, percentile)
          VALUES(s.id, yr, field_id, (r->>('obp_' || yr))::numeric, (r->>('lgs_' || yr))::numeric, (r->>('percentile_' || yr))::numeric);
        ELSE
          UPDATE public.school_scores SET
            obp_score = coalesce((r->>('obp_' || yr))::numeric, obp_score),
            lgs_score = coalesce((r->>('lgs_' || yr))::numeric, lgs_score),
            percentile = coalesce((r->>('percentile_' || yr))::numeric, percentile)
          WHERE id = score.id;
        END IF;
        GET DIAGNOSTICS affected = ROW_COUNT;
        IF affected <> 1 THEN RAISE EXCEPTION 'Puan kaydedilemedi.' USING ERRCODE = '42501'; END IF;
        changed := true;
      END LOOP;
    END LOOP;

  ELSIF p_mode = 'facilities' THEN
    FOR r IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
      IF jsonb_typeof(r->'facility_names') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Geçersiz tesis listesi.' USING ERRCODE = '22023'; END IF;
      FOR item IN SELECT * FROM jsonb_array_elements(r->'facility_names') LOOP
        IF jsonb_typeof(item) <> 'string' OR nullif(btrim(item #>> '{}'), '') IS NULL THEN RAISE EXCEPTION 'Geçersiz tesis adı.' USING ERRCODE = '22023'; END IF;
        txt := btrim(item #>> '{}');
        SELECT id INTO STRICT facility_id FROM public.facilities
          WHERE lower(translate(btrim(name), 'Iİ', 'ıi')) = lower(translate(txt, 'Iİ', 'ıi'));
        IF NOT facility_id = ANY(facility_ids) THEN facility_ids := array_append(facility_ids, facility_id); END IF;
      END LOOP;
    END LOOP;
    IF cardinality(facility_ids) > 0 THEN
      PERFORM public.admin_replace_school_relations(s.id, NULL, NULL, facility_ids);
      changed := true;
    END IF;

  ELSIF p_mode = 'vocational' THEN
    FOR r IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
      IF nullif(btrim(r->>'vocational_field'), '') IS NULL THEN RAISE EXCEPTION 'Meslek alanı zorunludur.' USING ERRCODE = '22023'; END IF;
      SELECT id INTO STRICT field_id FROM public.vocational_fields
        WHERE lower(translate(btrim(title), 'Iİ', 'ıi')) = lower(translate(btrim(r->>'vocational_field'), 'Iİ', 'ıi'));
      IF NOT field_id = ANY(field_ids) THEN field_ids := array_append(field_ids, field_id); END IF;
      IF nullif(btrim(r->>'branch'), '') IS NOT NULL THEN
        SELECT id INTO STRICT branch_id FROM public.vocational_branches
          WHERE vocational_field_id = field_id AND lower(translate(btrim(name), 'Iİ', 'ıi')) = lower(translate(btrim(r->>'branch'), 'Iİ', 'ıi'));
        IF NOT branch_id = ANY(branch_ids) THEN branch_ids := array_append(branch_ids, branch_id); END IF;
      END IF;
    END LOOP;
    PERFORM public.admin_replace_school_relations(s.id, field_ids, branch_ids, NULL);
    changed := true;
  END IF;

  IF changed THEN
    UPDATE public.schools SET updated_at = now() WHERE id = s.id;
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> 1 THEN RAISE EXCEPTION 'Okul güncellemesi doğrulanamadı.' USING ERRCODE = '42501'; END IF;
  END IF;
  RETURN jsonb_build_object('operation', CASE WHEN is_new THEN 'added' WHEN changed THEN 'updated' ELSE 'skipped' END, 'school_id', s.id, 'slug', s.slug);
EXCEPTION
  WHEN no_data_found THEN RAISE EXCEPTION 'Alan, dal veya tesis adı sistemde bulunamadı; okulun mevcut verileri korundu.' USING ERRCODE = 'P0002';
  WHEN too_many_rows THEN RAISE EXCEPTION 'Birden fazla eşleşen kayıt bulundu; okulun mevcut verileri korundu.' USING ERRCODE = '21000';
END;
$$;

REVOKE ALL ON FUNCTION public.admin_import_school(text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_import_school(text, jsonb) TO authenticated;
