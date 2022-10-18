import { useState } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Tab, TabTitleText } from "@patternfly/react-core";

import type ComponentRepresentation from "@keycloak/keycloak-admin-client/lib/defs/componentRepresentation";
import { useAdminClient, useFetch } from "../../context/auth/AdminClient";
import { useRealm } from "../../context/realm-context/RealmContext";
import { KEY_PROVIDER_TYPE } from "../../util";
import {
  routableTab,
  RoutableTabs,
} from "../../components/routable-tabs/RoutableTabs";
import {
  ClientRegistrationSubTab,
  toClientRegistrationTab,
} from "../routes/ClientRegistrationTab";
import { KeycloakSpinner } from "../../components/keycloak-spinner/KeycloakSpinner";
import { AnonymousAccessPoliciesTab } from "./AnonymousAccessPoliciesTab";
import { AuthenticatedAccessPoliciesTab } from "./AuthenticatedAccessPoliciesTab";

const sortByPriority = (components: ComponentRepresentation[]) => {
  const sortedComponents = [...components].sort((a, b) => {
    const priorityA = Number(a.config?.priority);
    const priorityB = Number(b.config?.priority);

    return (
      (!isNaN(priorityB) ? priorityB : 0) - (!isNaN(priorityA) ? priorityA : 0)
    );
  });

  return sortedComponents;
};

export const ClientRegistrationTab = () => {
  const { t } = useTranslation("clients");
  const history = useHistory();

  const { adminClient } = useAdminClient();
  const { realm: realmName } = useRealm();

  const [realmComponents, setRealmComponents] =
    useState<ComponentRepresentation[]>();

  useFetch(
    () =>
      adminClient.components.find({
        type: KEY_PROVIDER_TYPE,
        realm: realmName,
      }),
    (components) => setRealmComponents(sortByPriority(components)),
    []
  );

  if (!realmComponents) {
    return <KeycloakSpinner />;
  }

  const keysRoute = (tab: ClientRegistrationSubTab) =>
    routableTab({
      to: toClientRegistrationTab({ realm: realmName, tab }),
      history,
    });

  return (
    <RoutableTabs
      mountOnEnter
      unmountOnExit
      defaultLocation={toClientRegistrationTab({
        realm: realmName,
        tab: "anonymous",
      })}
    >
      <Tab
        id="anonymousAccessPolicies"
        data-testid="rs-anonymous-access-policies-tab"
        aria-label="anonymous-access-policies-subtab"
        title={<TabTitleText>{t("anonymousAccessPolicies")}</TabTitleText>}
        {...keysRoute("anonymous")}
      >
        <AnonymousAccessPoliciesTab />
      </Tab>
      <Tab
        id="authenticatedAccessPolicies"
        data-testid="rs-authenticated-access-policies-tab"
        aria-label="rs-authenticated-access-policies-tab"
        title={<TabTitleText>{t("authenticatedAccessPolicies")}</TabTitleText>}
        {...keysRoute("authenticated")}
      >
        <AuthenticatedAccessPoliciesTab />
      </Tab>
    </RoutableTabs>
  );
};
