import React, { Fragment, useMemo, useRef, useState } from "react";
import {
  AlertVariant,
  Button,
  ButtonVariant,
  Divider,
} from "@patternfly/react-core";
import {
  TableComposable,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import type UserRepresentation from "@keycloak/keycloak-admin-client/lib/defs/userRepresentation";
import { useTranslation } from "react-i18next";
import { useAlerts } from "../components/alert/Alerts";
import { ListEmptyState } from "../components/list-empty-state/ListEmptyState";
import { useAdminClient, useFetch } from "../context/auth/AdminClient";
import { HelpItem } from "../components/help-enabler/HelpItem";
import { useConfirmDialog } from "../components/confirm-dialog/ConfirmDialog";
import type CredentialRepresentation from "@keycloak/keycloak-admin-client/lib/defs/credentialRepresentation";
import { ResetPasswordDialog } from "./user-credentials/ResetPasswordDialog";
import { ResetCredentialDialog } from "./user-credentials/ResetCredentialDialog";
import { InlineLabelEdit } from "./user-credentials/InlineLabelEdit";
import "./user-credentials.css";
import styles from "@patternfly/react-styles/css/components/Table/table";
import { CredentialRow } from "./user-credentials/CredentialRow";
import { toUpperCase } from "../util";

type UserCredentialsProps = {
  user: UserRepresentation;
};

type ExpandableCredentialRepresentation = {
  key: string;
  value: CredentialRepresentation[];
  isExpanded: boolean;
};

export const UserCredentials = ({ user }: UserCredentialsProps) => {
  const { t } = useTranslation("users");
  const { addAlert, addError } = useAlerts();
  const [key, setKey] = useState(0);
  const refresh = () => setKey(key + 1);
  const [isOpen, setIsOpen] = useState(false);
  const [openCredentialReset, setOpenCredentialReset] = useState(false);
  const adminClient = useAdminClient();
  const [userCredentials, setUserCredentials] = useState<
    CredentialRepresentation[]
  >([]);
  const [groupedUserCredentials, setGroupedUserCredentials] = useState<
    ExpandableCredentialRepresentation[]
  >([]);
  const [selectedCredential, setSelectedCredential] =
    useState<CredentialRepresentation>({});
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [isUserLabelEdit, setIsUserLabelEdit] = useState<{
    status: boolean;
    rowKey: string;
  }>();

  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const [state, setState] = useState({
    draggedItemId: "",
    draggingToItemIndex: -1,
    dragging: false,
    tempItemOrder: [""],
  });

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

  const toggleModal = () => setIsOpen(!isOpen);

  const toggleCredentialsResetModal = () => {
    setOpenCredentialReset(!openCredentialReset);
  };

  const resetPassword = () => {
    setIsResetPassword(true);
    toggleModal();
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

  const Row = ({ credential }: { credential: CredentialRepresentation }) => (
    <CredentialRow
      key={credential.id}
      credential={credential}
      toggleDelete={() => {
        setSelectedCredential(credential);
        toggleDeleteDialog();
      }}
      resetPassword={resetPassword}
    >
      <InlineLabelEdit
        credential={credential}
        userId={user.id!}
        isEditable={
          (isUserLabelEdit?.status &&
            isUserLabelEdit.rowKey === credential.id) ||
          false
        }
        toggle={() => {
          setIsUserLabelEdit({
            status: !isUserLabelEdit?.status,
            rowKey: credential.id!,
          });
          if (isUserLabelEdit?.status) {
            refresh();
          }
        }}
      />
    </CredentialRow>
  );

  const itemOrder: string[] = useMemo(() => {
    const test = groupedUserCredentials.map((d) =>
      d.value
        .map((credential) => {
          return credential.id;
        })
        .toString()
    );
    return test;
  }, [groupedUserCredentials]);

  const onDragStart = (evt: React.DragEvent) => {
    evt.dataTransfer.effectAllowed = "move";
    evt.dataTransfer.setData("text/plain", evt.currentTarget.id);
    const draggedItemId = evt.currentTarget.id;
    evt.currentTarget.classList.add(styles.modifiers.ghostRow);
    evt.currentTarget.setAttribute("aria-pressed", "true");
    setState({ ...state, draggedItemId, dragging: true });
  };

  const moveItem = (arr: string[], i1: string, toIndex: number) => {
    const fromIndex = arr.indexOf(i1);
    if (fromIndex === toIndex) {
      return arr;
    }
    const temp = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, temp[0]);
    return arr;
  };

  const move = (itemOrder: string[]) => {
    if (!bodyRef.current) return;
    const ulNode = bodyRef.current;
    const nodes = Array.from(ulNode.children);
    if (nodes.map((node) => node.id).every((id, i) => id === itemOrder[i])) {
      return;
    }
    while (ulNode.firstChild) {
      ulNode.removeChild(ulNode.lastChild!);
    }
    itemOrder.forEach((id) => {
      ulNode.appendChild(nodes.find((n) => n.id === id)!);
    });
  };

  const onDragCancel = () => {
    Array.from(bodyRef.current?.children || []).forEach((el) => {
      el.classList.remove(styles.modifiers.ghostRow);
      el.setAttribute("aria-pressed", "false");
    });
    setState({
      ...state,
      draggedItemId: "",
      draggingToItemIndex: -1,
      dragging: false,
    });
  };

  const onDragLeave = (evt: React.DragEvent) => {
    if (!isValidDrop(evt)) {
      move(itemOrder);
      setState({ ...state, draggingToItemIndex: -1 });
    }
  };

  const isValidDrop = (evt: React.DragEvent) => {
    const ulRect = bodyRef.current!.getBoundingClientRect();
    return (
      evt.clientX > ulRect.x &&
      evt.clientX < ulRect.x + ulRect.width &&
      evt.clientY > ulRect.y &&
      evt.clientY < ulRect.y + ulRect.height
    );
  };

  const onDrop = (evt: React.DragEvent) => {
    if (isValidDrop(evt)) {
      onDragFinish(state.draggedItemId, state.tempItemOrder);
    } else {
      onDragCancel();
    }
  };

  const onDragOver = (evt: React.DragEvent) => {
    evt.preventDefault();
    const td = evt.target as HTMLTableCellElement;
    const curListItem = td.closest("tr");
    if (
      !curListItem ||
      (bodyRef.current && !bodyRef.current.contains(curListItem)) ||
      curListItem.id === state.draggedItemId
    ) {
      return null;
    } else {
      const dragId = curListItem.id;
      const draggingToItemIndex = Array.from(
        bodyRef.current?.children || []
      ).findIndex((item) => item.id === dragId);
      if (draggingToItemIndex !== state.draggingToItemIndex) {
        const tempItemOrder = moveItem(
          itemOrder,
          state.draggedItemId,
          draggingToItemIndex
        );
        move(tempItemOrder);
        setState({
          ...state,
          draggingToItemIndex,
          tempItemOrder,
        });
      }
    }
  };

  const onDragEnd = (evt: React.DragEvent) => {
    const tr = evt.target as HTMLTableRowElement;
    tr.classList.remove(styles.modifiers.ghostRow);
    tr.setAttribute("aria-pressed", "false");
    setState({
      ...state,
      draggedItemId: "",
      draggingToItemIndex: -1,
      dragging: false,
    });
  };

  const onDragFinish = async (dragged: string, newOrder: string[]) => {
    const keys = groupedUserCredentials.map((e) => e.value.map((c) => c.id));
    const oldIndex = keys.findIndex((el) => el.join().includes(dragged));
    const newIndex = newOrder.findIndex((el) => el.includes(dragged));
    const times = newIndex - oldIndex;

    try {
      for (let index = 0; index < Math.abs(times); index++) {
        if (times > 0) {
          await adminClient.users.moveCredentialPositionDown({
            id: user.id!,
            credentialId: dragged,
            newPreviousCredentialId: "", //Todo
          });
        } else {
          await adminClient.users.moveCredentialPositionUp({
            id: user.id!,
            credentialId: dragged,
          });
        }
      }
      refresh();

      addAlert(t("users:updatedCredentialMoveSuccess"), AlertVariant.success);
    } catch (error) {
      addError("users:updatedCredentialMoveError", error);
    }
  };

  return (
    <>
      {isOpen && (
        <ResetPasswordDialog
          user={user}
          isResetPassword={isResetPassword}
          refresh={refresh}
          onClose={() => setIsOpen(false)}
        />
      )}
      {openCredentialReset && (
        <ResetCredentialDialog
          userId={user.id!}
          onClose={() => setOpenCredentialReset(false)}
        />
      )}
      <DeleteConfirm />
      {userCredentials.length !== 0 && passwordTypeFinder === undefined && (
        <>
          <Button
            key={`confirmSaveBtn-table-${user.id}`}
            className="kc-setPasswordBtn-tbl"
            data-testid="setPasswordBtn-table"
            variant="primary"
            form="userCredentials-form"
            onClick={() => {
              setIsOpen(true);
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
            <Tbody
              ref={bodyRef}
              onDragOver={onDragOver}
              onDrop={onDragOver}
              onDragLeave={onDragLeave}
            >
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
                        id: `draggable-row-${groupedCredential.value.map(
                          (credential) => {
                            return credential.id;
                          }
                        )}`,
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
                      {toUpperCase(groupedCredential.key)}
                    </Td>
                    {groupedCredential.value.length <= 1 &&
                      groupedCredential.value.map((credential) => (
                        <Row
                          key={`subrow-${credential.id}`}
                          credential={credential}
                        />
                      ))}
                  </Tr>
                  {groupedCredential.isExpanded &&
                    groupedCredential.value.map((credential) => (
                      <Tr
                        key={`child-key-${credential.id}`}
                        id={credential.id}
                        draggable
                        onDrop={onDrop}
                        onDragEnd={onDragEnd}
                        onDragStart={onDragStart}
                      >
                        <Td />
                        <Td
                          className="kc-draggable-dropdown-type-icon"
                          draggableRow={{
                            id: `draggable-row-${credential.id}`,
                          }}
                        />
                        <Td
                          dataLabel={`child-columns-${credential.id}`}
                          className="kc-expandableRow-credentialType"
                        >
                          {toUpperCase(credential.type!)}
                        </Td>
                        <Row credential={credential} />
                      </Tr>
                    ))}
                </Fragment>
              ))}
            </Tbody>
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
