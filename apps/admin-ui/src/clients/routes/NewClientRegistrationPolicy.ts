import { lazy } from "react";
import type { Path } from "react-router-dom-v5-compat";
import { generatePath } from "react-router-dom-v5-compat";
import type { RouteDef } from "../../route-config";

export type ClientRegistrationSubTab =
  | "anonymous-access-policies"
  | "authenticated-access-policies";

export type NewClientRegistrationPolicyParams = {
  realm: string;
  tab: ClientRegistrationSubTab;
  providerId: string;
};

export const NewClientRegistrationPolicyRoute: RouteDef = {
  path: "/:realm/clients/client-registration/:tab/new/:providerId",
  component: lazy(() => import("../NewClientRegistrationPolicyForm")),
  breadcrumb: (t) => t("clients:createPolicy"),
  access: "view-clients",
};

export const toCreateClientRegistrationPolicy = (
  params: NewClientRegistrationPolicyParams
): Partial<Path> => ({
  pathname: generatePath(NewClientRegistrationPolicyRoute.path, params),
});
