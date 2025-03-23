import { Injectable } from '@nestjs/common';
import { CopperxApiService } from '../shared/copperx-api.service';
import { Transaction } from 'src/types';

@Injectable()
export class TransactionsService {
  constructor(private readonly copperx: CopperxApiService) {}

  getAllTransactions(
    accessToken: string,
    query?: {
      page?: number;
      limit?: number;
      transferId?: string;
      kycId?: string;
    },
  ) {
    // Construct the query string if query parameters are provided
    let queryString = '';
    if (query) {
      const queryParams = new URLSearchParams();
      if (query.page) queryParams.append('page', query.page.toString());
      if (query.limit) queryParams.append('limit', query.limit.toString());
      if (query.transferId) queryParams.append('transferId', query.transferId);
      if (query.kycId) queryParams.append('kycId', query.kycId);

      queryString = `?${queryParams.toString()}`;
    }

    // Define the request URL with the query string
    const url = `api/transactions${queryString}`;

    // Define the request options
    const options = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    // Make the GET request
    return this.copperx.get<{
      page: number;
      limit: number;
      count: number;
      hasMore: boolean;
      data: Transaction[];
    }>(url, options);
  }
}
