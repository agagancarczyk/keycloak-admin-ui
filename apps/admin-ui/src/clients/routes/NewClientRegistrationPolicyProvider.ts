import { lazy } from "react";
import type { Path } from "react-router-dom-v5-compat";
import { generatePath } from "react-router-dom-v5-compat";
import type { RouteDef } from "../../route-config";

export type NewClientRegistrationPolicyProviderParams = {
  realm: string;
  policyProviderId: string;
};

export const NewClientRegistrationPolicyProviderRoute: RouteDef = {
  path: "/:realm/clients/client-registration/new/:policyProviderId",
  component: lazy(() => import("../NewClientRegistrationPolicyForm")),
  breadcrumb: (t) => t("clients:createPolicy"),
  access: "view-clients",
};

export const toCreateClientRegistrationPolicyProvider = (
  params: NewClientRegistrationPolicyProviderParams
): Partial<Path> => ({
  pathname: generatePath(NewClientRegistrationPolicyProviderRoute.path, params),
});
