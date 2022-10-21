import { lazy } from "react";
import type { Path } from "react-router-dom-v5-compat";
import { generatePath } from "react-router-dom-v5-compat";
import type { RouteDef } from "../../route-config";

export type ClientRegistrationSubTab = "anonymous" | "authenticated";

export type ClientRegistrationParams = {
  realm: string;
  tab: ClientRegistrationSubTab;
};

export const ClientRegistrationRoute: RouteDef = {
  path: "/:realm/clients/client-registration/:tab",
  component: lazy(() => import("../ClientsSection")),
  access: "view-clients",
};

export const toClientRegistrationTab = (
  params: ClientRegistrationParams
): Partial<Path> => ({
  pathname: generatePath(ClientRegistrationRoute.path, params),
});
