import { lazy } from "react";
import type { Path } from "react-router-dom-v5-compat";
import { generatePath } from "react-router-dom-v5-compat";
import type { RouteDef } from "../../route-config";

export type NewPolicyProviderParams = {
  realm: string;
  id: string;
  policyProviderType: string;
};

export const NewPolicyProviderRoute: RouteDef = {
  path: "/:realm/clients/:id/client-registration/new/:policyProviderType",
  component: lazy(() => import("../client-registration/PolicyDetails")),
  breadcrumb: (t) => t("clients:createPolicy"),
  access: "view-clients",
};

export const toCreatePolicyProvider = (
  params: NewPolicyProviderParams
): Partial<Path> => ({
  pathname: generatePath(NewPolicyProviderRoute.path, params),
});
