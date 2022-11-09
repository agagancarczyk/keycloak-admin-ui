import { useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom-v5-compat";
import { useTranslation } from "react-i18next";
import { FormProvider, useForm } from "react-hook-form";
import {
  ActionGroup,
  Button,
  ButtonVariant,
  PageSection,
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

export default function PolicyDetails() {
  const { t } = useTranslation("clients");
  const { realm, policyProviderId } =
    useParams<NewClientRegistrationPolicyParams>();
  const form = useForm({ shouldUnregister: false });
  const { handleSubmit } = form;

  const { adminClient } = useAdminClient();

  const [policyProvider, setPolicyProvider] =
    useState<ComponentTypeRepresentation[]>();

  const [providerProperties, setProviderProperties] = useState<
    ConfigPropertyRepresentation[]
  >([]);

  useFetch(
    async () => {
      const providers =
        await adminClient.realms.getClientRegistrationPolicyProviders({
          realm,
        });
      const selectedProvider = providers.filter(
        (provider) => provider.id === policyProviderId
      );
      return { selectedProvider };
    },
    ({ selectedProvider }) => {
      setPolicyProvider(selectedProvider);
      setProviderProperties(selectedProvider[0].properties ?? []);
    },
    []
  );

  const save = () => {
    console.log(">>>> save client registration policy");
  };

  if (policyProviderId && !policyProvider) {
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
