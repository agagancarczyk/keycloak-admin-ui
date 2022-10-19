/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom-v5-compat";
import { useTranslation } from "react-i18next";
import {
  AlertVariant,
  Button,
  ButtonVariant,
  ToolbarItem,
} from "@patternfly/react-core";
import { ListEmptyState } from "../../components/list-empty-state/ListEmptyState";
import { KeycloakDataTable } from "../../components/table-toolbar/KeycloakDataTable";
import { useConfirmDialog } from "../../components/confirm-dialog/ConfirmDialog";
import { useAdminClient, useFetch } from "../../context/auth/AdminClient";
import { KeycloakSpinner } from "../../components/keycloak-spinner/KeycloakSpinner";
import { useRealm } from "../../context/realm-context/RealmContext";
import { useAlerts } from "../../components/alert/Alerts";
import ClientPolicyRepresentation from "@keycloak/keycloak-admin-client/lib/defs/clientPolicyRepresentation";
import useToggle from "../../utils/useToggle";
import { NewPolicyDialog } from "./NewPolicyDialog";
import { toCreatePolicyProvider } from "../routes/NewPolicyProvider";
import PolicyProviderRepresentation from "@keycloak/keycloak-admin-client/lib/defs/policyProviderRepresentation";
import { useServerInfo } from "../../context/server-info/ServerInfoProvider";
import ComponentRepresentation from "@keycloak/keycloak-admin-client/lib/defs/componentRepresentation";
import useLocaleSort, { mapByKey } from "../../utils/useLocaleSort";
import { toEditClientRegistrationPolicy } from "../routes/EditClientRegistrationPolicy";

export const AnonymousAccessPoliciesTab = () => {
  const { t } = useTranslation("clients");
  const { adminClient } = useAdminClient();
  const { addAlert, addError } = useAlerts();
  const { realm } = useRealm();
  const [policies, setPolicies] = useState<ComponentRepresentation[]>();
  const [selectedPolicy, setSelectedPolicy] =
    useState<ComponentRepresentation>();
  const [key, setKey] = useState(0);
  const refresh = () => setKey(key + 1);
  const [newDialog, toggleDialog] = useToggle();
  const navigate = useNavigate();
  const [policyProviders, setPolicyProviders] =
    useState<PolicyProviderRepresentation[]>();
  const localeSort = useLocaleSort();
  const serverInfo = useServerInfo();
  const clientPolicyProviders =
    serverInfo.providers!["client-registration-policy"].providers;

  useFetch(
    async () => {
      const policies =
        await adminClient.components.listClientRegistrationPolicies({
          type: "org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy",
        });
      return { policies };
    },
    (policies) => {
      setPolicies(localeSort(policies.policies, mapByKey("name")));
    },
    [key]
  );

  const loader = async () =>
    policies?.filter((policy) => policy.subType !== "authenticated") ?? [];

  const ClientPolicyDetailLink = ({ name }: ClientPolicyRepresentation) => (
    <Link to={toEditClientRegistrationPolicy({ realm, policyName: name! })}>
      {name}
    </Link>
  );

  const save = () => {
    console.log("TODO save create policy");
  };

  const [toggleDeleteDialog, DeleteConfirm] = useConfirmDialog({
    titleKey: t("deleteClientPolicyConfirmTitle"),
    messageKey: t("deleteClientPolicyConfirm", {
      policyName: selectedPolicy?.name,
    }),
    continueButtonLabel: t("common:delete"),
    continueButtonVariant: ButtonVariant.danger,
    onConfirm: async () => {
      const updatedPolicies = policies?.filter(
        (policy) => policy.name !== selectedPolicy?.name
      );

      try {
        await adminClient.clientPolicies.updatePolicy({
          policies: updatedPolicies,
        });
        addAlert(t("deleteClientPolicySuccess"), AlertVariant.success);
        refresh();
      } catch (error) {
        addError(t("deleteClientPolicyError"), error);
      }
    },
  });

  if (!policies) {
    return <KeycloakSpinner />;
  }

  return (
    <>
      <DeleteConfirm />
      {newDialog && (
        <NewPolicyDialog
          policyProviders={policyProviders}
          onSelect={(p) =>
            navigate(
              // toCreatePolicy({ id: clientId, realm, policyType: p.type! })
              toCreatePolicyProvider({
                id: "0",
                realm,
                policyProviderType: p.type!,
              })
            )
          }
          toggleDialog={toggleDialog}
        />
      )}
      <KeycloakDataTable
        key={policies.length}
        emptyState={
          <ListEmptyState
            message={t("noClientPolicies")}
            instructions={t("noClientPoliciesInstructions")}
            primaryActionText={t("createPolicy")}
            onPrimaryAction={toggleDialog}
          />
        }
        ariaLabelKey="clients:clientPolicies"
        searchPlaceholderKey="clients:clientPolicySearch"
        isPaginated
        loader={loader}
        toolbarItem={
          <ToolbarItem>
            <Button data-testid="createClientPolicy" onClick={toggleDialog}>
              {t("createPolicy")}
            </Button>
          </ToolbarItem>
        }
        actions={[
          {
            title: t("common:delete"),
            onRowClick: (item) => {
              toggleDeleteDialog();
              setSelectedPolicy(item);
            },
          },
        ]}
        columns={[
          {
            name: "name",
            cellRenderer: ClientPolicyDetailLink,
          },
          {
            name: "providerId",
            displayKey: t("providerId"),
          },
        ]}
      />
    </>
  );
};
