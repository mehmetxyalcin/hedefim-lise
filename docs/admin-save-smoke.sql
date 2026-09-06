-- Run inside BEGIN/ROLLBACK after loading the migration; never commit fixtures.
-- Uses a reserved negative ID and an existing admin identity only inside this transaction.
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '20s';
SELECT set_config('request.jwt.claim.sub', (SELECT id::text FROM public.profiles WHERE role='admin' ORDER BY id LIMIT 1), true);
INSERT INTO public.schools(id,institution_code,name,slug,type,district,is_active,percentile)
VALUES(-20260906,'CODEX-SMOKE-20260906','Geçici doğrulama','codex-smoke-20260906','Anadolu Lisesi','Toroslar',false,'0');
SET LOCAL ROLE authenticated;
DO $$
DECLARE result jsonb; fid uuid; field_name text; branch_name text; caught boolean := false;
BEGIN
  result := public.admin_import_school('basic', '[{"institution_code":"CODEX-SMOKE-NEW-20260906","name":"Geçici Yeni Okul","district":"Toroslar","school_type":"Anadolu Lisesi"}]');
  IF result->>'operation' <> 'added' OR NOT EXISTS(SELECT 1 FROM public.schools WHERE institution_code='CODEX-SMOKE-NEW-20260906' AND is_active=false AND features='[]'::jsonb) THEN RAISE EXCEPTION 'New school failed'; END IF;
  result := public.admin_import_school('basic','[{"institution_code":"CODEX-SMOKE-20260906","name":"Doğrulandı","sinavli_2026":0}]');
  IF result->>'operation' <> 'updated' THEN RAISE EXCEPTION 'Basic update failed'; END IF;
  PERFORM public.admin_import_school('scores','[{"institution_code":"CODEX-SMOKE-20260906","obp_2025":90,"lgs_2025":450}]');
  BEGIN
    PERFORM public.admin_import_school('scores','[{"institution_code":"CODEX-SMOKE-20260906","obp_2025":91,"lgs_2024":999}]');
  EXCEPTION WHEN invalid_parameter_value THEN caught := true;
  END;
  IF NOT caught OR (SELECT obp_score FROM public.school_scores WHERE school_id=-20260906 AND year=2025) <> 90 THEN RAISE EXCEPTION 'Score rollback failed'; END IF;
  SELECT id INTO STRICT fid FROM public.facilities ORDER BY id LIMIT 1;
  PERFORM public.admin_replace_school_relations(-20260906,NULL,NULL,ARRAY[fid]);
  caught := false;
  BEGIN
    PERFORM public.admin_import_school('facilities','[{"institution_code":"CODEX-SMOKE-20260906","facility_names":["CODEX-NONEXISTENT-FACILITY"]}]');
  EXCEPTION WHEN OTHERS THEN caught := true;
  END;
  IF NOT caught OR NOT EXISTS(SELECT 1 FROM public.school_facilities WHERE school_id=-20260906 AND facility_id=fid) THEN RAISE EXCEPTION 'Facility rollback failed'; END IF;
  SELECT f.title,b.name INTO STRICT field_name,branch_name FROM public.vocational_branches b JOIN public.vocational_fields f ON f.id=b.vocational_field_id ORDER BY b.id LIMIT 1;
  PERFORM public.admin_import_school('vocational',jsonb_build_array(jsonb_build_object('institution_code','CODEX-SMOKE-20260906','vocational_field',field_name,'branch',branch_name)));
  IF (SELECT count(*) FROM public.school_vocational_fields WHERE school_id=-20260906) <> 1 OR (SELECT count(*) FROM public.school_vocational_branches WHERE school_id=-20260906) <> 1 THEN RAISE EXCEPTION 'Vocational links failed'; END IF;
  PERFORM public.admin_replace_school_relations(-20260906,'{}',NULL,'{}');
  IF EXISTS(SELECT 1 FROM public.school_vocational_branches WHERE school_id=-20260906) THEN RAISE EXCEPTION 'Branch clear failed'; END IF;
  PERFORM set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000099',true);
  caught := false;
  BEGIN
    PERFORM public.admin_import_school('basic','[{"institution_code":"CODEX-SMOKE-20260906","name":"Yetkisiz"}]');
  EXCEPTION WHEN insufficient_privilege THEN caught := true;
  END;
  IF NOT caught THEN RAISE EXCEPTION 'Unauthorized RPC accepted'; END IF;
  UPDATE public.schools SET name='Yetkisiz' WHERE id=-20260906;
  IF FOUND THEN RAISE EXCEPTION 'Unauthorized table update accepted'; END IF;
END $$;
RESET ROLE;
SELECT 'all_live_smoke_checks_passed' AS result;
