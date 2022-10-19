import { useTranslation } from "react-i18next";
import {
  Modal,
  ModalVariant,
  TextContent,
  Text,
  TextVariants,
} from "@patternfly/react-core";
import {
  TableComposable,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import ComponentTypeRepresentation from "@keycloak/keycloak-admin-client/lib/defs/componentTypeRepresentation";

type NewClientRegistrationPolicyDialogProps = {
  policyProviders?: ComponentTypeRepresentation[];
  toggleDialog: () => void;
  onSelect: (provider: ComponentTypeRepresentation) => void;
};

export const NewClientRegistrationPolicyDialog = ({
  policyProviders,
  onSelect,
  toggleDialog,
}: NewClientRegistrationPolicyDialogProps) => {
  const { t } = useTranslation("clients");

  return (
    <Modal
      aria-labelledby={t("chooseAPolicyProvider")}
      variant={ModalVariant.medium}
      header={
        <TextContent>
          <Text component={TextVariants.h1}>{t("chooseAPolicyProvider")}</Text>
          <Text>{t("chooseAPolicyProviderInstructions")}</Text>
        </TextContent>
      }
      isOpen
      onClose={toggleDialog}
    >
      <TableComposable aria-label={t("providers")} variant="compact">
        <Thead>
          <Tr>
            <Th>{t("common:provider")}</Th>
            <Th>{t("common:description")}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {policyProviders?.map((provider) => (
            <Tr
              key={provider.id}
              data-testid={provider.id}
              onRowClick={() => onSelect(provider)}
              isHoverable
            >
              <Td>{provider.id}</Td>
              <Td>{provider.helpText}</Td>
            </Tr>
          ))}
        </Tbody>
      </TableComposable>
    </Modal>
  );
};
