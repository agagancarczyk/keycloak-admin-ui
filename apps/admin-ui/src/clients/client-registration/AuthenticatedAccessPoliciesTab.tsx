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
import useToggle from "../../utils/useToggle";
import { NewClientRegistrationPolicyDialog } from "./NewClientRegistrationPolicyDialog";
import { toCreateClientRegistrationPolicyProvider } from "../routes/NewClientRegistrationPolicyProvider";
import ComponentRepresentation from "@keycloak/keycloak-admin-client/lib/defs/componentRepresentation";
import useLocaleSort, { mapByKey } from "../../utils/useLocaleSort";
import { toEditClientRegistrationPolicy } from "../routes/EditClientRegistrationPolicy";
import ComponentTypeRepresentation from "@keycloak/keycloak-admin-client/lib/defs/componentTypeRepresentation";

export const AuthenticatedAccessPoliciesTab = () => {
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
    useState<ComponentTypeRepresentation[]>();
  const localeSort = useLocaleSort();

  useFetch(
    () =>
      Promise.all([
        adminClient.components.listClientRegistrationPolicies({
          type: "org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy",
        }),
        adminClient.clientRegistrationPolicies.find(),
      ]),
    ([policies, providers]) => {
      setPolicies(localeSort(policies, mapByKey("name")));
      setPolicyProviders(localeSort(providers, mapByKey("id")));
    },
    []
  );

  const loader = async () =>
    policies?.filter((policy) => policy.subType !== "anonymous") ?? [];

  const ClientRegistrationPolicyDetailLink = ({
    id,
    name,
  }: ComponentRepresentation) => (
    <Link
      to={toEditClientRegistrationPolicy({
        realm,
        policyId: id!,
        policyName: name!,
      })}
    >
      {name}
    </Link>
  );

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
        <NewClientRegistrationPolicyDialog
          policyProviders={policyProviders}
          onSelect={(p) =>
            navigate(
              toCreateClientRegistrationPolicyProvider({
                realm,
                policyProviderId: p.id!,
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
            cellRenderer: ClientRegistrationPolicyDetailLink,
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
