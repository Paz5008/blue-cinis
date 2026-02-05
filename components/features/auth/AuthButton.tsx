"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import LoginForm from "./LoginForm";

export default function AuthButton() {
    const { data: session } = useSession();
    const [showModal, setShowModal] = useState(false);

    if (session?.user) {
        return (
            <div className="flex items-center gap-2">

                <button
                    onClick={() => signOut()}
                    className="px-4 py-2 border border-[#91B2FD] text-[#91B2FD] rounded cursor-pointer transition-colors duration-200 hover:bg-white hover:text-[#91B2FD]"
                    style={{ fontFamily: "Roboto, sans-serif" }}
                >
                    Se déconnecter
                </button>
            </div>
        );
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="px-4 rounded cursor-pointer transition-colors duration-200 flex items-center justify-center"
                style={{ fontFamily: "Roboto, sans-serif" }}
            >
                <Image src="/5087592.svg" alt="Se connecter" width={32} height={32} />
            </button>
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded shadow-lg max-w-md w-full relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            &times;
                        </button>
                        <h2 className="text-2xl font-bold mb-4 text-center">Connexion</h2>
                        <LoginForm />
                    </div>
                </div>
            )}
        </>
    );
}
