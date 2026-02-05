"use client";

import { AnimatePresence } from "framer-motion";
import { User, PaintBucket } from "lucide-react";
import CTA from "@/components/shared/CTA";
import LoginForm from '@/components/features/auth/LoginForm';
import { useI18n } from "@/i18n/provider";
import { ModalContainer } from "./ModalPrimitives";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  onSwitchToClient: () => void;
  onSwitchToArtist: () => void;
};

export default function LoginModal({
  open,
  onClose,
  onSwitchToClient,
  onSwitchToArtist,
}: LoginModalProps) {
  const { t } = useI18n();

  return (
    <AnimatePresence>
      {open ? (
        <ModalContainer onClose={onClose} title={t("nav.login_title")}>
          <LoginForm onSuccess={onClose} />
          <div className="mt-6 text-center text-sm text-gray-600">
            <p className="mb-3">{t("nav.no_account_yet")}</p>
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CTA onClick={onSwitchToClient} variant="secondary" className="w-full">
                <User className="mr-2 h-4 w-4 text-slate-500" aria-hidden="true" />
                {t("nav.register_client")}
              </CTA>
              <CTA onClick={onSwitchToArtist} variant="primary" className="w-full">
                <PaintBucket className="mr-2 h-4 w-4 opacity-90" aria-hidden="true" />
                {t("nav.register_artist")}
              </CTA>
            </div>
          </div>
        </ModalContainer>
      ) : null}
    </AnimatePresence>
  );
}
