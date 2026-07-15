export interface Checker {
  sendForApproval(imagePath: string, caption: string): Promise<boolean>
}
