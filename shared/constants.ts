export const APP_NAME = "Nerzov";

export const ROUTES = {
  LOGIN: "/login",
  ADMIN: "/admin",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_CLIENTS: "/admin/clients",
  CLIENT: "/client",
  CLIENT_DASHBOARD: "/client/dashboard",
} as const;

export const API_ROUTES = {
  LOGIN: "/api/auth/login",
  SETUP: "/api/auth/setup",
  ME: "/api/auth/me",

  CLIENTS: "/api/admin/clients",
  LANDING_PAGES: "/api/admin/landing-pages",

  CLIENT_DASHBOARD: "/api/client/dashboard",
} as const;

export const ROLES = {
  ADMIN: "admin",
  CLIENT: "client",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const LANDING_PAGE_TEMPLATES = [
  "template1",
  "template2",
  "template3",
  "template4",
  "template5",
] as const;

export type LandingPageTemplate =
  (typeof LANDING_PAGE_TEMPLATES)[number];

export const LANDING_PAGE_STATUSES = [
  "draft",
  "published",
] as const;

export type LandingPageStatus =
  (typeof LANDING_PAGE_STATUSES)[number];

export const KV_KEYS = {
  landingPageHtml: (slug: string) => `lp:html:${slug}`,
  visitor: (landingPageId: string, date: string) =>
    `visitor:${landingPageId}:${date}`,
  usage: (date: string) => `usage:${date}`,
} as const;

export const AUTH_STORAGE_KEY = "nerzov_auth";
