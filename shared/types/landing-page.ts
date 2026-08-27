import type {
  LandingPageStatus,
  LandingPageTemplate,
} from "../constants";

export interface LandingPage {
  id: string;
  clientId: string;
  template: LandingPageTemplate;
  slug: string;
  status: LandingPageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLandingPageInput {
  clientId: string;
  template: LandingPageTemplate;
  slug: string;
}
