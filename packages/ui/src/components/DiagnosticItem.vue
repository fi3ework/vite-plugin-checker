<script setup lang="ts">
import { computed } from 'vue'
import type { Diagnostic } from '../../../vite-plugin-checker/src/protocol'
import { editorLink, openEditorLink } from '../editor'
import { diagnosticToMarkdown } from '../markdown'
import CodeSnippet from './CodeSnippet.vue'
import CopyButton from './CopyButton.vue'
import LevelIcon from './LevelIcon.vue'

const props = defineProps<{
  diagnostic: Diagnostic
  label: string
  showFile: boolean
}>()

const link = computed(() => editorLink(props.diagnostic))

const location = computed(() => {
  const { displayFile, line, column } = props.diagnostic
  const position = line ? `${line}:${column ?? 1}` : ''
  if (!props.showFile) return position
  return [displayFile, position].filter(Boolean).join(':')
})
</script>

<template>
  <li :class="['diagnostic', diagnostic.level]">
    <LevelIcon :level="diagnostic.level" class="icon" />
    <span class="visually-hidden">{{ diagnostic.level }}:</span>
    <div class="body">
      <div class="head">
        <p class="message">{{ diagnostic.message }}</p>
        <CopyButton
          class="copy"
          label="Copy as Markdown"
          :text="() => diagnosticToMarkdown(diagnostic, label)"
        />
      </div>
      <p class="meta">
        <a
          v-if="link && location"
          class="location mono"
          :href="link.href"
          :target="link.external ? '_blank' : undefined"
          :title="`Open ${diagnostic.file} in editor`"
          @click="openEditorLink($event, link)"
        >{{ location }}</a>
        <span v-else-if="location" class="location mono">{{ location }}</span>
        <template v-if="diagnostic.code">
          <a
            v-if="diagnostic.docsUrl"
            class="code mono"
            :href="diagnostic.docsUrl"
            target="_blank"
            rel="noopener noreferrer"
          >{{ diagnostic.code }}</a>
          <span v-else class="code mono">{{ diagnostic.code }}</span>
        </template>
        <span class="checker">{{ label }}</span>
      </p>
      <CodeSnippet v-if="diagnostic.snippet" :snippet="diagnostic.snippet" :range="diagnostic" />
    </div>
  </li>
</template>

<style scoped>
.diagnostic {
  content-visibility: auto;
  contain-intrinsic-size: auto 160px;
  display: flex;
  gap: 10px;
  padding: 12px 16px 14px;
  border-top: 1px solid var(--vpc-line);
  --level-color: var(--vpc-error);
}
.diagnostic.warning {
  --level-color: var(--vpc-warning);
}
.diagnostic.info {
  --level-color: var(--vpc-info);
}
.icon {
  margin-top: 2px;
}
.body {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 6px;
}
.head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.message {
  flex: 1;
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.copy {
  margin: -3px -8px 0 0;
  opacity: 0;
}
.diagnostic:hover .copy,
.copy:focus-visible {
  opacity: 1;
}
@media (hover: none) {
  .copy {
    opacity: 1;
  }
}
.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
  margin: 0;
  color: var(--vpc-muted);
  font-size: 12.5px;
}
.location {
  color: var(--mb-fg);
  text-decoration: none;
}
a.location:hover,
a.code:hover {
  text-decoration: underline;
}
.code {
  color: var(--vpc-muted);
}
a.code {
  color: var(--mb-accent);
  text-decoration: none;
}
</style>
