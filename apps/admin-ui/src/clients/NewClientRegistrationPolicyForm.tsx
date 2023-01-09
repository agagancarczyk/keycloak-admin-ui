import { useMemo, useState } from "react";
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
import { useServerInfo } from "../context/server-info/ServerInfoProvider";
import ComponentRepresentation from "libs/keycloak-admin-client/lib/defs/componentRepresentation";

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

type ConfigProperty = ConfigPropertyRepresentation & {
  config: any;
};

export default function NewClientRegistrationPolicyForm() {
  const { t } = useTranslation("clients");
  const navigate = useNavigate();
  const { realm, tab, providerId } =
    useParams<NewClientRegistrationPolicyParams>();
  const { policyName, policyId, providerName } =
    useParams<EditClientRegistrationPolicyParams>();
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
  const [properties, setProperties] =
    useState<ConfigPropertyRepresentation[]>();
  const [policies, setPolicies] = useState<ComponentRepresentation[]>([]);
  const [parentId, setParentId] = useState<string>();
  const [helpText, setHelpText] = useState<string>();
  const subType =
    tab === "authenticated-access-policies" ? "authenticated" : "anonymous";
  const { addAlert, addError } = useAlerts();
  const serverInfo = useServerInfo();
  const providers = useMemo(
    () =>
      serverInfo.componentTypes?.[
        "org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy"
      ],
    []
  );
  const editMode = !!policyId;
  // const setupForm = (config: ConfigProperty) => {
  //   form.reset({ config: config.config || {} });
  // };

  console.log(">>>> editMode ", policyName);

  useFetch(
    async () => {
      const policies = await adminClient.components.find({
        type: CLIENT_REGISTRATION_POLICY_PROVIDER,
      });
      const realmInfo = await adminClient.realms.findOne({ realm });
      return {
        policies,
        // selectedPolicy,
        realmInfo,
      };
    },
    ({ policies, realmInfo }) => {
      setPolicies(policies);
      setParentId(realmInfo?.id);

      // if (policyId) {
      //   console.log(">>>>> policyId ", policyId);
      //   const currentPolicy = policies.filter(
      //     (policy) => policy.id === policyId
      //   );

      //   console.log(">>>> currentPolicy ", currentPolicy);
      //   console.log(">>>> providers ", providers);
      //   // setSelectedPolicy(currentPolicy);
      // }
    },
    []
  );

  if (editMode && providers?.length! > 0) {
    const editedPolicy = policies.filter((policy) => policy.id === policyId);
    console.log(">>> editedPolicy ", editedPolicy);
    // const editedPolicyProvider = providers?.filter(
    //   (provider) => provider.id === editedPolicy[0].providerId!
    // );
    // console.log(">>>> editedPolicyProvider ", editedPolicyProvider);
    // setHelpText(editedPolicyProvider?.[0].helpText!);
    // setValue("providerId", editedPolicy[0].providerId!);
    // setValue("name", editedPolicy[0].name!);
    // const editedPolicyConfig = Object.entries(selectedPolicy[0].config!).map(
    //   ([key, value]) => ({
    //     name: key,
    //     options: value,
    //     type: "",
    //   })
    // );

    // const editedProperties: any = [];
    // Array.from(editedPolicyConfig).map((el) => {
    //   providers?.[0].properties.map((provider) => {
    //     if (provider.name === el.name) {
    //       el.type = provider.type!;
    //       editedProperties.push(el);
    //     }
    //   });
    // });
    // setValue("properties", editedProperties!);
    // setProperties(editedProperties!);
  }
  console.log(">>>> properties ", properties);
  // console.log(providerProperties);

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

  if (providerId && !providers && !properties) {
    return <KeycloakSpinner />;
  }

  return (
    <>
      <ViewHeader titleKey={editMode ? policyName : t("createPolicy")} />
      <PageSection variant="light">
        <FormAccess isHorizontal role="view-clients">
          <FormGroup
            label={t("common:provider")}
            labelIcon={
              <HelpItem
                // helpText={editMode ? helpText : policyProvider?.[0].helpText!}
                helpText={"test"}
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
                  providers?.some((provider) => provider.id === value)
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
            <DynamicComponents properties={providers?.[0].properties!} />
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
