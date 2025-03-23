import { Injectable } from '@nestjs/common';
import { CopperxApiService } from 'src/modules/shared/copperx-api.service';
import { Country, CreatePayee, Payee } from 'src/types';

@Injectable()
export class PayeeService {
  constructor(private readonly copperx: CopperxApiService) {}

  getAllPayees(accessToken: string) {
    return this.copperx.get<{
      page: 1;
      limit: 10;
      count: 1;
      hasMore: true;
      data: Payee[];
    }>('api/payees', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  createPayee(accessToken: string, data: CreatePayee) {
    return this.copperx.post<Payee>('api/payees', data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  getPayeeById(accessToken: string, payeeId: string) {
    return this.copperx.get<Payee>(`api/payees/${payeeId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  deletePayee(accessToken: string, payeeId: string) {
    return this.copperx.delete(`api/payees/${payeeId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }
}
