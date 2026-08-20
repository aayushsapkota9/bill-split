// ─── Core Domain Types ────────────────────────────────────────────────────────

export interface Friend {
  id: string;
  name: string;
  colorIdx: number;
}

export interface ItemShare {
  friendId: string;
  qty: number; // can be 0.4, 0.5, 1, 2, etc.
}

export interface BillItem {
  id: string;
  name: string;
  price: number; // Unit final price with VAT (or flat price if non-VAT)
  totalQty: number;
  shares: ItemShare[];
  hasVat?: boolean; // true = 13% VAT, false = Non-VAT (default true)
}

export interface FeeConfig {
  type: "flat" | "percent";
  value: number;
}

export interface SavedBill {
  id: string;
  title: string;
  date: string;
  friends: Friend[];
  items: BillItem[];
  isVatBill?: boolean;
  flatFee: FeeConfig;
  discount: FeeConfig;
  tax: FeeConfig;
  tip: FeeConfig;
  grandTotal: number;
}

export interface JsonExportPayload {
  version: number;
  type: "billsplit_current_bill" | "billsplit_full_backup" | "billsplit_saved_bills";
  exportedAt: string;
  bill?: {
    title: string;
    friends: Friend[];
    items: BillItem[];
    flatFee: FeeConfig;
    discount: FeeConfig;
    tax: FeeConfig;
    tip: FeeConfig;
    grandTotal: number;
  };
  currentDraft?: {
    title: string;
    friends: Friend[];
    items: BillItem[];
    flatFee: FeeConfig;
    discount: FeeConfig;
    tax: FeeConfig;
    tip: FeeConfig;
  };
  savedBills?: SavedBill[];
}
