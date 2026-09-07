import type { SchoolScoreRaw } from '@/types/school';

export type ScoreCriteria = {
  year: number | null;
  fieldId?: number | null;
  percentile?: readonly [number, number] | null;
  obp?: readonly [number, number] | null;
  sort?: string;
};
export function validScore(value: number | null, maximum = 100): value is number {
  return value != null && Number.isFinite(value) && value >= 0 && value <= maximum;
}
export function matchesProgram(score: SchoolScoreRaw, criteria: ScoreCriteria) {
  return score.year === criteria.year &&
    (criteria.fieldId == null || score.vocational_field_id === criteria.fieldId) &&
    (!criteria.percentile || (validScore(score.percentile) && score.percentile >= criteria.percentile[0] && score.percentile <= criteria.percentile[1])) &&
    (!criteria.obp || (validScore(score.obp_score) && score.obp_score >= criteria.obp[0] && score.obp_score <= criteria.obp[1]));
}
export function scoreMetric(sort = ''): 'obp_score' | 'percentile' | 'lgs_score' | null {
  return sort.startsWith('obp_') ? 'obp_score' : sort.startsWith('yuzdelik_') ? 'percentile' : sort.startsWith('lgs_') ? 'lgs_score' : null;
}
export function comparePrograms(a: SchoolScoreRaw, b: SchoolScoreRaw, sort = '') {
  const metric = scoreMetric(sort);
  if (metric) {
    const maximum = metric === 'lgs_score' ? 500 : 100;
    const av = validScore(a[metric], maximum) ? a[metric] : null;
    const bv = validScore(b[metric], maximum) ? b[metric] : null;
    if (av === null && bv !== null) return 1;
    if (bv === null && av !== null) return -1;
    if (av !== null && bv !== null && av !== bv) return sort.endsWith('_desc') ? bv - av : av - bv;
  }
  return (a.vocational_field_id ?? 0) - (b.vocational_field_id ?? 0) || a.id.localeCompare(b.id);
}
export function matchingPrograms(scores: SchoolScoreRaw[], criteria: ScoreCriteria) {
  return scores.filter(score => matchesProgram(score, criteria)).sort((a,b) => comparePrograms(a,b,criteria.sort));
}
export function rankingValue(scores: SchoolScoreRaw[], criteria: ScoreCriteria): number | null {
  const metric = scoreMetric(criteria.sort);
  const first = matchingPrograms(scores,criteria)[0];
  return metric && first && validScore(first[metric], metric === 'lgs_score' ? 500 : 100) ? first[metric] : null;
}
export type ScorePoint = { value: number; schoolId: number; district: string; schoolType: string };
export function countMatchingSchools(points: ScorePoint[], low: number, high: number, district = '', schoolType = '') {
  return new Set(points.filter(p => p.value >= low && p.value <= high && (!district || p.district === district) && (!schoolType || p.schoolType === schoolType)).map(p => p.schoolId)).size;
}
