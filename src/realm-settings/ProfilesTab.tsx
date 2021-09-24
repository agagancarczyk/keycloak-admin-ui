import React, { useMemo, useState } from "react";
import { omit } from "lodash";
import {
  AlertVariant,
  Button,
  ButtonVariant,
  Label,
  PageSection,
  ToolbarItem,
} from "@patternfly/react-core";
import { Divider, Flex, FlexItem, Radio, Title } from "@patternfly/react-core";
import { CodeEditor, Language } from "@patternfly/react-code-editor";
import { KeycloakDataTable } from "../components/table-toolbar/KeycloakDataTable";
import { ListEmptyState } from "../components/list-empty-state/ListEmptyState";
import { useTranslation } from "react-i18next";
import { useAdminClient } from "../context/auth/AdminClient";
import { useConfirmDialog } from "../components/confirm-dialog/ConfirmDialog";
import { useRealm } from "../context/realm-context/RealmContext";
import { useAlerts } from "../components/alert/Alerts";
import { Link } from "react-router-dom";
import "./RealmSettingsSection.css";
import { toNewClientProfile } from "./routes/NewClientProfile";
import type ClientProfileRepresentation from "@keycloak/keycloak-admin-client/lib/defs/clientProfileRepresentation";

type ClientProfile = ClientProfileRepresentation & {
  global: boolean;
};

export const ProfilesTab = () => {
  const { t } = useTranslation("realm-settings");
  const adminClient = useAdminClient();
  const { realm } = useRealm();
  const { addAlert, addError } = useAlerts();
  const [tableProfiles, setTableProfiles] = useState<ClientProfile[]>();
  const [globalProfiles, setGlobalProfiles] =
    useState<ClientProfileRepresentation[]>();
  const [selectedProfile, setSelectedProfile] = useState<ClientProfile>();
  const [show, setShow] = useState(false);
  const [key, setKey] = useState(0);

  const loader = async () => {
    const allProfiles = await adminClient.clientPolicies.listProfiles({
      realm,
      includeGlobalProfiles: true,
    });

    setGlobalProfiles(allProfiles.globalProfiles);

    const globalProfiles = allProfiles.globalProfiles?.map(
      (globalProfiles) => ({
        ...globalProfiles,
        global: true,
      })
    );

    const profiles = allProfiles.profiles?.map((profiles) => ({
      ...profiles,
      global: false,
    }));

    const allClientProfiles = globalProfiles?.concat(profiles ?? []);
    setTableProfiles(allClientProfiles);

    return allClientProfiles ?? [];
  };

  const code = useMemo(
    () => JSON.stringify(tableProfiles, null, 2),
    [tableProfiles]
  );

  const [toggleDeleteDialog, DeleteConfirm] = useConfirmDialog({
    titleKey: t("deleteClientProfileConfirmTitle"),
    messageKey: t("deleteClientProfileConfirm"),
    continueButtonLabel: t("delete"),
    continueButtonVariant: ButtonVariant.danger,
    onConfirm: async () => {
      const updatedProfiles = tableProfiles
        ?.filter(
          (profile) => profile.name !== selectedProfile?.name && !profile.global
        )
        .map<ClientProfileRepresentation>((profile) => omit(profile, "global"));

      try {
        await adminClient.clientPolicies.createProfiles({
          profiles: updatedProfiles,
          globalProfiles,
        });
        addAlert(t("deleteClientSuccess"), AlertVariant.success);
        setKey(key + 1);
      } catch (error) {
        addError(t("deleteClientError"), error);
      }
    },
  });

  const cellFormatter = (row: ClientProfile) => (
    <Link to={""} key={row.name}>
      {row.name} {""}
      {row.global && <Label color="blue">{t("global")}</Label>}
    </Link>
  );

  return (
    <>
      <DeleteConfirm />
      <PageSection>
        <Flex className="kc-profiles-config-section">
          <FlexItem>
            <Title headingLevel="h1" size="md">
              {t("profilesConfigType")}
            </Title>
          </FlexItem>
          <FlexItem>
            <Radio
              isChecked={!show}
              name="formView"
              onChange={() => setShow(false)}
              label={t("profilesConfigTypes.formView")}
              id="formView-radioBtn"
              className="kc-form-radio-btn pf-u-mr-sm pf-u-ml-sm"
              data-testid="formView-radioBtn"
            />
          </FlexItem>
          <FlexItem>
            <Radio
              isChecked={show}
              name="jsonEditor"
              onChange={() => setShow(true)}
              label={t("profilesConfigTypes.jsonEditor")}
              id="jsonEditor-radioBtn"
              className="kc-editor-radio-btn"
              data-testid="jsonEditor-radioBtn"
            />
          </FlexItem>
        </Flex>
      </PageSection>
      <Divider />
      {!show ? (
        <KeycloakDataTable
          key={key}
          ariaLabelKey="userEventsRegistered"
          searchPlaceholderKey="realm-settings:clientProfileSearch"
          isPaginated
          loader={loader}
          toolbarItem={
            <ToolbarItem>
              <Button
                id="createProfile"
                component={Link}
                // @ts-ignore
                to={toNewClientProfile({ realm })}
                data-testid="createProfile"
              >
                {t("createClientProfile")}
              </Button>
            </ToolbarItem>
          }
          isRowDisabled={(value) => value.global}
          actions={[
            {
              title: t("common:delete"),
              onRowClick: (profile) => {
                setSelectedProfile(profile);
                toggleDeleteDialog();
              },
            },
          ]}
          columns={[
            {
              name: "name",
              displayKey: t("clientProfileName"),
              cellRenderer: cellFormatter,
            },
            {
              name: "description",
              displayKey: t("clientProfileDescription"),
            },
          ]}
          emptyState={
            <ListEmptyState
              message={t("emptyClientProfiles")}
              instructions={t("emptyClientProfilesInstructions")}
            />
          }
        />
      ) : (
        <>
          <div className="pf-u-mt-md pf-u-ml-lg">
            <CodeEditor
              isLineNumbersVisible
              isLanguageLabelVisible
              code={code}
              language={Language.json}
              height="30rem"
            />
          </div>
          <div className="pf-u-mt-md">
            <Button
              variant={ButtonVariant.primary}
              className="pf-u-mr-md pf-u-ml-lg"
            >
              {t("save")}
            </Button>
            <Button variant={ButtonVariant.link}> {t("reload")}</Button>
          </div>
        </>
      )}
    </>
  );
};
