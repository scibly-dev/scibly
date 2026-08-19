import type { auth } from "./auth-config";

export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];
