<script setup lang="ts">
import { useApiDocs } from '~/api-docs/context'
import { enumId } from '~/api-docs/keys'
import type { FieldSpec } from '~/api-docs/types'

/**
 * Fields of a response or a model, one row each like the parameters. A nested object's own fields sit in a sunken box
 * under its description; when the field is a model with fields added, the box says so first. `prefix` is the dotted
 * path of the parent, under which the descriptions are found in `texts`. Row styles are in api-docs.css.
 */
const props = withDefaults(defineProps<{ fields: FieldSpec[], texts: Record<string, string> | undefined, prefix?: string }>(), { prefix: '' })

const docs = useApiDocs()
const labels = computed(() => docs.value.texts.labels)
const path = (field: FieldSpec) => (props.prefix ? `${props.prefix}.${field.name}` : field.name)
const seeLabel = computed(() => labels.value.see.split('{name}'))
/** The model a field with added fields extends: `AlbumSimple[]` → AlbumSimple. */
const extended = (field: FieldSpec) => {
  const model = field.type.match(/^([A-Z][A-Za-z]+)/)?.[1]
  return model && docs.value.models.has(model) ? model : null
}
const extendsLabel = computed(() => labels.value.extends.split('{model}'))
</script>

<template>
  <dl class="ad-rows">
    <div v-for="field in fields" :key="field.name" class="ad-row">
      <dt class="ad-key">
        <code class="ad-name">{{ field.name }}</code>
        <ApiDocsType :type="field.type" />
      </dt>
      <dd class="ad-desc">
        <!-- eslint-disable-next-line vue/no-v-html -- the reference's own texts, rendered by the site's Markdown -->
        <span v-html="docs.inline(docs.fieldText(field, texts, path(field)))" />
        <span v-if="field.optional || field.values || field.enum" class="ad-chips">
          <span v-if="field.optional" class="ad-chip">{{ labels.optional }}</span>
          <code v-for="value in field.values" :key="value" class="ad-chip">{{ value }}</code>
          <a v-if="field.enum" :href="`#${enumId(field.enum)}`" class="ad-chip">{{ seeLabel[0] }}{{ field.enum }}{{ seeLabel[1] }}</a>
        </span>
        <div v-if="field.fields" class="ad-nest">
          <p v-if="extended(field)" class="ad-nest-note">{{ extendsLabel[0] }}<ApiDocsType :type="extended(field)!" />{{ extendsLabel[1] }}</p>
          <Fields :fields="field.fields" :texts="texts" :prefix="path(field)" />
        </div>
      </dd>
    </div>
  </dl>
</template>
