import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Tab, TabTitleText, Tooltip } from "@patternfly/react-core";
import { useRealm } from "../../context/realm-context/RealmContext";
import {
  routableTab,
  RoutableTabs,
} from "../../components/routable-tabs/RoutableTabs";
import {
  ClientRegistrationSubTab,
  toClientRegistrationTab,
} from "../routes/ClientRegistrationTab";
import { AnonymousAccessPoliciesTab } from "./AnonymousAccessPoliciesTab";
import { AuthenticatedAccessPoliciesTab } from "./AuthenticatedAccessPoliciesTab";

export const ClientRegistrationTab = () => {
  const { t } = useTranslation("clients");
  const history = useHistory();
  const { realm: realmName } = useRealm();

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
        tooltip={<Tooltip content={t("anonymousAccessPoliciesHelpText")} />}
        {...keysRoute("anonymous")}
      >
        <AnonymousAccessPoliciesTab />
      </Tab>
      <Tab
        id="authenticatedAccessPolicies"
        data-testid="rs-authenticated-access-policies-tab"
        aria-label="rs-authenticated-access-policies-tab"
        title={<TabTitleText>{t("authenticatedAccessPolicies")}</TabTitleText>}
        tooltip={<Tooltip content={t("authenticatedAccessPoliciesHelpText")} />}
        {...keysRoute("authenticated")}
      >
        <AuthenticatedAccessPoliciesTab />
      </Tab>
    </RoutableTabs>
  );
};
