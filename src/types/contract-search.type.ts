import type { BaseResponse } from "@/types/response.type";
import type { SearchItem } from "@/components/contract-search-item";

export type { SearchItem };

export type ContractSearchFilterType = "Semua" | "Draft" | "Review";

export interface ContractSearchParams {
  userId: string;
  query?: string;
  filter?: ContractSearchFilterType;
  limit?: number;
  offset?: number;
}

export interface ContractSearchResultData {
  items: SearchItem[];
  totalCount: number;
}

export type ContractSearchResponse = BaseResponse<ContractSearchResultData>;
