export interface LinkedInTokens {
  access_token: string;
  expires_at: number;
  refresh_token?: string;
  refresh_token_expires_at?: number;
}

export interface LinkedInLocale {
  country: string;
  language: string;
}

export interface LinkedInLocalizedField {
  localized: Record<string, string>;
  preferredLocale: LinkedInLocale;
}

export interface LinkedInProfile {
  id: string;
  firstName: LinkedInLocalizedField;
  lastName: LinkedInLocalizedField;
  headline?: LinkedInLocalizedField;
  vanityName?: string;
}

export interface MonthYear {
  month: number;
  year: number;
}

export interface Position {
  id?: string;
  title: string;
  companyName: string;
  description?: string;
  startMonthYear: MonthYear;
  endMonthYear?: MonthYear;
  isCurrent?: boolean;
  location?: string;
}

export interface Education {
  id?: string;
  schoolName: string;
  degreeName?: string;
  fieldOfStudy?: string;
  startMonthYear?: MonthYear;
  endMonthYear?: MonthYear;
  description?: string;
  activities?: string;
}

export interface Skill {
  id?: string;
  name: string;
}
