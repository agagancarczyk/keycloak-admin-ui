import { useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom-v5-compat";
import { useTranslation } from "react-i18next";
import { FormProvider, useForm } from "react-hook-form";
import {
  ActionGroup,
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

export default function PolicyDetails() {
  const { t } = useTranslation("clients");
  const { realm, tab, providerId } =
    useParams<NewClientRegistrationPolicyParams>();
  const form = useForm({ shouldUnregister: false });
  const { handleSubmit } = form;
  const { adminClient } = useAdminClient();
  const [providers, setProviders] = useState<ComponentTypeRepresentation[]>([]);
  const [policyProvider, setPolicyProvider] =
    useState<ComponentTypeRepresentation[]>();
  const [providerProperties, setProviderProperties] = useState<
    ConfigPropertyRepresentation[]
  >([]);
  const [parentId, setParentId] = useState<string>();
  const subType =
    tab === "authenticated-access-policies" ? "authenticated" : "anonymous";

  useFetch(
    async () => {
      const providers =
        await adminClient.realms.getClientRegistrationPolicyProviders({
          realm,
        });
      const selectedProvider = providers.filter(
        (provider) => provider.id === providerId
      );
      const realmInfo = await adminClient.realms.findOne({ realm });
      return { providers, selectedProvider, realmInfo };
    },
    ({ providers, selectedProvider, realmInfo }) => {
      setProviders(providers);
      setPolicyProvider(selectedProvider);
      setProviderProperties(selectedProvider[0].properties);
      setParentId(realmInfo?.id);
    },
    []
  );

  const save = async () => {
    const createdForm = form.getValues();
    const createdPolicy = {
      ...createdForm,
      parentId,
      providerId,
      providerType:
        "org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy",
      subType: subType,
    };

    console.log(">>>>> createdForm ", createdPolicy);
  };

  if (providerId && !policyProvider) {
    return <KeycloakSpinner />;
  }

  return (
    <>
      <ViewHeader titleKey={t("createPolicy")} />
      <PageSection variant="light">
        <FormAccess
          isHorizontal
          onSubmit={handleSubmit(save)}
          role="view-clients"
        >
          <FormGroup
            label={t("common:provider")}
            labelIcon={
              <HelpItem
                helpText={policyProvider?.[0].helpText}
                fieldLabelId="clientRegistrationPolicyProvider"
              />
            }
            fieldId="kc-client-registration-policy-provider"
            helperTextInvalid={form.errors.name?.message}
          >
            <KeycloakTextInput
              type="text"
              id="kc-client-registration-policy-provider"
              name="provider"
              aria-label={t("provider")}
              data-testid="client-registration-policy-provider"
              ref={form.register()}
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
            helperTextInvalid={form.errors.name?.message}
            validated={
              form.errors.name
                ? ValidatedOptions.error
                : ValidatedOptions.default
            }
          >
            <KeycloakTextInput
              ref={form.register({
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
                form.errors.name
                  ? ValidatedOptions.error
                  : ValidatedOptions.default
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
                type="submit"
                data-testid="save"
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
