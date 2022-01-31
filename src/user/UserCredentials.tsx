import React, {
  Fragment,
  FunctionComponent,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertVariant,
  Button,
  ButtonVariant,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownPosition,
  Form,
  FormGroup,
  KebabToggle,
  Modal,
  ModalVariant,
  Select,
  SelectOption,
  SelectVariant,
  Switch,
  Text,
  TextInput,
  TextVariants,
  ValidatedOptions,
} from "@patternfly/react-core";
import {
  Table,
  TableBody,
  TableComposable,
  TableHeader,
  TableVariant,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import { PencilAltIcon, CheckIcon, TimesIcon } from "@patternfly/react-icons";
import type UserRepresentation from "@keycloak/keycloak-admin-client/lib/defs/userRepresentation";
import { useTranslation } from "react-i18next";
import { isEmpty } from "lodash/fp";
import { useAlerts } from "../components/alert/Alerts";
import { ListEmptyState } from "../components/list-empty-state/ListEmptyState";
import { useAdminClient, useFetch } from "../context/auth/AdminClient";
import { useWhoAmI } from "../context/whoami/WhoAmI";
import { Controller, useForm, UseFormMethods, useWatch } from "react-hook-form";
import { PasswordInput } from "../components/password-input/PasswordInput";
import { HelpItem } from "../components/help-enabler/HelpItem";
import "./user-credentials.css";
import { useConfirmDialog } from "../components/confirm-dialog/ConfirmDialog";
import type CredentialRepresentation from "@keycloak/keycloak-admin-client/lib/defs/credentialRepresentation";
import { FormAccess } from "../components/form-access/FormAccess";
import { RequiredActionAlias } from "@keycloak/keycloak-admin-client/lib/defs/requiredActionProviderRepresentation";
import { TimeSelector } from "../components/time-selector/TimeSelector";
import styles from "@patternfly/react-styles/css/components/Table/table";

type UserCredentialsProps = {
  user: UserRepresentation;
};

type CredentialsForm = {
  password: string;
  passwordConfirmation: string;
  temporaryPassword: boolean;
};

type CredentialResetForm = {
  actions: RequiredActionAlias[];
  lifespan: number;
};

const credFormDefaultValues: CredentialsForm = {
  password: "",
  passwordConfirmation: "",
  temporaryPassword: true,
};

const credResetFormDefaultValues: CredentialResetForm = {
  actions: [],
  lifespan: 43200, // 12 hours
};

type DisplayDialogProps = {
  titleKey: string;
  onClose: () => void;
};

type UserLabelForm = {
  userLabel: string;
};

const userLabelDefaultValues: UserLabelForm = {
  userLabel: "",
};

type ExpandableCredentialRepresentation = {
  key: string;
  value: CredentialRepresentation[];
  isExpanded: boolean;
};

const DisplayDialog: FunctionComponent<DisplayDialogProps> = ({
  titleKey,
  onClose,
  children,
}) => {
  const { t } = useTranslation("users");
  return (
    <Modal
      variant={ModalVariant.medium}
      title={t(titleKey)}
      isOpen={true}
      onClose={onClose}
    >
      {children}
    </Modal>
  );
};

const CredentialsResetActionMultiSelect = (props: {
  form: UseFormMethods<CredentialResetForm>;
}) => {
  const { t } = useTranslation("users");
  const [open, setOpen] = useState(false);
  const { form } = props;
  const { control } = form;

  return (
    <FormGroup
      label={t("resetActions")}
      labelIcon={
        <HelpItem
          helpText="clients-help:resetActions"
          fieldLabelId="resetActions"
        />
      }
      fieldId="actions"
    >
      <Controller
        name="actions"
        defaultValue={[]}
        control={control}
        render={({ onChange, value }) => (
          <Select
            toggleId="actions"
            variant={SelectVariant.typeaheadMulti}
            chipGroupProps={{
              numChips: 3,
            }}
            menuAppendTo="parent"
            onToggle={(open) => setOpen(open)}
            isOpen={open}
            selections={value.map((o: string) => o)}
            onSelect={(_, selectedValue) =>
              onChange(
                value.find((o: string) => o === selectedValue)
                  ? value.filter((item: string) => item !== selectedValue)
                  : [...value, selectedValue]
              )
            }
            onClear={(event) => {
              event.stopPropagation();
              onChange([]);
            }}
            aria-label={t("resetActions")}
          >
            {Object.values(RequiredActionAlias).map((action, index) => (
              <SelectOption
                key={index}
                value={action}
                data-testid={`${action}-option`}
              >
                {t(action)}
              </SelectOption>
            ))}
          </Select>
        )}
      />
    </FormGroup>
  );
};

const LifespanField = ({
  form: { control },
}: {
  form: UseFormMethods<CredentialResetForm>;
}) => {
  const { t } = useTranslation("users");

  return (
    <FormGroup
      fieldId="lifespan"
      label={t("lifespan")}
      isStack
      labelIcon={
        <HelpItem helpText="clients-help:lifespan" fieldLabelId="lifespan" />
      }
    >
      <Controller
        name="lifespan"
        defaultValue={credResetFormDefaultValues.lifespan}
        control={control}
        render={({ onChange, value }) => (
          <TimeSelector
            value={value}
            units={["minutes", "hours", "days"]}
            onChange={onChange}
            menuAppendTo="parent"
          />
        )}
      />
    </FormGroup>
  );
};

export const UserCredentials = ({ user }: UserCredentialsProps) => {
  const { t } = useTranslation("users");
  const { whoAmI } = useWhoAmI();
  const { addAlert, addError } = useAlerts();
  const [key, setKey] = useState(0);
  const refresh = () => setKey(key + 1);
  const [open, setOpen] = useState(false);
  const [openSaveConfirm, setOpenSaveConfirm] = useState(false);
  const [openCredentialReset, setOpenCredentialReset] = useState(false);
  const [kebabOpen, setKebabOpen] = useState({
    status: false,
    rowKey: "",
  });
  const adminClient = useAdminClient();
  const form = useForm<CredentialsForm>({
    defaultValues: credFormDefaultValues,
  });
  const resetForm = useForm<CredentialResetForm>({
    defaultValues: credResetFormDefaultValues,
  });
  const userLabelForm = useForm<UserLabelForm>({
    defaultValues: userLabelDefaultValues,
  });
  const { control, errors, handleSubmit, register } = form;
  const { control: resetControl, handleSubmit: resetHandleSubmit } = resetForm;
  const {
    getValues: getValues1,
    handleSubmit: handleSubmit1,
    register: register1,
  } = userLabelForm;
  const [credentials, setCredentials] = useState<CredentialsForm>();
  const [credentialsReset, setCredentialReset] = useState<CredentialResetForm>(
    {} as CredentialResetForm
  );
  const [userCredentials, setUserCredentials] = useState<
    CredentialRepresentation[]
  >([]);
  const [groupedUserCredentials, setGroupedUserCredentials] = useState<
    ExpandableCredentialRepresentation[]
  >([]);
  const [selectedCredential, setSelectedCredential] =
    useState<CredentialRepresentation>({});
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [showData, setShowData] = useState(false);
  const [editedUserCredential, setEditedUserCredential] =
    useState<CredentialRepresentation>({});
  const [isUserLabelEdit, setIsUserLabelEdit] = useState<{
    status: boolean;
    rowKey: string;
  }>();

  const [draggedItemId, setDraggedItemId] = useState(null);
  const [draggingToItemIndex, setDraggingToItemIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [itemOrder, setItemOrder] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [tempItemOrder, setTempItemOrder] = useState([]);
  const bodyRef = useRef();

  useFetch(
    () => adminClient.users.getCredentials({ id: user.id! }),
    (credentials) => {
      setUserCredentials(credentials);

      const groupedCredentials = credentials.reduce((r, a) => {
        r[a.type!] = r[a.type!] || [];
        r[a.type!].push(a);
        return r;
      }, Object.create(null));

      const groupedCredentialsArray = Object.keys(groupedCredentials).map(
        (key) => ({ key, value: groupedCredentials[key] })
      );

      setGroupedUserCredentials(
        groupedCredentialsArray.map((groupedCredential) => ({
          ...groupedCredential,
          isExpanded: false,
        }))
      );
    },
    [key]
  );

  const passwordTypeFinder = userCredentials.find(
    (credential) => credential.type === "password"
  );

  const passwordWatcher = useWatch<CredentialsForm["password"]>({
    control,
    name: "password",
  });

  const resetActionWatcher = useWatch<CredentialResetForm["actions"]>({
    control: resetControl,
    name: "actions",
  });

  const passwordConfirmationWatcher = useWatch<
    CredentialsForm["passwordConfirmation"]
  >({
    control,
    name: "passwordConfirmation",
  });

  const isNotDisabled =
    passwordWatcher !== "" && passwordConfirmationWatcher !== "";

  const resetIsNotDisabled = !isEmpty(resetActionWatcher);

  const toggleModal = () => {
    setOpen(!open);
  };

  const toggleCredentialsResetModal = () => {
    setOpenCredentialReset(!openCredentialReset);
  };

  const toggleConfirmSaveModal = () => {
    setOpenSaveConfirm(!openSaveConfirm);
  };

  const saveUserPassword = async () => {
    if (!credentials) {
      return;
    }

    const passwordsMatch =
      credentials.password === credentials.passwordConfirmation;

    if (!passwordsMatch) {
      addAlert(
        isResetPassword
          ? t("resetPasswordNotMatchError")
          : t("savePasswordNotMatchError"),
        AlertVariant.danger
      );
    } else {
      try {
        await adminClient.users.resetPassword({
          id: user.id!,
          credential: {
            temporary: credentials.temporaryPassword,
            type: "password",
            value: credentials.password,
          },
        });
        refresh();
        addAlert(
          isResetPassword
            ? t("resetCredentialsSuccess")
            : t("savePasswordSuccess"),
          AlertVariant.success
        );
        setIsResetPassword(false);
        setOpenSaveConfirm(false);
      } catch (error) {
        addError(
          isResetPassword
            ? "users:resetPasswordError"
            : "users:savePasswordError",
          error
        );
      }
    }
  };

  const sendCredentialsResetEmail = async () => {
    if (isEmpty(credentialsReset.actions)) {
      return;
    }

    try {
      await adminClient.users.executeActionsEmail({
        id: user.id!,
        actions: credentialsReset.actions,
        lifespan: credentialsReset.lifespan,
      });
      refresh();
      addAlert(t("credentialResetEmailSuccess"), AlertVariant.success);
      setOpenCredentialReset(false);
    } catch (error) {
      addError(t("credentialResetEmailError"), error);
    }
  };

  const resetPassword = () => {
    setIsResetPassword(true);
    setOpen(true);
  };

  const [toggleDeleteDialog, DeleteConfirm] = useConfirmDialog({
    titleKey: t("deleteCredentialsConfirmTitle"),
    messageKey: t("deleteCredentialsConfirm"),
    continueButtonLabel: t("common:delete"),
    continueButtonVariant: ButtonVariant.danger,
    onConfirm: async () => {
      try {
        await adminClient.users.deleteCredential({
          id: user.id!,
          credentialId: selectedCredential.id!,
        });
        addAlert(t("deleteCredentialsSuccess"), AlertVariant.success);
        setKey((key) => key + 1);
      } catch (error) {
        addError("users:deleteCredentialsError", error);
      }
    },
  });

  const rows = useMemo(() => {
    if (!selectedCredential.credentialData) {
      return [];
    }

    const credentialData = JSON.parse(selectedCredential.credentialData);
    const locale = whoAmI.getLocale();

    return Object.entries(credentialData)
      .sort(([a], [b]) => a.localeCompare(b, locale))
      .map<[string, string]>(([key, value]) => {
        if (typeof value === "string") {
          return [key, value];
        }

        return [key, JSON.stringify(value)];
      });
  }, [selectedCredential.credentialData]);

  const saveUserLabel = async () => {
    const credentialToEdit = userCredentials.find(
      (credential) => credential.id === editedUserCredential.id
    );

    const userLabelFormValue = getValues1();

    if (!credentialToEdit) {
      return;
    }

    try {
      await adminClient.users.updateCredentialLabel(
        {
          id: user.id!,
          credentialId: credentialToEdit.id!,
        },
        userLabelFormValue.userLabel || ""
      );
      refresh();
      addAlert(t("updateCredentialUserLabelSuccess"), AlertVariant.success);
      setEditedUserCredential({});
    } catch (error) {
      addError("users:updateCredentialUserLabelError", error);
    }

    setIsUserLabelEdit({
      status: false,
      rowKey: credentialToEdit.id!,
    });
  };

  const onDragStart = (evt: {
    dataTransfer: {
      effectAllowed: string;
      setData: (arg0: string, arg1: any) => void;
    };
    currentTarget: {
      id: any;
      classList: { add: (arg0: any) => void };
      setAttribute: (arg0: string, arg1: string) => void;
    };
  }) => {
    evt.dataTransfer.effectAllowed = "move";
    evt.dataTransfer.setData("text/plain", evt.currentTarget.id);
    const draggedItemId = evt.currentTarget.id;

    evt.currentTarget.classList.add(styles.modifiers.ghostRow);
    evt.currentTarget.setAttribute("aria-pressed", "true");

    setDraggedItemId(draggedItemId);
    setIsDragging(true);
  };

  const moveItem = (arr: any[], i1: null, toIndex: number) => {
    const fromIndex = arr.indexOf(i1);
    if (fromIndex === toIndex) {
      return arr;
    }
    const temp = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, temp[0]);

    return arr;
  };

  const move = (itemOrder: any[]) => {
    const ulNode = bodyRef.current;
    const nodes = Array.from(ulNode.children);
    if (nodes.map((node) => node.id).every((id, i) => id === itemOrder[i])) {
      return;
    }
    while (ulNode.firstChild) {
      ulNode.removeChild(ulNode.lastChild);
    }

    itemOrder.forEach((id: any) => {
      ulNode.appendChild(nodes.find((n) => n.id === id));
    });
  };

  const onDragCancel = () => {
    Array.from(bodyRef.current.children).forEach((el) => {
      el.classList.remove(styles.modifiers.ghostRow);
      el.setAttribute("aria-pressed", "false");
    });
    setDraggedItemId(null);
    setDraggingToItemIndex(null);
    setIsDragging(false);
  };

  const onDragLeave = (evt: any) => {
    if (!isValidDrop(evt)) {
      move(itemOrder);
      setDraggingToItemIndex(null);
    }
  };

  const isValidDrop = (evt: { clientX: number; clientY: number }) => {
    const ulRect = bodyRef.current.getBoundingClientRect();
    return (
      evt.clientX > ulRect.x &&
      evt.clientX < ulRect.x + ulRect.width &&
      evt.clientY > ulRect.y &&
      evt.clientY < ulRect.y + ulRect.height
    );
  };

  const onDrop = (evt: any) => {
    if (isValidDrop(evt)) {
      setItemOrder(tempItemOrder);
    } else {
      onDragCancel();
    }
  };

  const onDragOver = (evt: {
    preventDefault: () => void;
    target: { closest: (arg0: string) => any };
  }) => {
    evt.preventDefault();

    const curListItem = evt.target.closest("tr");
    if (
      !curListItem ||
      !bodyRef.current.contains(curListItem) ||
      curListItem.id === draggedItemId
    ) {
      return null;
    } else {
      const dragId = curListItem.id;
      const newDraggingToItemIndex = Array.from(
        bodyRef.current.children
      ).findIndex((item) => item.id === dragId);
      if (newDraggingToItemIndex !== draggingToItemIndex) {
        const tempItemOrder = moveItem(
          [...itemOrder],
          draggedItemId,
          newDraggingToItemIndex
        );
        move(tempItemOrder);
        setDraggingToItemIndex(newDraggingToItemIndex);
        setTempItemOrder(tempItemOrder);
      }
    }
  };

  const onDragEnd = (evt: { target: any }) => {
    const target = evt.target;
    target.classList.remove(styles.modifiers.ghostRow);
    target.setAttribute("aria-pressed", "false");
    setDraggedItemId(null);
    setDraggingToItemIndex(null);
    setIsDragging(false);
  };

  return (
    <>
      {open && (
        <Modal
          variant={ModalVariant.small}
          width={600}
          title={
            isResetPassword
              ? t("resetPasswordFor", { username: user.username })
              : t("setPasswordFor", { username: user.username })
          }
          isOpen
          onClose={() => {
            setIsResetPassword(false);
            setOpen(false);
          }}
          actions={[
            <Button
              data-testid="okBtn"
              key={`confirmBtn-${user.id}`}
              variant="primary"
              form="userCredentials-form"
              onClick={() => {
                setOpen(false);
                setCredentials(form.getValues());
                toggleConfirmSaveModal();
              }}
              isDisabled={!isNotDisabled}
            >
              {t("save")}
            </Button>,
            <Button
              data-testid="cancelBtn"
              key={`cancelBtn-${user.id}`}
              variant="link"
              form="userCredentials-form"
              onClick={() => {
                setIsResetPassword(false);
                setOpen(false);
              }}
            >
              {t("cancel")}
            </Button>,
          ]}
        >
          <Form
            id="userCredentials-form"
            isHorizontal
            className="keycloak__user-credentials__reset-form"
          >
            <FormGroup
              name="password"
              label={t("password")}
              fieldId="password"
              helperTextInvalid={t("common:required")}
              validated={
                errors.password
                  ? ValidatedOptions.error
                  : ValidatedOptions.default
              }
              isRequired
            >
              <PasswordInput
                data-testid="passwordField"
                name="password"
                aria-label="password"
                ref={register({ required: true })}
              />
            </FormGroup>
            <FormGroup
              name="passwordConfirmation"
              label={
                isResetPassword
                  ? t("resetPasswordConfirmation")
                  : t("passwordConfirmation")
              }
              fieldId="passwordConfirmation"
              helperTextInvalid={t("common:required")}
              validated={
                errors.passwordConfirmation
                  ? ValidatedOptions.error
                  : ValidatedOptions.default
              }
              isRequired
            >
              <PasswordInput
                data-testid="passwordConfirmationField"
                name="passwordConfirmation"
                aria-label="passwordConfirm"
                ref={register({ required: true })}
              />
            </FormGroup>
            <FormGroup
              label={t("common:temporaryPassword")}
              labelIcon={
                <HelpItem
                  helpText="temporaryPasswordHelpText"
                  fieldLabelId="temporaryPassword"
                />
              }
              fieldId="kc-temporaryPassword"
            >
              <Controller
                name="temporaryPassword"
                defaultValue={true}
                control={control}
                render={({ onChange, value }) => (
                  <Switch
                    className={"kc-temporaryPassword"}
                    onChange={(value) => onChange(value)}
                    isChecked={value}
                    label={t("common:on")}
                    labelOff={t("common:off")}
                  />
                )}
              />
            </FormGroup>
          </Form>
        </Modal>
      )}
      {openSaveConfirm && (
        <Modal
          variant={ModalVariant.small}
          width={600}
          title={
            isResetPassword
              ? t("resetPasswordConfirm")
              : t("setPasswordConfirm")
          }
          isOpen
          onClose={() => setOpenSaveConfirm(false)}
          actions={[
            <Button
              data-testid="setPasswordBtn"
              key={`confirmSaveBtn-${user.id}`}
              variant="danger"
              form="userCredentials-form"
              onClick={() => {
                handleSubmit(saveUserPassword)();
              }}
            >
              {isResetPassword ? t("resetPassword") : t("savePassword")}
            </Button>,
            <Button
              data-testid="cancelSetPasswordBtn"
              key={`cancelConfirmBtn-${user.id}`}
              variant="link"
              form="userCredentials-form"
              onClick={() => {
                setOpenSaveConfirm(false);
              }}
            >
              {t("cancel")}
            </Button>,
          ]}
        >
          <Text component={TextVariants.h3}>
            {isResetPassword
              ? `${t("resetPasswordConfirmText")} ${user.username} ${t(
                  "questionMark"
                )}`
              : `${t("setPasswordConfirmText")} ${user.username} ${t(
                  "questionMark"
                )}`}
          </Text>
        </Modal>
      )}
      {openCredentialReset && (
        <Modal
          variant={ModalVariant.medium}
          title={t("credentialReset")}
          isOpen
          onClose={() => {
            setOpenCredentialReset(false);
          }}
          data-testid="credential-reset-modal"
          actions={[
            <Button
              data-testid="okBtn"
              key={`confirmBtn-${user.id}`}
              variant="primary"
              form="userCredentialsReset-form"
              onClick={() => {
                setCredentialReset(resetForm.getValues());
                resetHandleSubmit(sendCredentialsResetEmail)();
              }}
              isDisabled={!resetIsNotDisabled}
            >
              {t("credentialResetConfirm")}
            </Button>,
            <Button
              data-testid="cancelBtn"
              key={`cancelBtn-${user.id}`}
              variant="link"
              form="userCredentialsReset-form"
              onClick={() => {
                setOpenCredentialReset(false);
              }}
            >
              {t("cancel")}
            </Button>,
          ]}
        >
          <Form id="userCredentialsReset-form" isHorizontal>
            <CredentialsResetActionMultiSelect form={resetForm} />
            <LifespanField form={resetForm} />
          </Form>
        </Modal>
      )}
      <DeleteConfirm />
      {showData && Object.keys(selectedCredential).length !== 0 && (
        <DisplayDialog
          titleKey={t("passwordDataTitle")}
          onClose={() => {
            setShowData(false);
            setSelectedCredential({});
          }}
        >
          <Table
            aria-label="password-data"
            data-testid="password-data-dialog"
            variant={TableVariant.compact}
            cells={[t("showPasswordDataName"), t("showPasswordDataValue")]}
            rows={rows}
          >
            <TableHeader />
            <TableBody />
          </Table>
        </DisplayDialog>
      )}
      {userCredentials.length !== 0 && passwordTypeFinder === undefined && (
        <>
          <Button
            key={`confirmSaveBtn-table-${user.id}`}
            className="kc-setPasswordBtn-tbl"
            data-testid="setPasswordBtn-table"
            variant="primary"
            form="userCredentials-form"
            onClick={() => {
              setOpen(true);
            }}
          >
            {t("savePassword")}
          </Button>
          <Divider />
        </>
      )}
      {groupedUserCredentials.length !== 0 ? (
        <>
          {user.email && (
            <Button
              className="resetCredentialBtn-header"
              variant="primary"
              data-testid="credentialResetBtn"
              onClick={() => setOpenCredentialReset(true)}
            >
              {t("credentialResetBtn")}
            </Button>
          )}
          <TableComposable aria-label="password-data-table" variant={"compact"}>
            <Thead>
              <Tr>
                <Th>
                  <HelpItem
                    helpText="users:userCredentialsHelpText"
                    fieldLabelId="users:userCredentialsHelpTextLabel"
                  />
                </Th>
                <Th />
                <Th>{t("type")}</Th>
                <Th>{t("userLabel")}</Th>
                <Th>{t("data")}</Th>
                <Th />
                <Th />
              </Tr>
            </Thead>
            {groupedUserCredentials.map((groupedCredential, rowIndex) => (
              <Fragment key={`table-${groupedCredential.key}`}>
                <Tr
                  id={groupedCredential.value
                    .map((credential) => {
                      return credential.id;
                    })
                    .toString()}
                  draggable
                  onDrop={onDrop}
                  onDragEnd={onDragEnd}
                  onDragStart={onDragStart}
                >
                  <Td
                    draggableRow={{
                      id: `draggable-row-${groupedCredential.key}`,
                    }}
                  />
                  {groupedCredential.value.length > 1 ? (
                    <Td
                      className="kc-expandRow-btn"
                      expand={{
                        rowIndex,
                        isExpanded: groupedCredential.isExpanded,
                        onToggle: (_, rowIndex) => {
                          const rows = groupedUserCredentials.map(
                            (credential, index) =>
                              index === rowIndex
                                ? {
                                    ...credential,
                                    isExpanded: !credential.isExpanded,
                                  }
                                : credential
                          );
                          setGroupedUserCredentials(rows);
                        },
                      }}
                    />
                  ) : (
                    <Td />
                  )}
                  <Td
                    key={`table-item-${groupedCredential.key}`}
                    dataLabel={`columns-${groupedCredential.key}`}
                    className="kc-notExpandableRow-credentialType"
                  >
                    {groupedCredential.key.charAt(0).toUpperCase()! +
                      groupedCredential.key.slice(1)}
                  </Td>
                  {groupedCredential.value.length <= 1 &&
                    groupedCredential.value.map((credential) => (
                      <>
                        <Td>
                          <FormAccess
                            isHorizontal
                            role="view-users"
                            className="kc-form-userLabel"
                          >
                            <FormGroup
                              fieldId="kc-userLabel"
                              className="kc-userLabel-row"
                            >
                              <div className="kc-form-group-userLabel">
                                {isUserLabelEdit?.status &&
                                isUserLabelEdit.rowKey === credential.id ? (
                                  <>
                                    <TextInput
                                      name="userLabel"
                                      ref={register1()}
                                      type="text"
                                      className="kc-userLabel"
                                      aria-label={t("userLabel")}
                                      data-testid="user-label-fld"
                                    />
                                    <div className="kc-userLabel-actionBtns">
                                      <Button
                                        key={`editUserLabel-accept-${credential.id}`}
                                        variant="link"
                                        className="kc-editUserLabel-acceptBtn"
                                        onClick={() => {
                                          handleSubmit1(saveUserLabel)();
                                          setIsUserLabelEdit({
                                            status: false,
                                            rowKey: credential.id!,
                                          });
                                        }}
                                        data-testid="editUserLabel-acceptBtn"
                                        icon={<CheckIcon />}
                                      />
                                      <Button
                                        key={`editUserLabel-cancel-${credential.id}`}
                                        variant="link"
                                        className="kc-editUserLabel-cancelBtn"
                                        onClick={() =>
                                          setIsUserLabelEdit({
                                            status: false,
                                            rowKey: credential.id!,
                                          })
                                        }
                                        data-testid="editUserLabel-cancelBtn"
                                        icon={<TimesIcon />}
                                      />
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    {credential.userLabel ?? ""}
                                    <Button
                                      key={`editUserLabel-${credential.id}`}
                                      variant="link"
                                      className="kc-editUserLabel-btn"
                                      onClick={() => {
                                        setEditedUserCredential(credential);
                                        setIsUserLabelEdit({
                                          status: true,
                                          rowKey: credential.id!,
                                        });
                                      }}
                                      data-testid="editUserLabelBtn"
                                      icon={<PencilAltIcon />}
                                    />
                                  </>
                                )}
                              </div>
                            </FormGroup>
                          </FormAccess>
                        </Td>
                        <Td>
                          <Button
                            className="kc-showData-btn"
                            variant="link"
                            data-testid="showDataBtn"
                            onClick={() => {
                              setShowData(true);
                              setSelectedCredential(credential);
                            }}
                          >
                            {t("showDataBtn")}
                          </Button>
                        </Td>
                        {credential.type === "password" ? (
                          <Td>
                            <Button
                              variant="secondary"
                              data-testid="resetPasswordBtn"
                              onClick={resetPassword}
                            >
                              {t("resetPasswordBtn")}
                            </Button>
                          </Td>
                        ) : (
                          <Td />
                        )}
                        <Td>
                          <Dropdown
                            isPlain
                            position={DropdownPosition.right}
                            toggle={
                              <KebabToggle
                                onToggle={(status) =>
                                  setKebabOpen({
                                    status,
                                    rowKey: credential.id!,
                                  })
                                }
                              />
                            }
                            isOpen={
                              kebabOpen.status &&
                              kebabOpen.rowKey === credential.id
                            }
                            onSelect={() => {
                              setSelectedCredential(credential);
                            }}
                            dropdownItems={[
                              <DropdownItem
                                key={`delete-dropdown-item-${credential.id}`}
                                data-testid="deleteDropdownItem"
                                component="button"
                                onClick={() => {
                                  toggleDeleteDialog();
                                  setKebabOpen({
                                    status: false,
                                    rowKey: credential.id!,
                                  });
                                }}
                              >
                                {t("deleteBtn")}
                              </DropdownItem>,
                            ]}
                          />
                        </Td>
                      </>
                    ))}
                </Tr>
                {groupedCredential.isExpanded &&
                  groupedCredential.value.map((credential) => (
                    <Tr key={`child-key-${credential.id}`}>
                      <Td />
                      <Td />
                      <Td
                        key={`child-item-${credential.id}`}
                        dataLabel={`child-columns-${credential.id}`}
                        className="kc-expandableRow-credentialType"
                      >
                        {credential.type!.charAt(0).toUpperCase()! +
                          credential.type!.slice(1)}
                      </Td>
                      <Td>
                        <FormAccess
                          isHorizontal
                          role="view-users"
                          className="kc-form-userLabel"
                        >
                          <FormGroup
                            fieldId="kc-userLabel"
                            className="kc-userLabel-row"
                          >
                            <div className="kc-form-group-userLabel">
                              {isUserLabelEdit?.status &&
                              isUserLabelEdit.rowKey === credential.id ? (
                                <>
                                  <TextInput
                                    name="userLabel"
                                    ref={register1()}
                                    type="text"
                                    className="kc-userLabel"
                                    aria-label={t("userLabel")}
                                    data-testid="user-label-fld"
                                  />
                                  <div className="kc-userLabel-actionBtns">
                                    <Button
                                      key={`editUserLabel-accept-${credential.id}`}
                                      variant="link"
                                      className="kc-editUserLabel-acceptBtn"
                                      onClick={() => {
                                        handleSubmit1(saveUserLabel)();
                                        setIsUserLabelEdit({
                                          status: false,
                                          rowKey: credential.id!,
                                        });
                                      }}
                                      data-testid="editUserLabel-acceptBtn"
                                      icon={<CheckIcon />}
                                    />
                                    <Button
                                      key={`editUserLabel-cancel-${credential.id}`}
                                      variant="link"
                                      className="kc-editUserLabel-cancelBtn"
                                      onClick={() =>
                                        setIsUserLabelEdit({
                                          status: false,
                                          rowKey: credential.id!,
                                        })
                                      }
                                      data-testid="editUserLabel-cancelBtn"
                                      icon={<TimesIcon />}
                                    />
                                  </div>
                                </>
                              ) : (
                                <>
                                  {credential.userLabel ?? ""}
                                  <Button
                                    key={`editUserLabel-${credential.id}`}
                                    variant="link"
                                    className="kc-editUserLabel-btn"
                                    onClick={() => {
                                      setEditedUserCredential(credential);
                                      setIsUserLabelEdit({
                                        status: true,
                                        rowKey: credential.id!,
                                      });
                                    }}
                                    data-testid="editUserLabelBtn"
                                    icon={<PencilAltIcon />}
                                  />
                                </>
                              )}
                            </div>
                          </FormGroup>
                        </FormAccess>
                      </Td>
                      <Td>
                        <Button
                          className="kc-showData-btn"
                          variant="link"
                          data-testid="showDataBtn"
                          onClick={() => {
                            setShowData(true);
                            setSelectedCredential(credential);
                          }}
                        >
                          {t("showDataBtn")}
                        </Button>
                      </Td>
                      <Td />
                      <Td>
                        <Dropdown
                          isPlain
                          position={DropdownPosition.right}
                          toggle={
                            <KebabToggle
                              onToggle={(status) =>
                                setKebabOpen({
                                  status,
                                  rowKey: credential.id!,
                                })
                              }
                            />
                          }
                          isOpen={
                            kebabOpen.status &&
                            kebabOpen.rowKey === credential.id
                          }
                          onSelect={() => {
                            setSelectedCredential(credential);
                          }}
                          dropdownItems={[
                            <DropdownItem
                              key={`delete-dropdown-item-${credential.id}`}
                              data-testid="deleteDropdownItem"
                              component="button"
                              onClick={() => {
                                toggleDeleteDialog();
                                setKebabOpen({
                                  status: false,
                                  rowKey: credential.id!,
                                });
                              }}
                            >
                              {t("deleteBtn")}
                            </DropdownItem>,
                          ]}
                        />
                      </Td>
                    </Tr>
                  ))}
              </Fragment>
            ))}
          </TableComposable>
        </>
      ) : (
        <ListEmptyState
          hasIcon={true}
          message={t("noCredentials")}
          instructions={t("noCredentialsText")}
          primaryActionText={t("setPassword")}
          onPrimaryAction={toggleModal}
          secondaryActions={
            user.email
              ? [
                  {
                    text: t("credentialResetBtn"),
                    onClick: toggleCredentialsResetModal,
                    type: ButtonVariant.link,
                  },
                ]
              : undefined
          }
        />
      )}
    </>
  );
};
