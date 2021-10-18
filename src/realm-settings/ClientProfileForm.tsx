import React, { useMemo, useState } from "react";
import {
  ActionGroup,
  AlertVariant,
  Button,
  ButtonVariant,
  DataList,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  Divider,
  DropdownItem,
  Flex,
  FlexItem,
  FormGroup,
  PageSection,
  Text,
  TextArea,
  TextInput,
  TextVariants,
  ValidatedOptions,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { FormAccess } from "../components/form-access/FormAccess";
import { ViewHeader } from "../components/view-header/ViewHeader";
import { Link, useHistory, useParams } from "react-router-dom";
import { useAlerts } from "../components/alert/Alerts";
import { useAdminClient, useFetch } from "../context/auth/AdminClient";
import type ClientProfileRepresentation from "@keycloak/keycloak-admin-client/lib/defs/clientProfileRepresentation";
import { HelpItem } from "../components/help-enabler/HelpItem";
import { PlusCircleIcon, TrashIcon } from "@patternfly/react-icons";
import "./RealmSettingsSection.css";
import { useConfirmDialog } from "../components/confirm-dialog/ConfirmDialog";
import { toAddExecutor } from "./routes/AddExecutor";
import { useServerInfo } from "../context/server-info/ServerInfoProvider";

type ClientProfileForm = Required<ClientProfileRepresentation>;

const defaultValues: ClientProfileForm = {
  name: "",
  description: "",
  executors: [],
};

export const ClientProfileForm = () => {
  const { t } = useTranslation("realm-settings");
  const history = useHistory();
  const { getValues, setValue, register, errors } = useForm<ClientProfileForm>({
    defaultValues,
    mode: "onChange",
  });

  //const { control, getValues, register, errors } = useForm({mode: "onChange"});
  const { addAlert, addError } = useAlerts();
  const adminClient = useAdminClient();
  const [globalProfiles, setGlobalProfiles] = useState<
    ClientProfileRepresentation[]
  >([]);
  const [profiles, setProfiles] = useState<ClientProfileRepresentation[]>([]);
  const { realm, profileName } =
    useParams<{ realm: string; profileName: string }>();
  const serverInfo = useServerInfo();
  const executorTypes = useMemo(
    () =>
      serverInfo.componentTypes?.[
        "org.keycloak.services.clientpolicy.executor.ClientPolicyExecutorProvider"
      ],
    []
  );
  const [executorToDelete, setExecutorToDelete] =
    useState<{ idx: number; name: string }>();
  const editMode = profileName ? true : false;

  useFetch(
    () =>
      adminClient.clientPolicies.listProfiles({ includeGlobalProfiles: true }),
    (profiles) => {
      setGlobalProfiles(profiles.globalProfiles ?? []);
      setProfiles(profiles.profiles ?? []);
    },
    []
  );

  const save = async () => {
    const form = getValues();

    const createdProfile = {
      ...form,
      executors: [],
    };

    const allProfiles = profiles.concat(createdProfile);

    try {
      await adminClient.clientPolicies.createProfiles({
        profiles: allProfiles,
        globalProfiles: globalProfiles,
      });
      addAlert(
        t("realm-settings:createClientProfileSuccess"),
        AlertVariant.success
      );
      history.push(
        `/${realm}/realm-settings/clientPolicies/${createdProfile.name}`
      );
    } catch (error) {
      addError("realm-settings:createClientProfileError", error);
    }
  };

  const [toggleDeleteDialog, DeleteConfirm] = useConfirmDialog({
    titleKey: executorToDelete?.name!
      ? t("deleteExecutorProfileConfirmTitle")
      : t("deleteClientProfileConfirmTitle"),
    messageKey: executorToDelete?.name!
      ? t("deleteExecutorProfileConfirm", {
          executorName: executorToDelete.name!,
        })
      : t("deleteClientProfileConfirm", {
          profileName,
        }),
    continueButtonLabel: t("delete"),
    continueButtonVariant: ButtonVariant.danger,

    onConfirm: async () => {
      if (executorToDelete?.name!) {
        profileExecutors.splice(executorToDelete.idx!, 1);
        try {
          await adminClient.clientPolicies.createProfiles({
            profiles: profiles,
            globalProfiles,
          });
          addAlert(t("deleteExecutorSuccess"), AlertVariant.success);
          history.push(
            `/${realm}/realm-settings/clientPolicies/${profileName}`
          );
        } catch (error) {
          addError(t("deleteExecutorError"), error);
        }
      } else {
        const updatedProfiles = profiles.filter(
          (profile) => profile.name !== profileName
        );

        try {
          await adminClient.clientPolicies.createProfiles({
            profiles: updatedProfiles,
            globalProfiles,
          });
          addAlert(t("deleteClientSuccess"), AlertVariant.success);
          history.push(`/${realm}/realm-settings/clientPolicies`);
        } catch (error) {
          addError(t("deleteClientError"), error);
        }
      }
    },
  });

  const profile = profiles.filter((profile) => profile.name === profileName);
  const profileExecutors = profile[0]?.executors || [];
  const globalProfile = globalProfiles.filter(
    (globalProfile) => globalProfile.name === profileName
  );
  const globalProfileExecutors = globalProfile[0]?.executors || [];

  setValue(
    "name",
    globalProfile.length > 0 ? globalProfile[0]?.name : profile[0]?.name
  );
  setValue(
    "description",
    globalProfile.length > 0
      ? globalProfile[0]?.description
      : profile[0]?.description
  );

  return (
    <>
      <DeleteConfirm />
      <ViewHeader
        titleKey={editMode ? profileName : t("newClientProfile")}
        badges={[
          {
            id: "global-client-profile-badge",
            text: globalProfile.length > 0 ? t("global") : "",
          },
        ]}
        divider
        dropdownItems={
          globalProfile.length === 0
            ? [
                <DropdownItem
                  key="delete"
                  value="delete"
                  onClick={toggleDeleteDialog}
                  data-testid="deleteClientProfileDropdown"
                >
                  {t("deleteClientProfile")}
                </DropdownItem>,
              ]
            : undefined
        }
      />
      <PageSection variant="light">
        <FormAccess isHorizontal role="view-realm" className="pf-u-mt-lg">
          <FormGroup
            label={t("newClientProfileName")}
            fieldId="kc-name"
            helperText={t("createClientProfileNameHelperText")}
            isRequired
            helperTextInvalid={t("common:required")}
            validated={
              errors.name ? ValidatedOptions.error : ValidatedOptions.default
            }
          >
            <TextInput
              ref={register({ required: true })}
              name="name"
              type="text"
              id="name"
              aria-label={t("name")}
              data-testid="client-profile-name"
              isReadOnly={globalProfile.length > 0}
            />
          </FormGroup>
          <FormGroup label={t("common:description")} fieldId="kc-description">
            <TextArea
              ref={register()}
              name="description"
              type="text"
              id="description"
              aria-label={t("description")}
              data-testid="client-profile-description"
              isReadOnly={globalProfile.length > 0}
            />
          </FormGroup>
          <ActionGroup>
            {globalProfile.length === 0 && (
              <Button
                variant="primary"
                onClick={save}
                data-testid="saveCreateProfile"
                isDisabled={editMode ? true : false}
              >
                {t("common:save")}
              </Button>
            )}
            {editMode && globalProfile.length === 0 && (
              <Button
                id={"reloadProfile"}
                variant="link"
                data-testid={"reloadProfile"}
              >
                {t("realm-settings:reload")}
              </Button>
            )}
            {!editMode && globalProfile.length === 0 && (
              <Button
                id={"cancelCreateProfile"}
                component={(props) => (
                  <Link
                    {...props}
                    to={`/${realm}/realm-settings/clientPolicies`}
                  />
                )}
                data-testid={"cancelCreateProfile"}
              >
                {t("common:cancel")}
              </Button>
            )}
          </ActionGroup>
          {editMode && (
            <>
              <Flex>
                <FlexItem>
                  <Text className="kc-executors" component={TextVariants.h1}>
                    {t("executors")}
                    <HelpItem
                      helpText={t("realm-settings:executorsHelpText")}
                      forLabel={t("executorsHelpItem")}
                      forID={t("executors")}
                    />
                  </Text>
                </FlexItem>
                {Object.keys(profile).length !== 0 ? (
                  <FlexItem align={{ default: "alignRight" }}>
                    <Button
                      id="addExecutor"
                      component={(props) => (
                        <Link
                          {...props}
                          to={toAddExecutor({
                            realm,
                            profileName,
                          })}
                        ></Link>
                      )}
                      variant="link"
                      className="kc-addExecutor"
                      data-testid="cancelCreateProfile"
                      icon={<PlusCircleIcon />}
                    >
                      {t("realm-settings:addExecutor")}
                    </Button>
                  </FlexItem>
                ) : (
                  // eslint-disable-next-line react/jsx-no-useless-fragment
                  <></>
                )}
              </Flex>
              {profileExecutors.length > 0 && (
                <DataList aria-label={t("executors")} isCompact>
                  {profileExecutors.map((executor, idx) => (
                    <DataListItem
                      aria-labelledby={"executors-list-item"}
                      key={`list-item-${idx}`}
                      id={executor.executor}
                    >
                      <DataListItemRow data-testid="executors-list-row">
                        <DataListItemCells
                          dataListCells={[
                            <DataListCell
                              key={`name-${idx}`}
                              data-testid="executor-type"
                            >
                              {Object.keys(executor.configuration!).length !==
                              0 ? (
                                <Link
                                  key={executor.executor}
                                  data-testid="executor-type-link"
                                  to={""}
                                  className="kc-executor-link"
                                >
                                  {executor.executor}
                                </Link>
                              ) : (
                                // eslint-disable-next-line react/jsx-no-useless-fragment
                                <>{executor.executor}</>
                              )}
                              {executorTypes?.map((type) => (
                                <>
                                  {""}
                                  {type.id === executor.executor && (
                                    <>
                                      <HelpItem
                                        key={`executorType-${type.id}`}
                                        helpText={type.helpText}
                                        forLabel={t("executorTypeTextHelpText")}
                                        forID={t(`common:helpLabel`, {
                                          label: t("executorTypeTextHelpText"),
                                        })}
                                      />
                                      <TrashIcon
                                        key={`executorType-trash-icon-${type.id}`}
                                        className="kc-executor-trash-icon"
                                        data-testid="deleteClientProfileDropdown"
                                        onClick={() => {
                                          toggleDeleteDialog();
                                          setExecutorToDelete({
                                            idx: idx,
                                            name: type.id,
                                          });
                                        }}
                                      />
                                    </>
                                  )}
                                </>
                              ))}
                            </DataListCell>,
                          ]}
                        />
                      </DataListItemRow>
                    </DataListItem>
                  ))}
                </DataList>
              )}
              {globalProfileExecutors.length > 0 && (
                <>
                  <DataList aria-label={t("executors")} isCompact>
                    {globalProfileExecutors.map((executor, idx) => (
                      <DataListItem
                        aria-labelledby={"global-executors-list-item"}
                        key={`global-list-item-${idx}`}
                        id={executor.executor}
                      >
                        <DataListItemRow data-testid="global-executors-list-row">
                          <DataListItemCells
                            dataListCells={[
                              <DataListCell
                                key={`global-name-${idx}`}
                                data-testid="global-executor-type"
                              >
                                {Object.keys(executor.configuration!).length !==
                                0 ? (
                                  <Link
                                    key={executor.executor}
                                    data-testid="global-executor-type-link"
                                    to={""}
                                    className="kc-global-executor-link"
                                  >
                                    {executor.executor}
                                  </Link>
                                ) : (
                                  // eslint-disable-next-line react/jsx-no-useless-fragment
                                  <>{executor.executor}</>
                                )}
                                {executorTypes?.map((type) => (
                                  <>
                                    {""}
                                    {type.id === executor.executor && (
                                      <HelpItem
                                        key={`global-executorType-${type.id}`}
                                        helpText={type.helpText}
                                        forLabel={t("executorTypeTextHelpText")}
                                        forID={t(`common:helpLabel`, {
                                          label: t("executorTypeTextHelpText"),
                                        })}
                                      />
                                    )}
                                  </>
                                ))}
                              </DataListCell>,
                            ]}
                          />
                        </DataListItemRow>
                      </DataListItem>
                    ))}
                  </DataList>
                  <Button
                    id="backToClientPolicies"
                    component={(props) => (
                      <Link
                        {...props}
                        to={`/${realm}/realm-settings/clientPolicies`}
                      />
                    )}
                    variant="primary"
                    className="kc-backToPolicies"
                    data-testid="backToClientPolicies"
                  >
                    {t("realm-settings:back")}
                  </Button>
                </>
              )}
              {profileExecutors.length === 0 &&
                globalProfileExecutors.length === 0 && (
                  <>
                    <Divider />
                    <Text
                      className="kc-emptyExecutors"
                      component={TextVariants.h6}
                    >
                      {t("realm-settings:emptyExecutors")}
                    </Text>
                  </>
                )}
            </>
          )}
        </FormAccess>
      </PageSection>
    </>
  );
};
