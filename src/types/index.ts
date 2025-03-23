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

type WalletAccountType =
  | 'web3_auth_copperx'
  | 'safe'
  | 'circle_dev'
  | 'eoa'
  | 'other'
  | 'quantum;';

export type Wallet = {
  id: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  walletType: WalletAccountType;
  walletAddress: string;
  network: string;
  isDefault: boolean;
};

export type Balance = {
  decimals: number;
  balance: string;
  symbol: string;
  address: string;
};

export type WalletBalance = {
  walletId: string;
  isDefault: boolean;
  network: string;
  balances: Balance[];
};

export type Customer = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  businessName: string;
  email: string;
  country: string;
};

export type Payee = {
  id: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  nickName: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  displayName: string;
  bankAccount: PayeeBankAccount;
  isGuest: boolean;
  hasBankAccount: boolean;
};

export type PayeeBankAccount = {
  country: Country;
  bankName: string;
  bankAddress: string;
  type: TransferAccountType;
  bankAccountType: BankAccountType;
  bankRoutingNumber: string;
  bankAccountNumber: string;
  bankBeneficiaryName: string;
  bankBeneficiaryAddress: string;
  swiftCode: string;
};

export type TransferAccountType =
  | 'web3_wallet'
  | 'bank_ach'
  | 'bank_ach_push'
  | 'bank_wire'
  | 'bank_transfer'
  | 'bank_ifsc'
  | 'bank_iban';
export type BankAccountType = 'web3_wallet' | 'bank_account';
export type AccountType = 'web3_wallet' | 'bank_account';

export type CreatePayee = {
  nickName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  bankAccount?: {
    country: Country;
    bankName: string;
    bankAddress: string;
    type: AccountType;
    bankAccountType: BankAccountType;
    bankRoutingNumber: string;
    bankAccountNumber: string;
    bankBeneficiaryName: string;
    bankBeneficiaryAddress: string;
    swiftCode: string;
  };
};

export type PurposeCode =
  | 'self'
  | 'salary'
  | 'gift'
  | 'income'
  | 'saving'
  | 'education_support'
  | 'family'
  | 'home_improvement'
  | 'reimbursement';

export type SourceOfFunds =
  | 'salary'
  | 'savings'
  | 'lottery'
  | 'investment'
  | 'loan'
  | 'business_income'
  | 'others';

export type RecipientRelationship =
  | 'self'
  | 'spouse'
  | 'son'
  | 'daughter'
  | 'father'
  | 'mother'
  | 'other';

export type Country =
  | 'usa'
  | 'ind'
  | 'are'
  | 'idn'
  | 'pak'
  | 'sgp'
  | 'esp'
  | 'can'
  | 'cym'
  | 'lbn'
  | 'mys'
  | 'pan'
  | 'tur'
  | 'vct'
  | 'vgb'
  | 'vnm'
  | 'bel'
  | 'tha'
  | 'hkg'
  | 'aut'
  | 'hrv'
  | 'cyp'
  | 'est'
  | 'fin'
  | 'fra'
  | 'gre'
  | 'irl'
  | 'ita'
  | 'lva'
  | 'ltu'
  | 'lux'
  | 'mlt'
  | 'nld'
  | 'prt'
  | 'svk'
  | 'svn'
  | 'deu'
  | 'bgd'
  | 'phl'
  | 'khm'
  | 'aus'
  | 'gbr'
  | 'npl'
  | 'lka'
  | 'ben'
  | 'cmr'
  | 'gha'
  | 'ken'
  | 'moz'
  | 'sen'
  | 'tza'
  | 'uga'
  | 'nzl'
  | 'kor'
  | 'mmr'
  | 'jpn'
  | 'bra'
  | 'chn'
  | 'none';

export type DepositAccount = {
  id: string;
  createdAt: string;
  updatedAt: string;
  type: string;
  country: string;
  network: string;
  accountId: string;
  walletAddress: string;
  bankName: string;
  bankAddress: string;
  bankRoutingNumber: string;
  bankAccountNumber: string;
  bankDepositMessage: string;
  wireMessage: string;
  payeeEmail: string;
  payeeOrganizationId: string;
  payeeId: string;
  payeeDisplayName: string;
};

export type Kyc = {
  id: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  status: KycStatus;
  type: CustomerProfileType;
  country: string;
  providerCode: ProviderCode;
  kycProviderCode: KycProviderCode;
  kycDetailId: string;
  kybDetailId: string;
  kycDetail: KycDetail;
  kybDetail: KybDetail;
  kycAdditionalDocuments: string;
  statusUpdates: string;
};
type KybDetail = {
  id: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  companyName: string;
  companyDescription: string;
  website: string;
  incorporationDate: string;
  incorporationCountry: string;
  incorporationNumber: string;
  companyType: string;
  companyTypeOther: string;
  natureOfBusiness: string;
  natureOfBusinessOther: string;
  sourceOfFund: string;
  sourceOfFundOther: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  email: string;
  phoneNumber: string;
  currentKybVerificationId: string;
  currentKybVerification: KybVerification;
  kybDocuments: string;
  kycDetails: string;
  sourceOfFundDescription: string;
  expectedMonthlyVolume: string;
  purposeOfFund: PurposeOfFund;
  purposeOfFundOther: string;
  operatesInProhibitedCountries: string;
  taxIdentificationNumber: string;
  highRiskActivities: string;
};
type PurposeOfFund =
  | 'business_transactions'
  | 'charitable_donations'
  | 'investment_purposes'
  | 'payments_to_friends_or_family_abroad'
  | 'payroll'
  | 'personal_or_living_expenses'
  | 'protect_wealth'
  | 'purchase_goods_and_services'
  | 'receive_payments_for_goods_and_services'
  | 'tax_optimization'
  | 'other';
type KybVerification = {
  id: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  kybDetailId: string;
  kybProviderCode: KycProviderCode;
  externalCustomerId: string;
  externalKybId: string;
  status: KycStatus;
  externalStatus: string;
  verifiedAt: string;
};
type KycProviderCode =
  | 'sumsub'
  | 'sumsub_uae'
  | 'sumsub_global'
  | 'hyperverge_ind'
  | 'persona'
  | 'manual';
type ProviderCode =
  | '0x0'
  | '0x1'
  | '0x2'
  | '0x11'
  | '0x21'
  | '0x22'
  | '0x31'
  | '0x41'
  | '0x23'
  | '0x24'
  | '0xffff';
type CustomerProfileType = 'individual' | 'business';
type KycStatus =
  | 'pending'
  | 'initiated'
  | 'inprogress'
  | 'review_pending'
  | 'review'
  | 'provider_manual_review'
  | 'manual_review'
  | 'provider_on_hold'
  | 'on_hold'
  | 'expired'
  | 'approved'
  | 'rejected';
type KycDetail = {
  id: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  kybDetailId: string;
  nationality: string;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  positionAtCompany: string;
  sourceOfFund: string;
  currentKycVerificationId: string;
  currentKycVerification: KycVerification;
  kycDocuments: string;
  kycUrl: string;
  uboTypeUBOType: string;
  percentageOfShares: string;
  joiningDate: string;
};
type KycVerification = {
  id: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  kybDetailId: string;
  kybProviderCode: KycProviderCode;
  externalCustomerId: string;
  externalKybId: string;
  status: KycStatus;
  externalStatus: string;
  verifiedAt: string;
};

export type Transaction = {
  id: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  type: string;
  providerCode: string;
  kycId: string;
  transferId: string;
  status: string;
  externalStatus: string;
  fromAccountId: string;
  toAccountId: string;
  fromAmount: string;
  fromCurrency: string;
  toAmount: string;
  toCurrency: string;
  totalFee: string;
  feeCurrency: string;
  transactionHash: string;
  depositAccount: DepositAccount;
  externalTransactionId: string;
  externalCustomerId: string;
  depositUrl: string;
};

export type Account = {
  id: string;
  createdAt: string;
  updatedAt: string;
  type: string;
  country: string;
  network: string;
  accountId: string;
  walletAddress: string;
  bankName: string;
  bankAddress: string;
  bankRoutingNumber: string;
  bankAccountNumber: string;
  bankDepositMessage: string;
  wireMessage: string;
  payeeEmail: string;
  payeeOrganizationId: string;
  payeeId: string;
  payeeDisplayName: string;
};

export type Transfer = {
  id: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  status: string;
  customerId: string;
  customer: Customer;
  type: string;
  sourceCountry: string;
  destinationCountry: string;
  destinationCurrency: string;
  amount: string;
  currency: string;
  amountSubtotal: string;
  totalFee: string;
  feePercentage: string;
  feeCurrency: string;
  invoiceNumber: string;
  invoiceUrl: string;
  sourceOfFundsFile: string;
  note: string;
  purposeCode: string;
  sourceOfFunds: string;
  recipientRelationship: string;
  sourceAccountId: string;
  destinationAccountId: string;
  paymentUrl: string;
  mode: string;
  isThirdPartyPayment: boolean;
  transactions: Transaction[];
  destinationAccount: Account;
  sourceAccount: Account;
  senderDisplayName: string;
};

export type InviteCode = {
  id: string;
  createdAt: string;
  updatedAt: string;
  code: string;
  type: InviteCodeType;
  status: InviteCodeStatus;
  expirationDate: string;
  createdByOrgId: string;
  usedByOrgId: string;
};

export type InviteCodeType = 'virtual_account_us';
export type InviteCodeStatus = 'active' | 'used' | 'expired';

export type TransferHistoryResponse = {
  page: number;
  limit: number;
  count: number;
  hasMore: boolean;
  data: Transfer[];
};

type Auth = {
  email?: string;
  sid?: string;
  access_token?: string;
};

declare module 'telegraf' {
  interface Context {
    session: {
      user?: User;
      auth?: Auth;
    };
  }
  interface WizardContext {
    session: {
      user?: User;
      auth?: Auth;
    };
  }
  interface SceneContext {
    session: {
      user?: User;
      auth?: Auth;
    };
  }
}
