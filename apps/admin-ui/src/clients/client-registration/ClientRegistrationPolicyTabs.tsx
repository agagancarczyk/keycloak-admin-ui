import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom-v5-compat";
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
import {
  NewClientRegistrationPolicyParams,
  toCreateClientRegistrationPolicy,
} from "../routes/NewClientRegistrationPolicy";
import ComponentRepresentation from "@keycloak/keycloak-admin-client/lib/defs/componentRepresentation";
import useLocaleSort, { mapByKey } from "../../utils/useLocaleSort";
import { toEditClientRegistrationPolicy } from "../routes/EditClientRegistrationPolicy";
import ComponentTypeRepresentation from "@keycloak/keycloak-admin-client/lib/defs/componentTypeRepresentation";
import { CLIENT_REGISTRATION_POLICY_PROVIDER } from "../../util";

type ClientRegistrationPolicyType = "anonymous" | "authenticated";

type ClientRegistrationPolicyTabsProps = {
  type: ClientRegistrationPolicyType;
};

export const ClientRegistrationPolicyTabs = ({
  type,
}: ClientRegistrationPolicyTabsProps) => {
  const { t } = useTranslation("clients");
  const { adminClient } = useAdminClient();
  const { addAlert, addError } = useAlerts();
  const { tab } = useParams<NewClientRegistrationPolicyParams>();
  const { realm } = useRealm();
  const [anonymousPolicies, setAnonymousPolicies] =
    useState<ComponentRepresentation[]>();
  const [authenticatedPolicies, setAuthenticatedPolicies] =
    useState<ComponentRepresentation[]>();
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
        adminClient.components.find({
          type: CLIENT_REGISTRATION_POLICY_PROVIDER,
        }),
        adminClient.realms.getClientRegistrationPolicyProviders({ realm }),
      ]),
    ([policies, providers]) => {
      setPolicyProviders(localeSort(providers, mapByKey("id")));
      let anonymousPolicies: ComponentRepresentation[];
      let authenticatedPolicies: ComponentRepresentation[];
      if (type === "anonymous") {
        anonymousPolicies = policies.filter(
          (policy) => policy.subType !== "authenticated"
        );
      } else {
        authenticatedPolicies = policies.filter(
          (policy) => policy.subType !== "anonymous"
        );
      }
      setAnonymousPolicies(anonymousPolicies!);
      setAuthenticatedPolicies(authenticatedPolicies!);
    },
    [key]
  );

  const ClientRegistrationPolicyDetailLink = ({
    id,
    name,
    providerId,
  }: ComponentRepresentation) => (
    <Link
      to={toEditClientRegistrationPolicy({
        realm,
        policyId: id!,
        policyName: name!,
        providerName: providerId!,
      })}
    >
      {name}
    </Link>
  );

  const [toggleDeleteDialog, DeleteConfirm] = useConfirmDialog({
    titleKey: t("deleteClientRegistrationPolicyConfirmTitle"),
    messageKey: t("deleteClientRegistrationPolicyConfirm", {
      policyName: selectedPolicy?.name,
    }),
    continueButtonLabel: t("common:delete"),
    continueButtonVariant: ButtonVariant.danger,
    onConfirm: async () => {
      try {
        await adminClient.components.del({
          id: selectedPolicy!.id!,
          realm: realm,
        });

        addAlert(
          t("deleteClientRegistrationPolicySuccess"),
          AlertVariant.success
        );
        refresh();
      } catch (error) {
        addError(t("deleteClientRegistrationPolicyError"), error);
      }
    },
  });

  if (!anonymousPolicies && !authenticatedPolicies) {
    return <KeycloakSpinner />;
  }

  return (
    <>
      <DeleteConfirm />
      {newDialog && (
        <NewClientRegistrationPolicyDialog
          policyProviders={policyProviders}
          onSelect={(policy) =>
            navigate(
              toCreateClientRegistrationPolicy({
                realm,
                providerId: policy.id!,
                tab: tab!,
              })
            )
          }
          toggleDialog={toggleDialog}
        />
      )}
      <KeycloakDataTable
        key={
          type !== "anonymous"
            ? authenticatedPolicies?.length
            : authenticatedPolicies?.length
        }
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
        loader={
          type !== "anonymous"
            ? localeSort(authenticatedPolicies!, mapByKey("name"))
            : localeSort(anonymousPolicies!, mapByKey("name"))
        }
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
