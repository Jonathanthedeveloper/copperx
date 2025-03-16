export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string;
  organizationId: string;
  role: 'owner' | 'user' | 'admin' | 'member';
  status: 'pending' | 'active' | 'suspended';
  type: 'individual' | 'business';
  relayerAddress: string;
  flags: string[];
  walletAddress: string;
  walletId: string;
  walletAccountType: string;
};

type AuthStep = 'AWAITING_EMAIL' | 'AWAITING_OTP';

type Auth = {
  email?: string;
  sid?: string;
  access_token?: string;
};

declare module 'telegraf' {
  interface Context {
    session: {
      step?: AuthStep;
      user?: User;
      auth?: Auth;
    };
  }
}
