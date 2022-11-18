import { useState } from "react";
import { useParams } from "react-router-dom";
import { Link, useNavigate } from "react-router-dom-v5-compat";
import { useTranslation } from "react-i18next";
import { FormProvider, useForm } from "react-hook-form";
import {
  ActionGroup,
  AlertVariant,
  Button,
  ButtonVariant,
  FormGroup,
  PageSection,
  ValidatedOptions,
} from "@patternfly/react-core";

import { NewClientRegistrationPolicyParams } from "./routes/NewClientRegistrationPolicy";
import { ViewHeader } from "../components/view-header/ViewHeader";
import { KeycloakSpinner } from "../components/keycloak-spinner/KeycloakSpinner";
import { useAdminClient, useFetch } from "../context/auth/AdminClient";
import { FormAccess } from "../components/form-access/FormAccess";
import { DynamicComponents } from "../components/dynamic/DynamicComponents";
import ComponentTypeRepresentation from "@keycloak/keycloak-admin-client/lib/defs/componentTypeRepresentation";
import { toClientRegistrationTab } from "./routes/ClientRegistration";
import { ConfigPropertyRepresentation } from "@keycloak/keycloak-admin-client/lib/defs/authenticatorConfigInfoRepresentation";
import { KeycloakTextInput } from "../components/keycloak-text-input/KeycloakTextInput";
import { HelpItem } from "../components/help-enabler/HelpItem";
import {
  CLIENT_REGISTRATION_POLICY_PROVIDER,
  convertFormValuesToObject,
} from "../util";
import { useAlerts } from "../components/alert/Alerts";
import { EditClientRegistrationPolicyParams } from "./routes/EditClientRegistrationPolicy";

type NewClientRegistrationPolicyForm = {
  name: string;
  providerId: string;
  providerType: string;
  parentId: string;
  subType: string;
  config: {};
};

const defaultValues: NewClientRegistrationPolicyForm = {
  name: "",
  providerId: "",
  providerType: "",
  parentId: "",
  subType: "",
  config: {},
};

export default function NewClientRegistrationPolicyForm() {
  const { t } = useTranslation("clients");
  const navigate = useNavigate();
  const { realm, tab, providerId } =
    useParams<NewClientRegistrationPolicyParams>();
  const { policyId } = useParams<EditClientRegistrationPolicyParams>();
  // const [policies, setPolicies] = useState<ComponentRepresentation[]>();
  const form = useForm<NewClientRegistrationPolicyForm>({
    shouldUnregister: false,
    defaultValues,
  });
  const {
    register,
    setValue,
    handleSubmit,
    formState: { isDirty, errors },
  } = form;
  const { adminClient } = useAdminClient();
  const [providers, setProviders] = useState<ComponentTypeRepresentation[]>([]);
  const [policyProvider, setPolicyProvider] =
    useState<ComponentTypeRepresentation[]>();
  const [providerProperties, setProviderProperties] = useState<
    ConfigPropertyRepresentation[]
  >([]);
  const [parentId, setParentId] = useState<string>();
  const [helpText, setHelpText] = useState<string>();

  const subType =
    tab === "authenticated-access-policies" ? "authenticated" : "anonymous";
  const { addAlert, addError } = useAlerts();
  const editMode = !!policyId;

  useFetch(
    async () => {
      const policies = await adminClient.components.find({
        type: CLIENT_REGISTRATION_POLICY_PROVIDER,
      });
      const providers =
        await adminClient.realms.getClientRegistrationPolicyProviders({
          realm,
        });
      const selectedProvider = providers.filter(
        (provider) => provider.id === providerId
      );
      const realmInfo = await adminClient.realms.findOne({ realm });
      return {
        policies,
        providers,
        selectedProvider,
        realmInfo,
      };
    },
    ({ policies, providers, selectedProvider, realmInfo }) => {
      // setPolicies(policies);
      setProviders(providers);
      setPolicyProvider(selectedProvider);
      setProviderProperties(selectedProvider[0]?.properties);
      setParentId(realmInfo?.id);
      if (editMode && providers.length > 0) {
        const editedPolicy = policies.filter(
          (policy) => policy.id === policyId
        );
        const editedPolicyProvider = providers.filter(
          (provider) => provider.id === editedPolicy[0].providerId!
        );
        setHelpText(editedPolicyProvider[0].helpText!);
        setValue("providerId", editedPolicy[0].providerId!);
        setValue("name", editedPolicy[0].name!);
        setValue("properties", editedPolicyProvider[0].properties);
      }
    },
    []
  );

  const save = async (form: NewClientRegistrationPolicyForm) => {
    const newClientRegistrationPolicy = form;
    const saveComponent = convertFormValuesToObject({
      ...newClientRegistrationPolicy,
      config: Object.fromEntries(
        Object.entries(newClientRegistrationPolicy.config).map(
          ([key, value]) => [key, Array.isArray(value) ? value : [value]]
        )
      ),
      providerId,
      providerType: CLIENT_REGISTRATION_POLICY_PROVIDER,
      parentId,
      subType,
    });

    try {
      await adminClient.components.create(saveComponent);
      addAlert(t("saveProviderSuccess"), AlertVariant.success);
      navigate(
        subType === "anonymous"
          ? toClientRegistrationTab({ realm, tab: "anonymous-access-policies" })
          : toClientRegistrationTab({
              realm,
              tab: "authenticated-access-policies",
            })
      );
    } catch (error) {
      addError("saveProviderError", error);
    }
  };

  if (providerId && !policyProvider) {
    return <KeycloakSpinner />;
  }

  return (
    <>
      <ViewHeader titleKey={t("createPolicy")} />
      <PageSection variant="light">
        <FormAccess isHorizontal role="view-clients">
          <FormGroup
            label={t("common:provider")}
            labelIcon={
              <HelpItem
                helpText={editMode ? helpText : policyProvider?.[0].helpText!}
                fieldLabelId="clientRegistrationPolicyProvider"
              />
            }
            fieldId="kc-client-registration-policy-provider"
          >
            <KeycloakTextInput
              ref={register()}
              value={providerId}
              id="kc-client-registration-policy-provider"
              name="providerId"
              aria-label={t("provider")}
              data-testid="client-registration-policy-provider"
              isReadOnly
            />
          </FormGroup>
          <FormGroup
            label={t("common:name")}
            labelIcon={
              <HelpItem
                helpText={t("clientRegistrationPolicyNameHelpText")}
                fieldLabelId="clientRegistrationPolicyName"
              />
            }
            fieldId="kc-client-registration-policy-name"
            isRequired
            helperTextInvalid={errors.name?.message}
            validated={
              errors.name ? ValidatedOptions.error : ValidatedOptions.default
            }
          >
            <KeycloakTextInput
              ref={register({
                required: { value: true, message: t("common:required") },
                validate: (value) =>
                  providers.some((provider) => provider.id === value)
                    ? t(
                        "createClientRegistrationPolicyNameHelperText"
                      ).toString()
                    : true,
              })}
              type="text"
              id="kc-client-registration-policy-name"
              name="name"
              aria-label={t("name")}
              data-testid="client-registration-policy-name"
              validated={
                errors.name ? ValidatedOptions.error : ValidatedOptions.default
              }
            />
          </FormGroup>
          <FormProvider {...form}>
            <DynamicComponents properties={providerProperties!} />
          </FormProvider>
          <ActionGroup>
            <div className="pf-u-mt-md">
              <Button
                variant={ButtonVariant.primary}
                className="pf-u-mr-md"
                onClick={() => handleSubmit(save)()}
                data-testid="save"
                isDisabled={!isDirty}
              >
                {t("common:save")}
              </Button>
              <Button
                variant="link"
                data-testid="cancel"
                component={(props) => (
                  <Link
                    {...props}
                    to={toClientRegistrationTab({
                      realm,
                      tab: "anonymous-access-policies",
                    })}
                  />
                )}
              >
                {t("common:cancel")}
              </Button>
            </div>
          </ActionGroup>
        </FormAccess>
      </PageSection>
    </>
  );
}
