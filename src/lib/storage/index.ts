import { FileStorage } from "@/lib/storage/file-storage";
import { InMemoryStorage } from "@/lib/storage/in-memory";

const driver = process.env.STORAGE_DRIVER ?? "file";

export const storage = driver === "memory" ? new InMemoryStorage() : new FileStorage();
