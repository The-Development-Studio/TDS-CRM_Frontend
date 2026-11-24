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

export const organizationProfileStorageKey = (tenantId = 'default') =>
  `${ORGANIZATION_PROFILE_STORAGE_KEY}:${tenantId}`;

export const loadOrganizationProfile = (tenantId = 'default'): OrganizationProfile => {
  try {
    localStorage.removeItem(LEGACY_ORGANIZATION_PROFILE_STORAGE_KEY);
    const tenantKey = organizationProfileStorageKey(tenantId);
    const storedProfile = localStorage.getItem(tenantKey)
      ?? (tenantId === 'default' ? localStorage.getItem(ORGANIZATION_PROFILE_STORAGE_KEY) : null);
    if (!storedProfile) return DEFAULT_ORGANIZATION_PROFILE;

    const parsedProfile: unknown = JSON.parse(storedProfile);
    if (!parsedProfile || typeof parsedProfile !== 'object' || Array.isArray(parsedProfile)) {
      return DEFAULT_ORGANIZATION_PROFILE;
    }

    const {
      pan: _legacyPan,
      id: _id,
      organizationKey: _organizationKey,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...savedFields
    } = parsedProfile as Partial<OrganizationProfile> & {
      pan?: string;
      id?: string;
      organizationKey?: string;
      createdAt?: string;
      updatedAt?: string;
    };
    return { ...DEFAULT_ORGANIZATION_PROFILE, ...savedFields };
  } catch {
    return DEFAULT_ORGANIZATION_PROFILE;
  }
};

export const saveOrganizationProfile = (profile: OrganizationProfile, tenantId = 'default') => {
  try {
    localStorage.setItem(organizationProfileStorageKey(tenantId), JSON.stringify(profile));
  } catch {
    // Keep the current session usable when browser storage is unavailable.
  }
};
