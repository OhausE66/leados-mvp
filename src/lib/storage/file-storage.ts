import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Booking, CaseRecord, PlatformMessage } from "@/lib/domain/types";
import { emptyData, StorageAdapter } from "@/lib/storage/interface";

export class FileStorage implements StorageAdapter {
  private readonly filePath: string;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(filePath = path.join(process.cwd(), "data", "app_storage.json")) {
    this.filePath = filePath;
  }

  async getData() {
    try {
      const raw = await readFile(this.filePath, "utf-8");
      return JSON.parse(raw);
    } catch {
      await this.ensureDir();
      await writeFile(this.filePath, JSON.stringify(emptyData, null, 2), "utf-8");
      return structuredClone(emptyData);
    }
  }

  async saveData(data: typeof emptyData) {
    this.writeQueue = this.writeQueue.then(async () => {
      await this.ensureDir();
      await writeFile(this.filePath, JSON.stringify(data, null, 2), "utf-8");
    });
    return this.writeQueue;
  }

  async listCases() {
    const data = await this.getData();
    return Object.values(data.cases) as CaseRecord[];
  }

  async getCase(caseId: string) {
    const data = await this.getData();
    return (data.cases[caseId] as CaseRecord | undefined) ?? null;
  }

  async upsertCase(caseRecord: CaseRecord) {
    const data = await this.getData();
    data.cases[caseRecord.id] = caseRecord;
    await this.saveData(data);
  }

  async listMessages() {
    const data = await this.getData();
    return Object.values(data.messages) as PlatformMessage[];
  }

  async upsertMessage(message: PlatformMessage) {
    const data = await this.getData();
    data.messages[message.id] = message;
    await this.saveData(data);
  }

  async getMessage(messageId: string) {
    const data = await this.getData();
    return (data.messages[messageId] as PlatformMessage | undefined) ?? null;
  }

  async listBookings() {
    const data = await this.getData();
    return Object.values(data.bookings) as Booking[];
  }

  async upsertBooking(booking: Booking) {
    const data = await this.getData();
    data.bookings[booking.id] = booking;
    await this.saveData(data);
  }

  async getBooking(bookingId: string) {
    const data = await this.getData();
    return (data.bookings[bookingId] as Booking | undefined) ?? null;
  }

  private async ensureDir() {
    await mkdir(path.dirname(this.filePath), { recursive: true });
  }
}
