import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
import * as ApolloReactHooks from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  JSON: { input: Record<string, any>; output: Record<string, any>; }
  Time: { input: string; output: string; }
  Upload: { input: File; output: File; }
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  refreshToken: Scalars['String']['output'];
  token: Scalars['String']['output'];
  user: User;
};

export type CreateEnterpriseInput = {
  billingEmail?: InputMaybe<Scalars['String']['input']>;
  domain?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  settings?: InputMaybe<Scalars['JSON']['input']>;
  slug: Scalars['String']['input'];
};

export type CreateFolderInput = {
  name: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateUserInput = {
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type Enterprise = {
  __typename?: 'Enterprise';
  billingEmail?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Time']['output'];
  currentUsers: Scalars['Int']['output'];
  domain?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  maxUsers: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  settings: Scalars['JSON']['output'];
  slug: Scalars['String']['output'];
  storageQuota: Scalars['Int']['output'];
  storageUsed: Scalars['Int']['output'];
  subscriptionExpiresAt?: Maybe<Scalars['Time']['output']>;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  updatedAt: Scalars['Time']['output'];
};

export type EnterpriseInvitation = {
  __typename?: 'EnterpriseInvitation';
  acceptedAt?: Maybe<Scalars['Time']['output']>;
  createdAt: Scalars['Time']['output'];
  email: Scalars['String']['output'];
  enterprise?: Maybe<Enterprise>;
  enterpriseId: Scalars['ID']['output'];
  expiresAt: Scalars['Time']['output'];
  id: Scalars['ID']['output'];
  invitedBy?: Maybe<User>;
  role: EnterpriseRole;
  token: Scalars['String']['output'];
};

export enum EnterpriseRole {
  Admin = 'ADMIN',
  Member = 'MEMBER',
  Owner = 'OWNER'
}

export type EnterpriseStats = {
  __typename?: 'EnterpriseStats';
  activeUsers: Scalars['Int']['output'];
  filesThisMonth: Scalars['Int']['output'];
  storageQuota: Scalars['Int']['output'];
  storageUsagePercentage: Scalars['Float']['output'];
  storageUsed: Scalars['Int']['output'];
  totalFiles: Scalars['Int']['output'];
  totalUsers: Scalars['Int']['output'];
};

export type File = {
  __typename?: 'File';
  contentHash: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  downloadCount: Scalars['Int']['output'];
  fileSize: Scalars['Int']['output'];
  filename: Scalars['String']['output'];
  folder?: Maybe<Folder>;
  folderId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  mimeType: Scalars['String']['output'];
  originalName: Scalars['String']['output'];
  shareToken?: Maybe<Scalars['String']['output']>;
  shares: Array<FileShare>;
  tags: Array<Scalars['String']['output']>;
  updatedAt: Scalars['Time']['output'];
  uploadDate: Scalars['Time']['output'];
  user?: Maybe<User>;
  userId: Scalars['ID']['output'];
  visibility: FileVisibility;
};

export type FileContent = {
  __typename?: 'FileContent';
  contentHash: Scalars['ID']['output'];
  createdAt: Scalars['Time']['output'];
  enterpriseId?: Maybe<Scalars['ID']['output']>;
  filePath: Scalars['String']['output'];
  fileSize: Scalars['Int']['output'];
  referenceCount: Scalars['Int']['output'];
};

export type FileSearchInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  maxSize?: InputMaybe<Scalars['Int']['input']>;
  mimeTypes?: InputMaybe<Array<Scalars['String']['input']>>;
  minSize?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  sortBy?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  uploadedAfter?: InputMaybe<Scalars['Time']['input']>;
  uploadedBefore?: InputMaybe<Scalars['Time']['input']>;
  uploaderId?: InputMaybe<Scalars['ID']['input']>;
  visibility?: InputMaybe<FileVisibility>;
};

export type FileSearchResult = {
  __typename?: 'FileSearchResult';
  files: Array<File>;
  hasNextPage: Scalars['Boolean']['output'];
  totalCount: Scalars['Int']['output'];
};

export type FileShare = {
  __typename?: 'FileShare';
  accessCount: Scalars['Int']['output'];
  createdAt: Scalars['Time']['output'];
  expiresAt?: Maybe<Scalars['Time']['output']>;
  file?: Maybe<File>;
  fileId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  lastAccessedAt?: Maybe<Scalars['Time']['output']>;
  permissionType: PermissionType;
  sharedBy?: Maybe<User>;
  sharedByUserId: Scalars['ID']['output'];
  sharedWith?: Maybe<User>;
  sharedWithUserId: Scalars['ID']['output'];
};

export type FileShareInfo = {
  __typename?: 'FileShareInfo';
  downloadCount: Scalars['Int']['output'];
  isShared: Scalars['Boolean']['output'];
  shareToken?: Maybe<Scalars['String']['output']>;
  shareUrl?: Maybe<Scalars['String']['output']>;
  sharedWithUsers: Array<FileShareWithUser>;
};

export type FileShareWithUser = {
  __typename?: 'FileShareWithUser';
  created_at: Scalars['Time']['output'];
  id: Scalars['ID']['output'];
  permission_type: PermissionType;
  shared_with: User;
  shared_with_user_id: Scalars['ID']['output'];
};

export type FileUploadInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  folderId?: InputMaybe<Scalars['ID']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  visibility?: InputMaybe<FileVisibility>;
};

export enum FileVisibility {
  Private = 'PRIVATE',
  Public = 'PUBLIC',
  SharedWithUsers = 'SHARED_WITH_USERS'
}

export type Folder = {
  __typename?: 'Folder';
  children: Array<Folder>;
  createdAt: Scalars['Time']['output'];
  files: Array<File>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  parent?: Maybe<Folder>;
  parentId?: Maybe<Scalars['ID']['output']>;
  updatedAt: Scalars['Time']['output'];
  userId: Scalars['ID']['output'];
};

export type InviteUserInput = {
  email: Scalars['String']['input'];
  role: EnterpriseRole;
};

export type Mutation = {
  __typename?: 'Mutation';
  acceptInvitation: Scalars['Boolean']['output'];
  activateUser: User;
  changePassword: Scalars['Boolean']['output'];
  createEnterprise: Enterprise;
  createFolder: Folder;
  createPublicShare: PublicShareResponse;
  deleteEnterprise: Scalars['Boolean']['output'];
  deleteFile: Scalars['Boolean']['output'];
  deleteFolder: Scalars['Boolean']['output'];
  demoteUser: User;
  inviteUser: EnterpriseInvitation;
  login: AuthPayload;
  logout: Scalars['Boolean']['output'];
  promoteUser: User;
  refreshToken: AuthPayload;
  register: AuthPayload;
  removeFileShare: Scalars['Boolean']['output'];
  removePublicShare: Scalars['Boolean']['output'];
  removeUserFromEnterprise: Scalars['Boolean']['output'];
  requestPasswordReset: Scalars['Boolean']['output'];
  resetPassword: Scalars['Boolean']['output'];
  shareFileWithUser: FileShare;
  suspendUser: User;
  updateEnterprise: Enterprise;
  updateFile: File;
  updateFolder: Folder;
  updateProfile: User;
  uploadFile: File;
  uploadFiles: Array<File>;
  verifyEmail: Scalars['Boolean']['output'];
};


export type MutationAcceptInvitationArgs = {
  token: Scalars['String']['input'];
};


export type MutationActivateUserArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationChangePasswordArgs = {
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
};


export type MutationCreateEnterpriseArgs = {
  input: CreateEnterpriseInput;
};


export type MutationCreateFolderArgs = {
  input: CreateFolderInput;
};


export type MutationCreatePublicShareArgs = {
  fileId: Scalars['ID']['input'];
};


export type MutationDeleteEnterpriseArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteFileArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteFolderArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDemoteUserArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationInviteUserArgs = {
  enterpriseId: Scalars['ID']['input'];
  input: InviteUserInput;
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationPromoteUserArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationRegisterArgs = {
  input: CreateUserInput;
};


export type MutationRemoveFileShareArgs = {
  fileId: Scalars['ID']['input'];
  sharedWithUserId: Scalars['ID']['input'];
};


export type MutationRemovePublicShareArgs = {
  fileId: Scalars['ID']['input'];
};


export type MutationRemoveUserFromEnterpriseArgs = {
  enterpriseId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationRequestPasswordResetArgs = {
  email: Scalars['String']['input'];
};


export type MutationResetPasswordArgs = {
  newPassword: Scalars['String']['input'];
  token: Scalars['String']['input'];
};


export type MutationShareFileWithUserArgs = {
  input: ShareFileInput;
};


export type MutationSuspendUserArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationUpdateEnterpriseArgs = {
  id: Scalars['ID']['input'];
  input: UpdateEnterpriseInput;
};


export type MutationUpdateFileArgs = {
  id: Scalars['ID']['input'];
  input: UpdateFileInput;
};


export type MutationUpdateFolderArgs = {
  id: Scalars['ID']['input'];
  input: UpdateFolderInput;
};


export type MutationUpdateProfileArgs = {
  input: UpdateUserInput;
};


export type MutationUploadFileArgs = {
  file: Scalars['Upload']['input'];
  input: FileUploadInput;
};


export type MutationUploadFilesArgs = {
  files: Array<Scalars['Upload']['input']>;
  input: FileUploadInput;
};


export type MutationVerifyEmailArgs = {
  token: Scalars['String']['input'];
};

export enum PermissionType {
  Delete = 'DELETE',
  Download = 'DOWNLOAD',
  Edit = 'EDIT',
  View = 'VIEW'
}

export type PublicShareResponse = {
  __typename?: 'PublicShareResponse';
  shareToken: Scalars['String']['output'];
  shareUrl: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  downloadUrl: Scalars['String']['output'];
  enterprise?: Maybe<Enterprise>;
  enterpriseBySlug?: Maybe<Enterprise>;
  enterpriseInvitations: Array<EnterpriseInvitation>;
  enterpriseStats?: Maybe<EnterpriseStats>;
  file?: Maybe<File>;
  fileShareInfo: FileShareInfo;
  files: Array<File>;
  folder?: Maybe<Folder>;
  folderContents?: Maybe<Folder>;
  me?: Maybe<User>;
  myEnterprise?: Maybe<Enterprise>;
  myFiles: Array<File>;
  myFolders: Array<Folder>;
  publicFile?: Maybe<File>;
  searchFiles: FileSearchResult;
  searchUsers: Array<User>;
  sharedWithMe: Array<File>;
  storageStats: StorageStats;
  user?: Maybe<User>;
  users: Array<User>;
};


export type QueryDownloadUrlArgs = {
  expirationHours?: InputMaybe<Scalars['Int']['input']>;
  fileId: Scalars['ID']['input'];
};


export type QueryEnterpriseArgs = {
  id: Scalars['ID']['input'];
};


export type QueryEnterpriseBySlugArgs = {
  slug: Scalars['String']['input'];
};


export type QueryEnterpriseInvitationsArgs = {
  enterpriseId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryEnterpriseStatsArgs = {
  id: Scalars['ID']['input'];
};


export type QueryFileArgs = {
  id: Scalars['ID']['input'];
};


export type QueryFileShareInfoArgs = {
  fileId: Scalars['ID']['input'];
};


export type QueryFilesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryFolderArgs = {
  id: Scalars['ID']['input'];
};


export type QueryFolderContentsArgs = {
  id: Scalars['ID']['input'];
};


export type QueryMyFilesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPublicFileArgs = {
  shareToken: Scalars['String']['input'];
};


export type QuerySearchFilesArgs = {
  input: FileSearchInput;
};


export type QuerySearchUsersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};


export type QuerySharedWithMeArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUsersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export enum Role {
  Admin = 'ADMIN',
  User = 'USER'
}

export type ShareFileInput = {
  expiresAt?: InputMaybe<Scalars['Time']['input']>;
  fileId: Scalars['ID']['input'];
  permissionType: PermissionType;
  sharedWithUserId: Scalars['ID']['input'];
};

export type StorageStats = {
  __typename?: 'StorageStats';
  originalSize: Scalars['Int']['output'];
  originalSizeFormatted: Scalars['String']['output'];
  savings: Scalars['Int']['output'];
  savingsFormatted: Scalars['String']['output'];
  savingsPercentage: Scalars['Float']['output'];
  totalUsed: Scalars['Int']['output'];
  totalUsedFormatted: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  fileShared: FileShare;
  fileUploaded: File;
  folderUpdated: Folder;
};


export type SubscriptionFileSharedArgs = {
  userId: Scalars['ID']['input'];
};


export type SubscriptionFileUploadedArgs = {
  userId: Scalars['ID']['input'];
};


export type SubscriptionFolderUpdatedArgs = {
  userId: Scalars['ID']['input'];
};

export enum SubscriptionPlan {
  Basic = 'BASIC',
  Enterprise = 'ENTERPRISE',
  Premium = 'PREMIUM',
  Standard = 'STANDARD'
}

export enum SubscriptionStatus {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
  Suspended = 'SUSPENDED'
}

export type UpdateEnterpriseInput = {
  billingEmail?: InputMaybe<Scalars['String']['input']>;
  domain?: InputMaybe<Scalars['String']['input']>;
  maxUsers?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  settings?: InputMaybe<Scalars['JSON']['input']>;
  storageQuota?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateFileInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  filename?: InputMaybe<Scalars['String']['input']>;
  folderId?: InputMaybe<Scalars['ID']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  visibility?: InputMaybe<FileVisibility>;
};

export type UpdateFolderInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  parentId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateUserInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  profileImage?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  createdAt: Scalars['Time']['output'];
  email: Scalars['String']['output'];
  emailVerified: Scalars['Boolean']['output'];
  enterprise?: Maybe<Enterprise>;
  enterpriseId?: Maybe<Scalars['ID']['output']>;
  enterpriseRole?: Maybe<EnterpriseRole>;
  id: Scalars['ID']['output'];
  lastLoginAt?: Maybe<Scalars['Time']['output']>;
  name: Scalars['String']['output'];
  profileImage?: Maybe<Scalars['String']['output']>;
  role: Role;
  storageQuota: Scalars['Int']['output'];
  storageUsed: Scalars['Int']['output'];
  updatedAt: Scalars['Time']['output'];
};

export type LoginMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthPayload', token: string, refreshToken: string, user: { __typename?: 'User', id: string, email: string, name: string, profileImage?: string | null, role: Role, storageUsed: number, storageQuota: number, emailVerified: boolean, lastLoginAt?: string | null, enterpriseId?: string | null, enterpriseRole?: EnterpriseRole | null, createdAt: string, updatedAt: string, enterprise?: { __typename?: 'Enterprise', id: string, name: string, slug: string, domain?: string | null, subscriptionPlan: SubscriptionPlan, subscriptionStatus: SubscriptionStatus } | null } } };

export type RegisterMutationVariables = Exact<{
  input: CreateUserInput;
}>;


export type RegisterMutation = { __typename?: 'Mutation', register: { __typename?: 'AuthPayload', token: string, refreshToken: string, user: { __typename?: 'User', id: string, email: string, name: string, profileImage?: string | null, role: Role, storageUsed: number, storageQuota: number, emailVerified: boolean, lastLoginAt?: string | null, enterpriseId?: string | null, enterpriseRole?: EnterpriseRole | null, createdAt: string, updatedAt: string } } };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { __typename?: 'Mutation', logout: boolean };

export type RefreshTokenMutationVariables = Exact<{ [key: string]: never; }>;


export type RefreshTokenMutation = { __typename?: 'Mutation', refreshToken: { __typename?: 'AuthPayload', token: string, refreshToken: string, user: { __typename?: 'User', id: string, email: string, name: string, profileImage?: string | null, role: Role, storageUsed: number, storageQuota: number, emailVerified: boolean, lastLoginAt?: string | null, enterpriseId?: string | null, enterpriseRole?: EnterpriseRole | null, createdAt: string, updatedAt: string } } };

export type UpdateProfileMutationVariables = Exact<{
  input: UpdateUserInput;
}>;


export type UpdateProfileMutation = { __typename?: 'Mutation', updateProfile: { __typename?: 'User', id: string, email: string, name: string, profileImage?: string | null, role: Role, storageUsed: number, storageQuota: number, emailVerified: boolean, lastLoginAt?: string | null, enterpriseId?: string | null, enterpriseRole?: EnterpriseRole | null, createdAt: string, updatedAt: string } };

export type ChangePasswordMutationVariables = Exact<{
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
}>;


export type ChangePasswordMutation = { __typename?: 'Mutation', changePassword: boolean };

export type RequestPasswordResetMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type RequestPasswordResetMutation = { __typename?: 'Mutation', requestPasswordReset: boolean };

export type ResetPasswordMutationVariables = Exact<{
  token: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
}>;


export type ResetPasswordMutation = { __typename?: 'Mutation', resetPassword: boolean };

export type VerifyEmailMutationVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type VerifyEmailMutation = { __typename?: 'Mutation', verifyEmail: boolean };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: string, email: string, name: string, profileImage?: string | null, role: Role, storageUsed: number, storageQuota: number, emailVerified: boolean, lastLoginAt?: string | null, enterpriseId?: string | null, enterpriseRole?: EnterpriseRole | null, createdAt: string, updatedAt: string, enterprise?: { __typename?: 'Enterprise', id: string, name: string, slug: string, domain?: string | null, subscriptionPlan: SubscriptionPlan, subscriptionStatus: SubscriptionStatus } | null } | null };

export type GetUserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetUserQuery = { __typename?: 'Query', user?: { __typename?: 'User', id: string, email: string, name: string, profileImage?: string | null, role: Role, storageUsed: number, storageQuota: number, emailVerified: boolean, lastLoginAt?: string | null, enterpriseId?: string | null, enterpriseRole?: EnterpriseRole | null, createdAt: string, updatedAt: string } | null };

export type GetUsersQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetUsersQuery = { __typename?: 'Query', users: Array<{ __typename?: 'User', id: string, email: string, name: string, profileImage?: string | null, role: Role, storageUsed: number, storageQuota: number, emailVerified: boolean, lastLoginAt?: string | null, enterpriseId?: string | null, enterpriseRole?: EnterpriseRole | null, createdAt: string, updatedAt: string }> };

export type UploadFileMutationVariables = Exact<{
  file: Scalars['Upload']['input'];
  input: FileUploadInput;
}>;


export type UploadFileMutation = { __typename?: 'Mutation', uploadFile: { __typename?: 'File', id: string, userId: string, folderId?: string | null, filename: string, originalName: string, mimeType: string, fileSize: number, contentHash: string, description?: string | null, tags: Array<string>, visibility: FileVisibility, shareToken?: string | null, downloadCount: number, uploadDate: string, updatedAt: string, folder?: { __typename?: 'Folder', id: string, name: string } | null } };

export type UploadFilesMutationVariables = Exact<{
  files: Array<Scalars['Upload']['input']> | Scalars['Upload']['input'];
  input: FileUploadInput;
}>;


export type UploadFilesMutation = { __typename?: 'Mutation', uploadFiles: Array<{ __typename?: 'File', id: string, userId: string, folderId?: string | null, filename: string, originalName: string, mimeType: string, fileSize: number, contentHash: string, description?: string | null, tags: Array<string>, visibility: FileVisibility, shareToken?: string | null, downloadCount: number, uploadDate: string, updatedAt: string, folder?: { __typename?: 'Folder', id: string, name: string } | null }> };

export type UpdateFileMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateFileInput;
}>;


export type UpdateFileMutation = { __typename?: 'Mutation', updateFile: { __typename?: 'File', id: string, userId: string, folderId?: string | null, filename: string, originalName: string, mimeType: string, fileSize: number, contentHash: string, description?: string | null, tags: Array<string>, visibility: FileVisibility, shareToken?: string | null, downloadCount: number, uploadDate: string, updatedAt: string, folder?: { __typename?: 'Folder', id: string, name: string } | null } };

export type DeleteFileMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteFileMutation = { __typename?: 'Mutation', deleteFile: boolean };

export type ShareFileWithUserMutationVariables = Exact<{
  input: ShareFileInput;
}>;


export type ShareFileWithUserMutation = { __typename?: 'Mutation', shareFileWithUser: { __typename?: 'FileShare', id: string, fileId: string, sharedByUserId: string, sharedWithUserId: string, permissionType: PermissionType, expiresAt?: string | null, lastAccessedAt?: string | null, accessCount: number, createdAt: string, file?: { __typename?: 'File', id: string, filename: string, originalName: string } | null, sharedBy?: { __typename?: 'User', id: string, name: string, email: string } | null, sharedWith?: { __typename?: 'User', id: string, name: string, email: string } | null } };

export type RemoveFileShareMutationVariables = Exact<{
  fileId: Scalars['ID']['input'];
  sharedWithUserId: Scalars['ID']['input'];
}>;


export type RemoveFileShareMutation = { __typename?: 'Mutation', removeFileShare: boolean };

export type CreatePublicShareMutationVariables = Exact<{
  fileId: Scalars['ID']['input'];
}>;


export type CreatePublicShareMutation = { __typename?: 'Mutation', createPublicShare: { __typename?: 'PublicShareResponse', shareToken: string, shareUrl: string } };

export type RemovePublicShareMutationVariables = Exact<{
  fileId: Scalars['ID']['input'];
}>;


export type RemovePublicShareMutation = { __typename?: 'Mutation', removePublicShare: boolean };

export type GetMyFilesQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetMyFilesQuery = { __typename?: 'Query', myFiles: Array<{ __typename?: 'File', id: string, userId: string, folderId?: string | null, filename: string, originalName: string, mimeType: string, fileSize: number, contentHash: string, description?: string | null, tags: Array<string>, visibility: FileVisibility, shareToken?: string | null, downloadCount: number, uploadDate: string, updatedAt: string, user?: { __typename?: 'User', id: string, name: string, email: string } | null, folder?: { __typename?: 'Folder', id: string, name: string } | null }> };

export type GetFileQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetFileQuery = { __typename?: 'Query', file?: { __typename?: 'File', id: string, userId: string, folderId?: string | null, filename: string, originalName: string, mimeType: string, fileSize: number, contentHash: string, description?: string | null, tags: Array<string>, visibility: FileVisibility, shareToken?: string | null, downloadCount: number, uploadDate: string, updatedAt: string, user?: { __typename?: 'User', id: string, name: string, email: string } | null, folder?: { __typename?: 'Folder', id: string, name: string } | null, shares: Array<{ __typename?: 'FileShare', id: string, sharedWithUserId: string, permissionType: PermissionType, expiresAt?: string | null, lastAccessedAt?: string | null, accessCount: number, createdAt: string, sharedWith?: { __typename?: 'User', id: string, name: string, email: string } | null }> } | null };

export type SearchFilesQueryVariables = Exact<{
  input: FileSearchInput;
}>;


export type SearchFilesQuery = { __typename?: 'Query', searchFiles: { __typename?: 'FileSearchResult', totalCount: number, hasNextPage: boolean, files: Array<{ __typename?: 'File', id: string, userId: string, folderId?: string | null, filename: string, originalName: string, mimeType: string, fileSize: number, contentHash: string, description?: string | null, tags: Array<string>, visibility: FileVisibility, shareToken?: string | null, downloadCount: number, uploadDate: string, updatedAt: string, user?: { __typename?: 'User', id: string, name: string, email: string } | null, folder?: { __typename?: 'Folder', id: string, name: string } | null }> } };

export type GetSharedWithMeQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetSharedWithMeQuery = { __typename?: 'Query', sharedWithMe: Array<{ __typename?: 'File', id: string, userId: string, folderId?: string | null, filename: string, originalName: string, mimeType: string, fileSize: number, contentHash: string, description?: string | null, tags: Array<string>, visibility: FileVisibility, downloadCount: number, uploadDate: string, updatedAt: string, user?: { __typename?: 'User', id: string, name: string, email: string } | null, folder?: { __typename?: 'Folder', id: string, name: string } | null }> };

export type GetPublicFileQueryVariables = Exact<{
  shareToken: Scalars['String']['input'];
}>;


export type GetPublicFileQuery = { __typename?: 'Query', publicFile?: { __typename?: 'File', id: string, userId: string, folderId?: string | null, filename: string, originalName: string, mimeType: string, fileSize: number, contentHash: string, description?: string | null, tags: Array<string>, visibility: FileVisibility, shareToken?: string | null, downloadCount: number, uploadDate: string, updatedAt: string, user?: { __typename?: 'User', id: string, name: string, email: string } | null } | null };

export type GetDownloadUrlQueryVariables = Exact<{
  fileId: Scalars['ID']['input'];
  expirationHours?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetDownloadUrlQuery = { __typename?: 'Query', downloadUrl: string };

export type GetStorageStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetStorageStatsQuery = { __typename?: 'Query', storageStats: { __typename?: 'StorageStats', userId: string, totalUsed: number, originalSize: number, savings: number, savingsPercentage: number, totalUsedFormatted: string, originalSizeFormatted: string, savingsFormatted: string } };

export type GetFileShareInfoQueryVariables = Exact<{
  fileId: Scalars['ID']['input'];
}>;


export type GetFileShareInfoQuery = { __typename?: 'Query', fileShareInfo: { __typename?: 'FileShareInfo', isShared: boolean, shareToken?: string | null, shareUrl?: string | null, downloadCount: number, sharedWithUsers: Array<{ __typename?: 'FileShareWithUser', id: string, shared_with_user_id: string, permission_type: PermissionType, created_at: string, shared_with: { __typename?: 'User', id: string, name: string, email: string } }> } };

export type SearchUsersQueryVariables = Exact<{
  query: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type SearchUsersQuery = { __typename?: 'Query', searchUsers: Array<{ __typename?: 'User', id: string, name: string, email: string }> };


export const LoginDocument = gql`
    mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    refreshToken
    user {
      id
      email
      name
      profileImage
      role
      storageUsed
      storageQuota
      emailVerified
      lastLoginAt
      enterpriseId
      enterpriseRole
      enterprise {
        id
        name
        slug
        domain
        subscriptionPlan
        subscriptionStatus
      }
      createdAt
      updatedAt
    }
  }
}
    `;
export type LoginMutationFn = Apollo.MutationFunction<LoginMutation, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      email: // value for 'email'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useLoginMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<LoginMutation, LoginMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, options);
      }
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = Apollo.MutationResult<LoginMutation>;
export type LoginMutationOptions = Apollo.BaseMutationOptions<LoginMutation, LoginMutationVariables>;
export const RegisterDocument = gql`
    mutation Register($input: CreateUserInput!) {
  register(input: $input) {
    token
    refreshToken
    user {
      id
      email
      name
      profileImage
      role
      storageUsed
      storageQuota
      emailVerified
      lastLoginAt
      enterpriseId
      enterpriseRole
      createdAt
      updatedAt
    }
  }
}
    `;
export type RegisterMutationFn = Apollo.MutationFunction<RegisterMutation, RegisterMutationVariables>;

/**
 * __useRegisterMutation__
 *
 * To run a mutation, you first call `useRegisterMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerMutation, { data, loading, error }] = useRegisterMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRegisterMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RegisterMutation, RegisterMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RegisterMutation, RegisterMutationVariables>(RegisterDocument, options);
      }
export type RegisterMutationHookResult = ReturnType<typeof useRegisterMutation>;
export type RegisterMutationResult = Apollo.MutationResult<RegisterMutation>;
export type RegisterMutationOptions = Apollo.BaseMutationOptions<RegisterMutation, RegisterMutationVariables>;
export const LogoutDocument = gql`
    mutation Logout {
  logout
}
    `;
export type LogoutMutationFn = Apollo.MutationFunction<LogoutMutation, LogoutMutationVariables>;

/**
 * __useLogoutMutation__
 *
 * To run a mutation, you first call `useLogoutMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLogoutMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [logoutMutation, { data, loading, error }] = useLogoutMutation({
 *   variables: {
 *   },
 * });
 */
export function useLogoutMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<LogoutMutation, LogoutMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<LogoutMutation, LogoutMutationVariables>(LogoutDocument, options);
      }
export type LogoutMutationHookResult = ReturnType<typeof useLogoutMutation>;
export type LogoutMutationResult = Apollo.MutationResult<LogoutMutation>;
export type LogoutMutationOptions = Apollo.BaseMutationOptions<LogoutMutation, LogoutMutationVariables>;
export const RefreshTokenDocument = gql`
    mutation RefreshToken {
  refreshToken {
    token
    refreshToken
    user {
      id
      email
      name
      profileImage
      role
      storageUsed
      storageQuota
      emailVerified
      lastLoginAt
      enterpriseId
      enterpriseRole
      createdAt
      updatedAt
    }
  }
}
    `;
export type RefreshTokenMutationFn = Apollo.MutationFunction<RefreshTokenMutation, RefreshTokenMutationVariables>;

/**
 * __useRefreshTokenMutation__
 *
 * To run a mutation, you first call `useRefreshTokenMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRefreshTokenMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [refreshTokenMutation, { data, loading, error }] = useRefreshTokenMutation({
 *   variables: {
 *   },
 * });
 */
export function useRefreshTokenMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RefreshTokenMutation, RefreshTokenMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RefreshTokenMutation, RefreshTokenMutationVariables>(RefreshTokenDocument, options);
      }
export type RefreshTokenMutationHookResult = ReturnType<typeof useRefreshTokenMutation>;
export type RefreshTokenMutationResult = Apollo.MutationResult<RefreshTokenMutation>;
export type RefreshTokenMutationOptions = Apollo.BaseMutationOptions<RefreshTokenMutation, RefreshTokenMutationVariables>;
export const UpdateProfileDocument = gql`
    mutation UpdateProfile($input: UpdateUserInput!) {
  updateProfile(input: $input) {
    id
    email
    name
    profileImage
    role
    storageUsed
    storageQuota
    emailVerified
    lastLoginAt
    enterpriseId
    enterpriseRole
    createdAt
    updatedAt
  }
}
    `;
export type UpdateProfileMutationFn = Apollo.MutationFunction<UpdateProfileMutation, UpdateProfileMutationVariables>;

/**
 * __useUpdateProfileMutation__
 *
 * To run a mutation, you first call `useUpdateProfileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateProfileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateProfileMutation, { data, loading, error }] = useUpdateProfileMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateProfileMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateProfileMutation, UpdateProfileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateProfileMutation, UpdateProfileMutationVariables>(UpdateProfileDocument, options);
      }
export type UpdateProfileMutationHookResult = ReturnType<typeof useUpdateProfileMutation>;
export type UpdateProfileMutationResult = Apollo.MutationResult<UpdateProfileMutation>;
export type UpdateProfileMutationOptions = Apollo.BaseMutationOptions<UpdateProfileMutation, UpdateProfileMutationVariables>;
export const ChangePasswordDocument = gql`
    mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
  changePassword(currentPassword: $currentPassword, newPassword: $newPassword)
}
    `;
export type ChangePasswordMutationFn = Apollo.MutationFunction<ChangePasswordMutation, ChangePasswordMutationVariables>;

/**
 * __useChangePasswordMutation__
 *
 * To run a mutation, you first call `useChangePasswordMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useChangePasswordMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [changePasswordMutation, { data, loading, error }] = useChangePasswordMutation({
 *   variables: {
 *      currentPassword: // value for 'currentPassword'
 *      newPassword: // value for 'newPassword'
 *   },
 * });
 */
export function useChangePasswordMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ChangePasswordMutation, ChangePasswordMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ChangePasswordMutation, ChangePasswordMutationVariables>(ChangePasswordDocument, options);
      }
export type ChangePasswordMutationHookResult = ReturnType<typeof useChangePasswordMutation>;
export type ChangePasswordMutationResult = Apollo.MutationResult<ChangePasswordMutation>;
export type ChangePasswordMutationOptions = Apollo.BaseMutationOptions<ChangePasswordMutation, ChangePasswordMutationVariables>;
export const RequestPasswordResetDocument = gql`
    mutation RequestPasswordReset($email: String!) {
  requestPasswordReset(email: $email)
}
    `;
export type RequestPasswordResetMutationFn = Apollo.MutationFunction<RequestPasswordResetMutation, RequestPasswordResetMutationVariables>;

/**
 * __useRequestPasswordResetMutation__
 *
 * To run a mutation, you first call `useRequestPasswordResetMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRequestPasswordResetMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [requestPasswordResetMutation, { data, loading, error }] = useRequestPasswordResetMutation({
 *   variables: {
 *      email: // value for 'email'
 *   },
 * });
 */
export function useRequestPasswordResetMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RequestPasswordResetMutation, RequestPasswordResetMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RequestPasswordResetMutation, RequestPasswordResetMutationVariables>(RequestPasswordResetDocument, options);
      }
export type RequestPasswordResetMutationHookResult = ReturnType<typeof useRequestPasswordResetMutation>;
export type RequestPasswordResetMutationResult = Apollo.MutationResult<RequestPasswordResetMutation>;
export type RequestPasswordResetMutationOptions = Apollo.BaseMutationOptions<RequestPasswordResetMutation, RequestPasswordResetMutationVariables>;
export const ResetPasswordDocument = gql`
    mutation ResetPassword($token: String!, $newPassword: String!) {
  resetPassword(token: $token, newPassword: $newPassword)
}
    `;
export type ResetPasswordMutationFn = Apollo.MutationFunction<ResetPasswordMutation, ResetPasswordMutationVariables>;

/**
 * __useResetPasswordMutation__
 *
 * To run a mutation, you first call `useResetPasswordMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useResetPasswordMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [resetPasswordMutation, { data, loading, error }] = useResetPasswordMutation({
 *   variables: {
 *      token: // value for 'token'
 *      newPassword: // value for 'newPassword'
 *   },
 * });
 */
export function useResetPasswordMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ResetPasswordMutation, ResetPasswordMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ResetPasswordMutation, ResetPasswordMutationVariables>(ResetPasswordDocument, options);
      }
export type ResetPasswordMutationHookResult = ReturnType<typeof useResetPasswordMutation>;
export type ResetPasswordMutationResult = Apollo.MutationResult<ResetPasswordMutation>;
export type ResetPasswordMutationOptions = Apollo.BaseMutationOptions<ResetPasswordMutation, ResetPasswordMutationVariables>;
export const VerifyEmailDocument = gql`
    mutation VerifyEmail($token: String!) {
  verifyEmail(token: $token)
}
    `;
export type VerifyEmailMutationFn = Apollo.MutationFunction<VerifyEmailMutation, VerifyEmailMutationVariables>;

/**
 * __useVerifyEmailMutation__
 *
 * To run a mutation, you first call `useVerifyEmailMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useVerifyEmailMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [verifyEmailMutation, { data, loading, error }] = useVerifyEmailMutation({
 *   variables: {
 *      token: // value for 'token'
 *   },
 * });
 */
export function useVerifyEmailMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<VerifyEmailMutation, VerifyEmailMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<VerifyEmailMutation, VerifyEmailMutationVariables>(VerifyEmailDocument, options);
      }
export type VerifyEmailMutationHookResult = ReturnType<typeof useVerifyEmailMutation>;
export type VerifyEmailMutationResult = Apollo.MutationResult<VerifyEmailMutation>;
export type VerifyEmailMutationOptions = Apollo.BaseMutationOptions<VerifyEmailMutation, VerifyEmailMutationVariables>;
export const MeDocument = gql`
    query Me {
  me {
    id
    email
    name
    profileImage
    role
    storageUsed
    storageQuota
    emailVerified
    lastLoginAt
    enterpriseId
    enterpriseRole
    enterprise {
      id
      name
      slug
      domain
      subscriptionPlan
      subscriptionStatus
    }
    createdAt
    updatedAt
  }
}
    `;

/**
 * __useMeQuery__
 *
 * To run a query within a React component, call `useMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMeQuery({
 *   variables: {
 *   },
 * });
 */
export function useMeQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<MeQuery, MeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<MeQuery, MeQueryVariables>(MeDocument, options);
      }
export function useMeLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<MeQuery, MeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<MeQuery, MeQueryVariables>(MeDocument, options);
        }
export type MeQueryHookResult = ReturnType<typeof useMeQuery>;
export type MeLazyQueryHookResult = ReturnType<typeof useMeLazyQuery>;
export type MeQueryResult = Apollo.QueryResult<MeQuery, MeQueryVariables>;
export const GetUserDocument = gql`
    query GetUser($id: ID!) {
  user(id: $id) {
    id
    email
    name
    profileImage
    role
    storageUsed
    storageQuota
    emailVerified
    lastLoginAt
    enterpriseId
    enterpriseRole
    createdAt
    updatedAt
  }
}
    `;

/**
 * __useGetUserQuery__
 *
 * To run a query within a React component, call `useGetUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetUserQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
      }
export function useGetUserLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
        }
export type GetUserQueryHookResult = ReturnType<typeof useGetUserQuery>;
export type GetUserLazyQueryHookResult = ReturnType<typeof useGetUserLazyQuery>;
export type GetUserQueryResult = Apollo.QueryResult<GetUserQuery, GetUserQueryVariables>;
export const GetUsersDocument = gql`
    query GetUsers($limit: Int = 20, $offset: Int = 0) {
  users(limit: $limit, offset: $offset) {
    id
    email
    name
    profileImage
    role
    storageUsed
    storageQuota
    emailVerified
    lastLoginAt
    enterpriseId
    enterpriseRole
    createdAt
    updatedAt
  }
}
    `;

/**
 * __useGetUsersQuery__
 *
 * To run a query within a React component, call `useGetUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUsersQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetUsersQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetUsersQuery, GetUsersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetUsersQuery, GetUsersQueryVariables>(GetUsersDocument, options);
      }
export function useGetUsersLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetUsersQuery, GetUsersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetUsersQuery, GetUsersQueryVariables>(GetUsersDocument, options);
        }
export type GetUsersQueryHookResult = ReturnType<typeof useGetUsersQuery>;
export type GetUsersLazyQueryHookResult = ReturnType<typeof useGetUsersLazyQuery>;
export type GetUsersQueryResult = Apollo.QueryResult<GetUsersQuery, GetUsersQueryVariables>;
export const UploadFileDocument = gql`
    mutation UploadFile($file: Upload!, $input: FileUploadInput!) {
  uploadFile(file: $file, input: $input) {
    id
    userId
    folderId
    filename
    originalName
    mimeType
    fileSize
    contentHash
    description
    tags
    visibility
    shareToken
    downloadCount
    uploadDate
    updatedAt
    folder {
      id
      name
    }
  }
}
    `;
export type UploadFileMutationFn = Apollo.MutationFunction<UploadFileMutation, UploadFileMutationVariables>;

/**
 * __useUploadFileMutation__
 *
 * To run a mutation, you first call `useUploadFileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUploadFileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [uploadFileMutation, { data, loading, error }] = useUploadFileMutation({
 *   variables: {
 *      file: // value for 'file'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUploadFileMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UploadFileMutation, UploadFileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UploadFileMutation, UploadFileMutationVariables>(UploadFileDocument, options);
      }
export type UploadFileMutationHookResult = ReturnType<typeof useUploadFileMutation>;
export type UploadFileMutationResult = Apollo.MutationResult<UploadFileMutation>;
export type UploadFileMutationOptions = Apollo.BaseMutationOptions<UploadFileMutation, UploadFileMutationVariables>;
export const UploadFilesDocument = gql`
    mutation UploadFiles($files: [Upload!]!, $input: FileUploadInput!) {
  uploadFiles(files: $files, input: $input) {
    id
    userId
    folderId
    filename
    originalName
    mimeType
    fileSize
    contentHash
    description
    tags
    visibility
    shareToken
    downloadCount
    uploadDate
    updatedAt
    folder {
      id
      name
    }
  }
}
    `;
export type UploadFilesMutationFn = Apollo.MutationFunction<UploadFilesMutation, UploadFilesMutationVariables>;

/**
 * __useUploadFilesMutation__
 *
 * To run a mutation, you first call `useUploadFilesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUploadFilesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [uploadFilesMutation, { data, loading, error }] = useUploadFilesMutation({
 *   variables: {
 *      files: // value for 'files'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUploadFilesMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UploadFilesMutation, UploadFilesMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UploadFilesMutation, UploadFilesMutationVariables>(UploadFilesDocument, options);
      }
export type UploadFilesMutationHookResult = ReturnType<typeof useUploadFilesMutation>;
export type UploadFilesMutationResult = Apollo.MutationResult<UploadFilesMutation>;
export type UploadFilesMutationOptions = Apollo.BaseMutationOptions<UploadFilesMutation, UploadFilesMutationVariables>;
export const UpdateFileDocument = gql`
    mutation UpdateFile($id: ID!, $input: UpdateFileInput!) {
  updateFile(id: $id, input: $input) {
    id
    userId
    folderId
    filename
    originalName
    mimeType
    fileSize
    contentHash
    description
    tags
    visibility
    shareToken
    downloadCount
    uploadDate
    updatedAt
    folder {
      id
      name
    }
  }
}
    `;
export type UpdateFileMutationFn = Apollo.MutationFunction<UpdateFileMutation, UpdateFileMutationVariables>;

/**
 * __useUpdateFileMutation__
 *
 * To run a mutation, you first call `useUpdateFileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateFileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateFileMutation, { data, loading, error }] = useUpdateFileMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateFileMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateFileMutation, UpdateFileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateFileMutation, UpdateFileMutationVariables>(UpdateFileDocument, options);
      }
export type UpdateFileMutationHookResult = ReturnType<typeof useUpdateFileMutation>;
export type UpdateFileMutationResult = Apollo.MutationResult<UpdateFileMutation>;
export type UpdateFileMutationOptions = Apollo.BaseMutationOptions<UpdateFileMutation, UpdateFileMutationVariables>;
export const DeleteFileDocument = gql`
    mutation DeleteFile($id: ID!) {
  deleteFile(id: $id)
}
    `;
export type DeleteFileMutationFn = Apollo.MutationFunction<DeleteFileMutation, DeleteFileMutationVariables>;

/**
 * __useDeleteFileMutation__
 *
 * To run a mutation, you first call `useDeleteFileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteFileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteFileMutation, { data, loading, error }] = useDeleteFileMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteFileMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteFileMutation, DeleteFileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteFileMutation, DeleteFileMutationVariables>(DeleteFileDocument, options);
      }
export type DeleteFileMutationHookResult = ReturnType<typeof useDeleteFileMutation>;
export type DeleteFileMutationResult = Apollo.MutationResult<DeleteFileMutation>;
export type DeleteFileMutationOptions = Apollo.BaseMutationOptions<DeleteFileMutation, DeleteFileMutationVariables>;
export const ShareFileWithUserDocument = gql`
    mutation ShareFileWithUser($input: ShareFileInput!) {
  shareFileWithUser(input: $input) {
    id
    fileId
    sharedByUserId
    sharedWithUserId
    permissionType
    expiresAt
    lastAccessedAt
    accessCount
    createdAt
    file {
      id
      filename
      originalName
    }
    sharedBy {
      id
      name
      email
    }
    sharedWith {
      id
      name
      email
    }
  }
}
    `;
export type ShareFileWithUserMutationFn = Apollo.MutationFunction<ShareFileWithUserMutation, ShareFileWithUserMutationVariables>;

/**
 * __useShareFileWithUserMutation__
 *
 * To run a mutation, you first call `useShareFileWithUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useShareFileWithUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [shareFileWithUserMutation, { data, loading, error }] = useShareFileWithUserMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useShareFileWithUserMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ShareFileWithUserMutation, ShareFileWithUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ShareFileWithUserMutation, ShareFileWithUserMutationVariables>(ShareFileWithUserDocument, options);
      }
export type ShareFileWithUserMutationHookResult = ReturnType<typeof useShareFileWithUserMutation>;
export type ShareFileWithUserMutationResult = Apollo.MutationResult<ShareFileWithUserMutation>;
export type ShareFileWithUserMutationOptions = Apollo.BaseMutationOptions<ShareFileWithUserMutation, ShareFileWithUserMutationVariables>;
export const RemoveFileShareDocument = gql`
    mutation RemoveFileShare($fileId: ID!, $sharedWithUserId: ID!) {
  removeFileShare(fileId: $fileId, sharedWithUserId: $sharedWithUserId)
}
    `;
export type RemoveFileShareMutationFn = Apollo.MutationFunction<RemoveFileShareMutation, RemoveFileShareMutationVariables>;

/**
 * __useRemoveFileShareMutation__
 *
 * To run a mutation, you first call `useRemoveFileShareMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveFileShareMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeFileShareMutation, { data, loading, error }] = useRemoveFileShareMutation({
 *   variables: {
 *      fileId: // value for 'fileId'
 *      sharedWithUserId: // value for 'sharedWithUserId'
 *   },
 * });
 */
export function useRemoveFileShareMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RemoveFileShareMutation, RemoveFileShareMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RemoveFileShareMutation, RemoveFileShareMutationVariables>(RemoveFileShareDocument, options);
      }
export type RemoveFileShareMutationHookResult = ReturnType<typeof useRemoveFileShareMutation>;
export type RemoveFileShareMutationResult = Apollo.MutationResult<RemoveFileShareMutation>;
export type RemoveFileShareMutationOptions = Apollo.BaseMutationOptions<RemoveFileShareMutation, RemoveFileShareMutationVariables>;
export const CreatePublicShareDocument = gql`
    mutation CreatePublicShare($fileId: ID!) {
  createPublicShare(fileId: $fileId) {
    shareToken
    shareUrl
  }
}
    `;
export type CreatePublicShareMutationFn = Apollo.MutationFunction<CreatePublicShareMutation, CreatePublicShareMutationVariables>;

/**
 * __useCreatePublicShareMutation__
 *
 * To run a mutation, you first call `useCreatePublicShareMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreatePublicShareMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createPublicShareMutation, { data, loading, error }] = useCreatePublicShareMutation({
 *   variables: {
 *      fileId: // value for 'fileId'
 *   },
 * });
 */
export function useCreatePublicShareMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreatePublicShareMutation, CreatePublicShareMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreatePublicShareMutation, CreatePublicShareMutationVariables>(CreatePublicShareDocument, options);
      }
export type CreatePublicShareMutationHookResult = ReturnType<typeof useCreatePublicShareMutation>;
export type CreatePublicShareMutationResult = Apollo.MutationResult<CreatePublicShareMutation>;
export type CreatePublicShareMutationOptions = Apollo.BaseMutationOptions<CreatePublicShareMutation, CreatePublicShareMutationVariables>;
export const RemovePublicShareDocument = gql`
    mutation RemovePublicShare($fileId: ID!) {
  removePublicShare(fileId: $fileId)
}
    `;
export type RemovePublicShareMutationFn = Apollo.MutationFunction<RemovePublicShareMutation, RemovePublicShareMutationVariables>;

/**
 * __useRemovePublicShareMutation__
 *
 * To run a mutation, you first call `useRemovePublicShareMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemovePublicShareMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removePublicShareMutation, { data, loading, error }] = useRemovePublicShareMutation({
 *   variables: {
 *      fileId: // value for 'fileId'
 *   },
 * });
 */
export function useRemovePublicShareMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RemovePublicShareMutation, RemovePublicShareMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RemovePublicShareMutation, RemovePublicShareMutationVariables>(RemovePublicShareDocument, options);
      }
export type RemovePublicShareMutationHookResult = ReturnType<typeof useRemovePublicShareMutation>;
export type RemovePublicShareMutationResult = Apollo.MutationResult<RemovePublicShareMutation>;
export type RemovePublicShareMutationOptions = Apollo.BaseMutationOptions<RemovePublicShareMutation, RemovePublicShareMutationVariables>;
export const GetMyFilesDocument = gql`
    query GetMyFiles($limit: Int = 20, $offset: Int = 0) {
  myFiles(limit: $limit, offset: $offset) {
    id
    userId
    folderId
    filename
    originalName
    mimeType
    fileSize
    contentHash
    description
    tags
    visibility
    shareToken
    downloadCount
    uploadDate
    updatedAt
    user {
      id
      name
      email
    }
    folder {
      id
      name
    }
  }
}
    `;

/**
 * __useGetMyFilesQuery__
 *
 * To run a query within a React component, call `useGetMyFilesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMyFilesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMyFilesQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetMyFilesQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetMyFilesQuery, GetMyFilesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMyFilesQuery, GetMyFilesQueryVariables>(GetMyFilesDocument, options);
      }
export function useGetMyFilesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMyFilesQuery, GetMyFilesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMyFilesQuery, GetMyFilesQueryVariables>(GetMyFilesDocument, options);
        }
export type GetMyFilesQueryHookResult = ReturnType<typeof useGetMyFilesQuery>;
export type GetMyFilesLazyQueryHookResult = ReturnType<typeof useGetMyFilesLazyQuery>;
export type GetMyFilesQueryResult = Apollo.QueryResult<GetMyFilesQuery, GetMyFilesQueryVariables>;
export const GetFileDocument = gql`
    query GetFile($id: ID!) {
  file(id: $id) {
    id
    userId
    folderId
    filename
    originalName
    mimeType
    fileSize
    contentHash
    description
    tags
    visibility
    shareToken
    downloadCount
    uploadDate
    updatedAt
    user {
      id
      name
      email
    }
    folder {
      id
      name
    }
    shares {
      id
      sharedWithUserId
      permissionType
      expiresAt
      lastAccessedAt
      accessCount
      createdAt
      sharedWith {
        id
        name
        email
      }
    }
  }
}
    `;

/**
 * __useGetFileQuery__
 *
 * To run a query within a React component, call `useGetFileQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFileQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFileQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetFileQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetFileQuery, GetFileQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetFileQuery, GetFileQueryVariables>(GetFileDocument, options);
      }
export function useGetFileLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetFileQuery, GetFileQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetFileQuery, GetFileQueryVariables>(GetFileDocument, options);
        }
export type GetFileQueryHookResult = ReturnType<typeof useGetFileQuery>;
export type GetFileLazyQueryHookResult = ReturnType<typeof useGetFileLazyQuery>;
export type GetFileQueryResult = Apollo.QueryResult<GetFileQuery, GetFileQueryVariables>;
export const SearchFilesDocument = gql`
    query SearchFiles($input: FileSearchInput!) {
  searchFiles(input: $input) {
    files {
      id
      userId
      folderId
      filename
      originalName
      mimeType
      fileSize
      contentHash
      description
      tags
      visibility
      shareToken
      downloadCount
      uploadDate
      updatedAt
      user {
        id
        name
        email
      }
      folder {
        id
        name
      }
    }
    totalCount
    hasNextPage
  }
}
    `;

/**
 * __useSearchFilesQuery__
 *
 * To run a query within a React component, call `useSearchFilesQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchFilesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchFilesQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSearchFilesQuery(baseOptions: ApolloReactHooks.QueryHookOptions<SearchFilesQuery, SearchFilesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<SearchFilesQuery, SearchFilesQueryVariables>(SearchFilesDocument, options);
      }
export function useSearchFilesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<SearchFilesQuery, SearchFilesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<SearchFilesQuery, SearchFilesQueryVariables>(SearchFilesDocument, options);
        }
export type SearchFilesQueryHookResult = ReturnType<typeof useSearchFilesQuery>;
export type SearchFilesLazyQueryHookResult = ReturnType<typeof useSearchFilesLazyQuery>;
export type SearchFilesQueryResult = Apollo.QueryResult<SearchFilesQuery, SearchFilesQueryVariables>;
export const GetSharedWithMeDocument = gql`
    query GetSharedWithMe($limit: Int = 20, $offset: Int = 0) {
  sharedWithMe(limit: $limit, offset: $offset) {
    id
    userId
    folderId
    filename
    originalName
    mimeType
    fileSize
    contentHash
    description
    tags
    visibility
    downloadCount
    uploadDate
    updatedAt
    user {
      id
      name
      email
    }
    folder {
      id
      name
    }
  }
}
    `;

/**
 * __useGetSharedWithMeQuery__
 *
 * To run a query within a React component, call `useGetSharedWithMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSharedWithMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSharedWithMeQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetSharedWithMeQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetSharedWithMeQuery, GetSharedWithMeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetSharedWithMeQuery, GetSharedWithMeQueryVariables>(GetSharedWithMeDocument, options);
      }
export function useGetSharedWithMeLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetSharedWithMeQuery, GetSharedWithMeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetSharedWithMeQuery, GetSharedWithMeQueryVariables>(GetSharedWithMeDocument, options);
        }
export type GetSharedWithMeQueryHookResult = ReturnType<typeof useGetSharedWithMeQuery>;
export type GetSharedWithMeLazyQueryHookResult = ReturnType<typeof useGetSharedWithMeLazyQuery>;
export type GetSharedWithMeQueryResult = Apollo.QueryResult<GetSharedWithMeQuery, GetSharedWithMeQueryVariables>;
export const GetPublicFileDocument = gql`
    query GetPublicFile($shareToken: String!) {
  publicFile(shareToken: $shareToken) {
    id
    userId
    folderId
    filename
    originalName
    mimeType
    fileSize
    contentHash
    description
    tags
    visibility
    shareToken
    downloadCount
    uploadDate
    updatedAt
    user {
      id
      name
      email
    }
  }
}
    `;

/**
 * __useGetPublicFileQuery__
 *
 * To run a query within a React component, call `useGetPublicFileQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPublicFileQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPublicFileQuery({
 *   variables: {
 *      shareToken: // value for 'shareToken'
 *   },
 * });
 */
export function useGetPublicFileQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetPublicFileQuery, GetPublicFileQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetPublicFileQuery, GetPublicFileQueryVariables>(GetPublicFileDocument, options);
      }
export function useGetPublicFileLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetPublicFileQuery, GetPublicFileQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetPublicFileQuery, GetPublicFileQueryVariables>(GetPublicFileDocument, options);
        }
export type GetPublicFileQueryHookResult = ReturnType<typeof useGetPublicFileQuery>;
export type GetPublicFileLazyQueryHookResult = ReturnType<typeof useGetPublicFileLazyQuery>;
export type GetPublicFileQueryResult = Apollo.QueryResult<GetPublicFileQuery, GetPublicFileQueryVariables>;
export const GetDownloadUrlDocument = gql`
    query GetDownloadUrl($fileId: ID!, $expirationHours: Int = 1) {
  downloadUrl(fileId: $fileId, expirationHours: $expirationHours)
}
    `;

/**
 * __useGetDownloadUrlQuery__
 *
 * To run a query within a React component, call `useGetDownloadUrlQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDownloadUrlQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDownloadUrlQuery({
 *   variables: {
 *      fileId: // value for 'fileId'
 *      expirationHours: // value for 'expirationHours'
 *   },
 * });
 */
export function useGetDownloadUrlQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetDownloadUrlQuery, GetDownloadUrlQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetDownloadUrlQuery, GetDownloadUrlQueryVariables>(GetDownloadUrlDocument, options);
      }
export function useGetDownloadUrlLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetDownloadUrlQuery, GetDownloadUrlQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetDownloadUrlQuery, GetDownloadUrlQueryVariables>(GetDownloadUrlDocument, options);
        }
export type GetDownloadUrlQueryHookResult = ReturnType<typeof useGetDownloadUrlQuery>;
export type GetDownloadUrlLazyQueryHookResult = ReturnType<typeof useGetDownloadUrlLazyQuery>;
export type GetDownloadUrlQueryResult = Apollo.QueryResult<GetDownloadUrlQuery, GetDownloadUrlQueryVariables>;
export const GetStorageStatsDocument = gql`
    query GetStorageStats {
  storageStats {
    userId
    totalUsed
    originalSize
    savings
    savingsPercentage
    totalUsedFormatted
    originalSizeFormatted
    savingsFormatted
  }
}
    `;

/**
 * __useGetStorageStatsQuery__
 *
 * To run a query within a React component, call `useGetStorageStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetStorageStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetStorageStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetStorageStatsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetStorageStatsQuery, GetStorageStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetStorageStatsQuery, GetStorageStatsQueryVariables>(GetStorageStatsDocument, options);
      }
export function useGetStorageStatsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetStorageStatsQuery, GetStorageStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetStorageStatsQuery, GetStorageStatsQueryVariables>(GetStorageStatsDocument, options);
        }
export type GetStorageStatsQueryHookResult = ReturnType<typeof useGetStorageStatsQuery>;
export type GetStorageStatsLazyQueryHookResult = ReturnType<typeof useGetStorageStatsLazyQuery>;
export type GetStorageStatsQueryResult = Apollo.QueryResult<GetStorageStatsQuery, GetStorageStatsQueryVariables>;
export const GetFileShareInfoDocument = gql`
    query GetFileShareInfo($fileId: ID!) {
  fileShareInfo(fileId: $fileId) {
    isShared
    shareToken
    shareUrl
    downloadCount
    sharedWithUsers {
      id
      shared_with_user_id
      permission_type
      created_at
      shared_with {
        id
        name
        email
      }
    }
  }
}
    `;

/**
 * __useGetFileShareInfoQuery__
 *
 * To run a query within a React component, call `useGetFileShareInfoQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFileShareInfoQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFileShareInfoQuery({
 *   variables: {
 *      fileId: // value for 'fileId'
 *   },
 * });
 */
export function useGetFileShareInfoQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetFileShareInfoQuery, GetFileShareInfoQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetFileShareInfoQuery, GetFileShareInfoQueryVariables>(GetFileShareInfoDocument, options);
      }
export function useGetFileShareInfoLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetFileShareInfoQuery, GetFileShareInfoQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetFileShareInfoQuery, GetFileShareInfoQueryVariables>(GetFileShareInfoDocument, options);
        }
export type GetFileShareInfoQueryHookResult = ReturnType<typeof useGetFileShareInfoQuery>;
export type GetFileShareInfoLazyQueryHookResult = ReturnType<typeof useGetFileShareInfoLazyQuery>;
export type GetFileShareInfoQueryResult = Apollo.QueryResult<GetFileShareInfoQuery, GetFileShareInfoQueryVariables>;
export const SearchUsersDocument = gql`
    query SearchUsers($query: String!, $limit: Int = 10) {
  searchUsers(query: $query, limit: $limit) {
    id
    name
    email
  }
}
    `;

/**
 * __useSearchUsersQuery__
 *
 * To run a query within a React component, call `useSearchUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchUsersQuery({
 *   variables: {
 *      query: // value for 'query'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useSearchUsersQuery(baseOptions: ApolloReactHooks.QueryHookOptions<SearchUsersQuery, SearchUsersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<SearchUsersQuery, SearchUsersQueryVariables>(SearchUsersDocument, options);
      }
export function useSearchUsersLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<SearchUsersQuery, SearchUsersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<SearchUsersQuery, SearchUsersQueryVariables>(SearchUsersDocument, options);
        }
export type SearchUsersQueryHookResult = ReturnType<typeof useSearchUsersQuery>;
export type SearchUsersLazyQueryHookResult = ReturnType<typeof useSearchUsersLazyQuery>;
export type SearchUsersQueryResult = Apollo.QueryResult<SearchUsersQuery, SearchUsersQueryVariables>;