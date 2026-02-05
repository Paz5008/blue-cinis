"use client";
import React, { createContext, useContext } from 'react'

type Messages = Record<string, string>

type I18nContextType = {
  locale: 'fr' | 'en'
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType>({ locale: 'fr', t: (k)=>k })

export function I18nProvider({ locale, messages, children }:{ locale: 'fr'|'en'; messages: Messages; children: React.ReactNode }){
  const t = (key: string) => messages[key] || key
  return (<I18nContext.Provider value={{ locale, t }}>{children}</I18nContext.Provider>)
}

export function useI18n(){
  return useContext(I18nContext)
}
