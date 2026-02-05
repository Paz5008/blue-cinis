"use client";
import { useEffect } from 'react';

export default function ClearCartOnMount() {
  useEffect(() => {
    try { window.localStorage.removeItem('cart'); } catch {}
  }, []);
  return null;
}
