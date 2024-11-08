export interface CoreUser {
  accessToken: string;
  urn: string;
  name: string;
  lastName: string;
  avatarUrl: string | null;
  email: string;
  organizationUrn: string;
  organizationName: string;
  language: string;
  role: string;
  permissions: Permissions;
  totalGroups: number | null;
  mobileToken: string | null;
  msnMobileToken: string | null;
  lastLogin: number;
  visible: boolean;
}

export interface Permissions {
  canAdminOrganization: boolean;
  canCreateGroup: boolean;
  canCreatePersonalFiles: boolean;
  canCreateZlinks: boolean;
  canDeleteAllPublications: boolean;
  canDeleteOwnPublications: boolean;
  canEditOthersProfiles: boolean;
  canEditOwnEmail: boolean;
  canEditOwnName: boolean;
  canPublishInOwnFeed: boolean;
  canViewOthersZlinks: boolean;
}
