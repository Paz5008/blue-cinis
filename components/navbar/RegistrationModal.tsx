"use client";

import { AnimatePresence } from "framer-motion";
import { useI18n } from "@/i18n/provider";
import RegistrationForm from "@/components/features/auth/RegistrationForm";
import RegistrationClientForm from "@/components/features/auth/RegistrationClientForm";
import { ModalContainer, ModalSwitchLink } from "./ModalPrimitives";

type RegistrationModalProps = {
  open: boolean;
  mode: "client" | "artist";
  onClose: () => void;
  onSwitchToLogin: () => void;
};

export default function RegistrationModal({
  open,
  mode,
  onClose,
  onSwitchToLogin,
}: RegistrationModalProps) {
  const { t } = useI18n();
  const title =
    mode === "client" ? t("nav.register_client_title") : t("nav.register_artist_title");

  const FormComponent = mode === "client" ? RegistrationClientForm : RegistrationForm;

  return (
    <AnimatePresence>
      {open ? (
        <ModalContainer onClose={onClose} title={title}>
          <FormComponent onSuccess={onClose} />
          <ModalSwitchLink
            onSwitch={onSwitchToLogin}
            text={t("nav.already_account")}
            linkText={t("nav.sign_in")}
          />
        </ModalContainer>
      ) : null}
    </AnimatePresence>
  );
}

