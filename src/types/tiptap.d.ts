import { ChainCommands } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    nodeBackground: {
      toggleNodeBackgroundColor: (color: string) => ReturnType
      unsetNodeBackgroundColor: () => ReturnType
    }
  }
}