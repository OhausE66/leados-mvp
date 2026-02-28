import { AppData, Booking, CaseRecord, PlatformMessage } from "@/lib/domain/types";

export interface StorageAdapter {
  getData(): Promise<AppData>;
  saveData(data: AppData): Promise<void>;
  listCases(): Promise<CaseRecord[]>;
  getCase(caseId: string): Promise<CaseRecord | null>;
  upsertCase(caseRecord: CaseRecord): Promise<void>;
  listMessages(): Promise<PlatformMessage[]>;
  upsertMessage(message: PlatformMessage): Promise<void>;
  getMessage(messageId: string): Promise<PlatformMessage | null>;
  listBookings(): Promise<Booking[]>;
  upsertBooking(booking: Booking): Promise<void>;
  getBooking(bookingId: string): Promise<Booking | null>;
}

export const emptyData: AppData = {
  cases: {},
  messages: {},
  bookings: {},
};
