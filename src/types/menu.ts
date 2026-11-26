// All money values are integer poisha (1 BDT = 100 poisha).

export type Option = {
  id: string;
  name: string;
  price: number;
  uses: Record<string, number>; // ingredient -> amount per 1 unit
};

export type Group = {
  id: string;
  name: string;
  min: number;
  max?: number;
  step?: number;
  maxDistinct?: number;
  maxPerOption?: number;
  options: Option[];
};

export type Rule =
  | { id: string; type: "requires"; option: string; anyOf: string[] }
  | { id: string; type: "excludes"; option: string; with: string[] }
  | { id: string; type: "overrideLimit"; option: string; group: string; max: number };

export type Promotion =
  | { id: string; type: "extrasDeal"; group: string; every: number }
  | { id: string; type: "combo"; minQty: Record<string, number>; percent: number }
  | { id: string; type: "cartFlat"; minSubtotal: number; amount: number }
  | {
      id: string;
      type: "coupon";
      code: string;
      percent: number;
      cap: number;
      before: string;
      timeZone: string;
    };

export type Menu = {
  product: { id: string; name: string; basePrice: number; maxQuantity: number };
  groups: Group[];
  rules: Rule[];
  stock: Record<string, number>;
  promotions: Promotion[];
  vatPercent: number;
  paymentMethods: string[];
};

// What the user picked: option id -> quantity
export type Config = Record<string, number>;
