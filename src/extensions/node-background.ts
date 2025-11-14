// src/extensions/node-background.ts
import { Node, mergeAttributes } from '@tiptap/core'

export const NodeBackground = Node.create({
  name: 'nodeBackground',

  addAttributes() {
    return {
      backgroundColor: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-background-color'),
        renderHTML: (attrs) => {
          return {
            'data-background-color': attrs.backgroundColor,
            style: `background-color: ${attrs.backgroundColor || ''}`,
          }
        },
      },
    }
  },

  addCommands() {
    return {
      toggleNodeBackgroundColor:
        (color: string) =>
        ({ commands }) => {
          return commands.updateAttributes('nodeBackground', { backgroundColor: color })
        },
      unsetNodeBackgroundColor:
        () =>
        ({ commands }) => {
          return commands.updateAttributes('nodeBackground', { backgroundColor: null })
        },
    }
  },
})
