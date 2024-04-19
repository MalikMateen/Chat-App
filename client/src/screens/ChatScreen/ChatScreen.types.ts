export type GroupMessage = {
  [room: string]: { userId: string; message: string }[];
};

export type Typing = {
  [key: string]: string[];
};
