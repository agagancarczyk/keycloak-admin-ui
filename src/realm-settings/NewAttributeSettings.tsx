import React, { useState } from "react";
import {
  ActionGroup,
  AlertVariant,
  Button,
  Form,
  PageSection,
} from "@patternfly/react-core";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { ScrollForm } from "../components/scroll-form/ScrollForm";
import { useRealm } from "../context/realm-context/RealmContext";
import type UserProfileConfig from "@keycloak/keycloak-admin-client/lib/defs/userProfileConfig";
import { AttributeGeneralSettings } from "./user-profile/attribute/AttributeGeneralSettings";
import { AttributePermission } from "./user-profile/attribute/AttributePermission";
import { AttributeValidations } from "./user-profile/attribute/AttributeValidations";
import { toUserProfile } from "./routes/UserProfile";
import "./realm-settings-section.css";
import { ViewHeader } from "../components/view-header/ViewHeader";
import { AttributeAnnotations } from "./user-profile/attribute/AttributeAnnotations";
import { useAdminClient, useFetch } from "../context/auth/AdminClient";
import { useAlerts } from "../components/alert/Alerts";
import { UserProfileProvider } from "./user-profile/UserProfileContext";
import type { UserProfileAttribute } from "@keycloak/keycloak-admin-client/lib/defs/userProfileConfig";
import type { KeyValueType } from "../components/attribute-form/attribute-convert";
import type ClientScopeRepresentation from "@keycloak/keycloak-admin-client/lib/defs/clientScopeRepresentation";

type UserProfileAttributeType = UserProfileAttribute &
  AttributeRequired &
  Permission;

type AttributeRequired = {
  roles: string[];
  scopes: string[];
  scopeRequired: string[];
  enabledWhen: string;
  requiredWhen: string;
};

type Permission = {
  adminView?: string;
  userView?: string;
  adminEdit?: string;
  userEdit?: string;
};

const CreateAttributeFormContent = ({
  save,
}: {
  save: (profileConfig: UserProfileConfig) => void;
}) => {
  const { t } = useTranslation("realm-settings");
  const form = useFormContext();
  const history = useHistory();
  const { realm } = useRealm();

  return (
    <UserProfileProvider>
      <ScrollForm
        sections={[
          t("generalSettings"),
          t("permission"),
          t("validations"),
          t("annotations"),
        ]}
      >
        <AttributeGeneralSettings form={form} />
        <AttributePermission form={form} />
        <AttributeValidations />
        <AttributeAnnotations form={form} />
      </ScrollForm>
      <Form onSubmit={form.handleSubmit(save)}>
        <ActionGroup className="keycloak__form_actions">
          <Button
            variant="primary"
            type="submit"
            data-testid="attribute-create"
          >
            {t("common:create")}
          </Button>
          <Button
            variant="link"
            onClick={() =>
              history.push(toUserProfile({ realm, tab: "attributes" }))
            }
            data-testid="attribute-cancel"
          >
            {t("common:cancel")}
          </Button>
        </ActionGroup>
      </Form>
    </UserProfileProvider>
  );
};

export default function NewAttributeSettings() {
  const { realm: realmName } = useRealm();
  const adminClient = useAdminClient();
  const form = useForm<UserProfileConfig>();
  const { t } = useTranslation("realm-settings");
  const history = useHistory();
  const { addAlert, addError } = useAlerts();
  const [config, setConfig] = useState<UserProfileConfig | null>(null);
  const [clientScopes, setClientScopes] =
    useState<ClientScopeRepresentation[]>();

  useFetch(
    () => adminClient.users.getProfile({ realm: realmName }),
    (config) => setConfig(config),
    []
  );

  useFetch(
    () => adminClient.clientScopes.find(),
    (clientScopes) => {
      setClientScopes(clientScopes);
    },
    []
  );

  const save = async (profileConfig: UserProfileAttributeType) => {
    const scopeNames = clientScopes?.map((clientScope) => clientScope.name);

    const selector = {
      scopes:
        profileConfig.enabledWhen === "Always"
          ? scopeNames
          : profileConfig.scopes,
    };

    const required = {
      roles: profileConfig.roles,
      scopes:
        profileConfig.requiredWhen === "Always"
          ? scopeNames
          : profileConfig.scopeRequired,
    };

    const validations = profileConfig.validations;

    const permissions = {
      view: [profileConfig.userView, profileConfig.adminView].filter(
        (permissionVal) => permissionVal !== undefined
      ),
      edit: [profileConfig.userEdit, profileConfig.adminEdit].filter(
        (permissionVal) => permissionVal !== undefined
      ),
    };

    const annotations = (profileConfig.annotations! as KeyValueType[]).reduce(
      (obj, item) => Object.assign(obj, { [item.key]: item.value }),
      {}
    );

    const newAttribute = [
      {
        name: profileConfig.name,
        displayName: profileConfig.displayName,
        required: required,
        validations: validations,
        selector: selector,
        permissions: permissions,
        annotations: annotations,
      },
    ];

    const newAttributesList = config?.attributes!.concat(
      newAttribute as UserProfileAttribute
    );

    try {
      await adminClient.users.updateProfile({
        attributes: newAttributesList,
        realm: realmName,
      });

      history.push(toUserProfile({ realm: realmName, tab: "attributes" }));

      addAlert(
        t("realm-settings:createAttributeSuccess"),
        AlertVariant.success
      );
    } catch (error) {
      addError("realm-settings:createAttributeError", error);
    }
  };

  return (
    <FormProvider {...form}>
      <ViewHeader
        titleKey={t("createAttribute")}
        subKey={t("createAttributeSubTitle")}
      />
      <PageSection variant="light">
        <CreateAttributeFormContent save={() => form.handleSubmit(save)()} />
      </PageSection>
    </FormProvider>
  );
}
