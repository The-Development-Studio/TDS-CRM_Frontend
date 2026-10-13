import { OrganizationProfile } from '../types/crm';

export const ORGANIZATION_PROFILE_STORAGE_KEY = 'tds-crm:v2:organization-profile';
const LEGACY_ORGANIZATION_PROFILE_STORAGE_KEY = 'tds-crm-organization-profile';

export const DEFAULT_ORGANIZATION_PROFILE: OrganizationProfile = {
  legalName: '',
  displayName: '',
  founderName: '',
  founderEmail: '',
  coFounderName: '',
  coFounderEmail: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  gstin: '',
  msmeRegistration: '',
  billingEmail: '',
  phone: '',
  website: '',
  paymentTerms: '',
  bankAccountName: '',
  bankName: '',
  bankAccountNumber: '',
  bankIfsc: '',
  bankBranch: '',
  bankSwift: '',
  upiId: ''
};

export const loadOrganizationProfile = (): OrganizationProfile => {
  try {
    localStorage.removeItem(LEGACY_ORGANIZATION_PROFILE_STORAGE_KEY);
    const storedProfile = localStorage.getItem(ORGANIZATION_PROFILE_STORAGE_KEY);
    if (!storedProfile) return DEFAULT_ORGANIZATION_PROFILE;

    const parsedProfile: unknown = JSON.parse(storedProfile);
    if (!parsedProfile || typeof parsedProfile !== 'object' || Array.isArray(parsedProfile)) {
      return DEFAULT_ORGANIZATION_PROFILE;
    }

    const { pan: _legacyPan, ...savedFields } = parsedProfile as Partial<OrganizationProfile> & { pan?: string };
    return { ...DEFAULT_ORGANIZATION_PROFILE, ...savedFields };
  } catch {
    return DEFAULT_ORGANIZATION_PROFILE;
  }
};

export const saveOrganizationProfile = (profile: OrganizationProfile) => {
  try {
    localStorage.setItem(ORGANIZATION_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Keep the current session usable when browser storage is unavailable.
  }
};
