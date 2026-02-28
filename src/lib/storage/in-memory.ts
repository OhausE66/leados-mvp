import { Booking, CaseRecord, PlatformMessage } from "@/lib/domain/types";
import { emptyData, StorageAdapter } from "@/lib/storage/interface";

export class InMemoryStorage implements StorageAdapter {
  private data = structuredClone(emptyData);

  async getData() {
    return this.data;
  }

  async saveData(data: typeof emptyData) {
    this.data = data;
  }

  async listCases() {
    return Object.values(this.data.cases);
  }

  async getCase(caseId: string) {
    return this.data.cases[caseId] ?? null;
  }

  async upsertCase(caseRecord: CaseRecord) {
    this.data.cases[caseRecord.id] = caseRecord;
  }

  async listMessages() {
    return Object.values(this.data.messages);
  }

  async upsertMessage(message: PlatformMessage) {
    this.data.messages[message.id] = message;
  }

  async getMessage(messageId: string) {
    return this.data.messages[messageId] ?? null;
  }

  async listBookings() {
    return Object.values(this.data.bookings);
  }

  async upsertBooking(booking: Booking) {
    this.data.bookings[booking.id] = booking;
  }

  async getBooking(bookingId: string) {
    return this.data.bookings[bookingId] ?? null;
  }
}
