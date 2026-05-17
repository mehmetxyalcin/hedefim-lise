export type Facility = {
  id: string;
  name: string;
  icon: string | null;
  isDefault: boolean;
};

export type VocationalBranch = {
  id: string;
  vocationalFieldId: number;
  name: string;
};

export type SchoolQuota = {
  id: string;
  schoolId: number;
  year: number;
  sinavliCount: number | null;
  sinavsizCount: number | null;
};

export type SchoolScore = {
  id: string;
  schoolId: number;
  year: number;
  obpScore: number | null;
  lgsScore: number | null;
  percentile: number | null;
  vocationalFieldId: number | null;
  vocationalField?: { id: number; name: string } | null;
};

export type SchoolScholarship = {
  id: string;
  schoolId: number;
  title: string;
  description: string | null;
  amountInfo: string | null;
  orderIndex: number;
};

export type SchoolProject = {
  id: string;
  schoolId: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  orderIndex: number;
};

export type VocationalFieldWithBranches = {
  id: number;
  title: string;
  slug: string;
  selectedBranches: VocationalBranch[];
};

export type SchoolWithDetails = {
  id: number;
  name: string;
  slug: string;
  type: string;
  district: string;
  description: string;
  images: string[];
  address: string | null;
  phone: string | null;
  website: string | null;
  placementType: string;
  educationType: string;
  boardingType: string;
  transportationInfo: string | null;
  schoolHoursStart: string | null;
  schoolHoursEnd: string | null;
  schoolHoursNote: string | null;
  otherInfo: string | null;
  // mevcut alanlar (korunuyor)
  percentile: string;
  logo: string;
  color: string;
  languages: string[];
  features: string[];
  projects: string[];
  // ilişkili veriler
  facilities: Facility[];
  scores: SchoolScore[];
  quotas: SchoolQuota[];
  scholarships: SchoolScholarship[];
  schoolProjects: SchoolProject[];
  vocationalFieldsWithBranches: VocationalFieldWithBranches[];
  institutionCode?: string | null;
};
