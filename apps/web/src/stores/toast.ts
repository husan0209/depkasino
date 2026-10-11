'use client'

import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'info' | 'money'

export interface ToastItem {
  id: string
  title: string
  description?: string
  variant: ToastVariant
  /** Действие в тосте: «Вернуться в игру», «Смотреть историю». */
  action?: { label: string; href?: string; onClick?: () => void }
  duration: number
}

interface ToastStore {
  items: ToastItem[]
  push(toast: Omit<ToastItem, 'id' | 'duration'> & { duration?: number }): string
  dismiss(id: string): void
}

export const useToastStore = create<ToastStore>((set) => ({
  items: [],

  push(toast) {
    const id = Math.random().toString(36).slice(2, 9)
    const item: ToastItem = { duration: 5000, ...toast, id }
    set((state) => ({ items: [...state.items.slice(-3), item] }))
    return id
  },

  dismiss(id) {
    set((state) => ({ items: state.items.filter((t) => t.id !== id) }))
  }
}))

/** Хелперы тостов: один вызов из любого слоя. */
export const toast = {
  success: (title: string, description?: string, action?: ToastItem['action']) =>
    useToastStore.getState().push({ title, description, variant: 'success', action }),
  money: (title: string, description?: string, action?: ToastItem['action']) =>
    useToastStore.getState().push({ title, description, variant: 'money', action }),
  error: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, variant: 'error' }),
  info: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, variant: 'info' })
}
