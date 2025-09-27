declare module 'express-session' {
  interface SessionData {
    token?: string;
    admin?: {
      username: string;
      role: string;
    };
  }
}