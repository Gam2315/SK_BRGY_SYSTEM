export const religionOptions = [
  "Roman Catholic",
  "INC",
  "Methodist",
  "Born Again",
  "Other",
] as const;

export const civilStatusOptions = ["Single", "Married"] as const;

export const youthAgeGroupOptions = [
  "Child Youth (15–17 yrs)",
  "Core Youth (18–24 yrs)",
  "Young Adult (25–30 yrs)",
] as const;

export const youthClassificationOptions = [
  "In-School Youth",
  "Working Youth",
  "Out-of-School Youth (OSY)",
] as const;

export const workStatusOptions = [
  "Employed",
  "Self-Employed",
  "Unemployed",
] as const;

export const educationalAttainmentOptions = [
  "Elementary Graduate",
  "Highschool Graduate",
  "SHS Graduate",
  "College Graduate",
  "Doctorate Graduate",
] as const;

export const registeredVoterOptions = ["Yes", "No"] as const;

export type Religion = (typeof religionOptions)[number];
export type CivilStatus = (typeof civilStatusOptions)[number];
export type YouthAgeGroup = (typeof youthAgeGroupOptions)[number];
export type YouthClassification = (typeof youthClassificationOptions)[number];
export type WorkStatus = (typeof workStatusOptions)[number];
export type EducationalAttainment =
  (typeof educationalAttainmentOptions)[number];
export type RegisteredVoter = (typeof registeredVoterOptions)[number];
