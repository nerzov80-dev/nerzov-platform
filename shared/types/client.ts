export interface Client {
  id: string;
  businessName: string;
  phone: string;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientInput {
  businessName: string;
  phone: string;
  email?: string;
}

export interface UpdateClientInput {
  businessName: string;
  phone: string;
  email?: string;
  isActive: boolean;
}

export interface ClientCredential {
  username: string;
  password: string;
}

export interface ClientWithCredentials extends Client {
  credentials: ClientCredential;
}

export interface ClientDashboardData {
  client: Client;
  landingPages: Array<{
    id: string;
    template: string;
    slug: string;
    status: string;
    createdAt: string;
  }>;
}
