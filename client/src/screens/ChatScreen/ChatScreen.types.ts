export type Message = {
  [room: string]: { userId: string; message: string }[];
};
