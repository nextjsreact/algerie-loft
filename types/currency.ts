export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  is_default: boolean;
  ratio: number;
}