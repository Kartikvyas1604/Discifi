import { EventEmitter } from 'eventemitter3';

export const walletEvents = new EventEmitter();

export const EVENTS = {
  TRANSACTION_CONFIRMED: 'TRANSACTION_CONFIRMED',
  BALANCE_SHOULD_REFRESH: 'BALANCE_SHOULD_REFRESH',
};

export interface TransactionConfirmedPayload {
  signature: string;
  amount?: number;
  token?: string;
  destination?: string;
  type?: string;
}
