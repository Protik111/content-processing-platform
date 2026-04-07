export interface ICreateContentJob {
  filePath: string;
  type: "TEXT_EXTRACTION" | "SUMMARY";
  userId: string;
}
