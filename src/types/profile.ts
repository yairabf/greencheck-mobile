export type UserProfile = {
  uid: string;
  name: string;
  phone: string;
  teamIds: string[];
  locale?: 'en' | 'he';
  createdAt?: unknown;
  updatedAt?: unknown;
};
