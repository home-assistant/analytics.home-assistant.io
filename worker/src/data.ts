export interface SanitizedPayload {
  version: string;
  country?: string;
  installation_type: string;
  integrations?: string[];
  addons?: { slug: string }[];
  last_write?: number;
  state_count?: number;
  addon_count?: number;
  automation_count?: number;
  integration_count?: number;
  user_count?: number;
}

export const AllowedPayloadKeys = [
  "addon_count",
  "addons",
  "automation_count",
  "installation_type",
  "integration_count",
  "integrations",
  "last_write",
  "state_count",
  "supervisor",
  "user_count",
  "version",
];

export const InstallationTypes = [
  "Home Assistant OS",
  "Home Assistant Container",
  "Home Assistant Core",
  "Home Assistant Supervised",
];
