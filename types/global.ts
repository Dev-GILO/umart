export interface PaystackResponse {
  reference: string;
  status: string;
  message: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    paid_at: string;
    customer: {
      email: string;
    };
  };
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: PaystackConfig) => {
        openIframe: () => void;
      };
    };
  }
}

interface PaystackConfig {
  key: string;
  email: string;
  amount: number;
  ref: string;
  onClose: () => void;
  onSuccess: (response: PaystackResponse) => void;
}

export {};
    