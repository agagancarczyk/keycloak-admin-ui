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
import { toEditClientPolicy } from "../../realm-settings/routes/EditClientPolicy";
import useToggle from "../../utils/useToggle";
import { NewPolicyDialog } from "./NewPolicyDialog";
import { toCreatePolicyProvider } from "../routes/NewPolicyProvider";
import PolicyProviderRepresentation from "@keycloak/keycloak-admin-client/lib/defs/policyProviderRepresentation";
import { useServerInfo } from "../../context/server-info/ServerInfoProvider";

export const AnonymousAccessPoliciesTab = () => {
  const { t } = useTranslation("clients");
  const { adminClient } = useAdminClient();
  const { addAlert, addError } = useAlerts();
  const { realm } = useRealm();
  const [policies, setPolicies] = useState<ClientPolicyRepresentation[]>();
  const [selectedPolicy, setSelectedPolicy] =
    useState<ClientPolicyRepresentation>();
  const [key, setKey] = useState(0);
  const [tablePolicies, setTablePolicies] =
    useState<ClientPolicyRepresentation[]>();
  const refresh = () => setKey(key + 1);
  const [newDialog, toggleDialog] = useToggle();
  const navigate = useNavigate();
  const [policyProviders, setPolicyProviders] =
    useState<PolicyProviderRepresentation[]>();
  const serverInfo = useServerInfo();
  const clientPolicyProviders =
    serverInfo.providers!["client-registration-policy"].providers;

  console.log(clientPolicyProviders);

  // const form = useForm<Record<string, boolean>>({ mode: "onChange" });

  useFetch(
    () => adminClient.clientPolicies.listPolicies(),
    (policies) => {
      setPolicies(policies.policies), setTablePolicies(policies.policies || []);
    },
    [key]
  );

  const loader = async () => policies ?? [];

  const ClientPolicyDetailLink = ({ name }: ClientPolicyRepresentation) => (
    <Link to={toEditClientPolicy({ realm, policyName: name! })}>{name}</Link>
  );

  // const save = () => {
  //   console.log("save");
  // };

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

  // const noData = policies.length === 0;
  // const searching = Object.keys(search).length !== 0;

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
          },
        ]}
      />
    </>
  );
};
