import { Injectable } from '@nestjs/common';
import { CopperxApiService } from '../shared/copperx-api.service';
import {
  PurposeCode,
  RecipientRelationship,
  SourceOfFunds,
  TransferHistoryResponse,
} from 'src/types';

@Injectable()
export class TransferService {
  constructor(private readonly copperx: CopperxApiService) {}

  purposeCodes = [
    { label: 'Self', value: 'self' },
    { label: 'Salary', value: 'salary' },
    { label: 'Gift', value: 'gift' },
    { label: 'Income', value: 'income' },
    { label: 'Saving', value: 'saving' },
    { label: 'Education Support', value: 'education_support' },
    { label: 'Family', value: 'family' },
    { label: 'Home Improvement', value: 'home_improvement' },
    { label: 'Reimbursement', value: 'reimbursement' },
  ];

  async getTransferHistory(accessToken: string) {
    return this.copperx.get<TransferHistoryResponse>(
      '/api/transfers?page=1&limit=10',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  }

  async emailTransfer(
    accessToken: string,
    data: {
      walletAddress?: string;
      email: string;
      payeeId: string;
      amount: string;
      purposeCode: PurposeCode;
      currency: string;
    },
  ) {
    return this.copperx.post('/api/transfers/send', data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async bankTransfer(
    accessToken: string,
    data: {
      invoiceNumber: string;
      invoiceUrl: string;
      purposeCode: PurposeCode;
      sourceOfFunds: SourceOfFunds;
      recipientRelationship: RecipientRelationship;
      quotePayload: string;
      quoteSignature: string;
      preferredWalletId: string;
      customerData: {
        name: string;
        businessName: string;
        email: string;
        country: string;
      };
    },
  ) {
    return this.copperx.post('/api/transfers/offramp', data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async walletTransfer(
    accessToken: string,
    data: {
      walletAddress: string;
      amount: string;
      purposeCode: PurposeCode;
      currency: string;
    },
  ) {
    return this.copperx.post('/api/transfers/wallet-withdraw', data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async bulkTransfer(accessToken: string, data) {
    return this.copperx.post('/api/transfers/send-batch', data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }
}
