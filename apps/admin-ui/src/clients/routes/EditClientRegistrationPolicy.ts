import { lazy } from "react";
import type { Path } from "react-router-dom-v5-compat";
import { generatePath } from "react-router-dom-v5-compat";
import type { RouteDef } from "../../route-config";

export type EditClientRegistrationPolicyParams = {
  realm: string;
  policyId: string;
  policyName: string;
  providerName: string;
};

export const EditClientRegistrationPolicyRoute: RouteDef = {
  path: "/:realm/clients/client-registration/:policyName/:policyId/:providerName/edit-client-registration-policy",
  component: lazy(() => import("../NewClientRegistrationPolicyForm")),
  access: "manage-realm",
  breadcrumb: (t) => t("clients:policyDetails"),
};

export const toEditClientRegistrationPolicy = (
  params: EditClientRegistrationPolicyParams
): Partial<Path> => ({
  pathname: generatePath(EditClientRegistrationPolicyRoute.path, params),
});
