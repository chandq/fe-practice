<template>
  <n-modal
    class="import-modal"
    :show="state.showModal"
    :mask-closable="false"
    preset="card"
    title="选择内容"
    :style="{
      width: '800px',
      height: '300px'
    }"
    @afterLeave="handleCancel"
    @close="handleCancel"
  >
    <n-form
      ref="formRef"
      :model="state.form"
      label-placement="left"
      label-width="auto"
      require-mark-placement="right-hanging"
    >
      <n-form-item label="url" path="url">
        <n-input v-model:value="state.form.url" placeholder="请输入url" clearable />
      </n-form-item>
      <!-- <n-form-item label="认证类型" path="security_type">
        <n-select
          :options="security_type_options"
          v-model:value="state.security_type"
          @update:value="handleUpdateSecurityType"
          clearable
          placeholder="请选择认证类型"
        ></n-select>
      </n-form-item>
      <n-form-item label="Name" path="name">
        <n-input v-model:value="state.name" placeholder="请输入Name" clearable />
      </n-form-item>
      <n-form-item label="In" path="kind">
        <n-select
          :options="In_options"
          v-model:value="state.kind"
          clearable
          placeholder="请选择In"
        ></n-select>
      </n-form-item> -->
    </n-form>
    <template #action>
      <div class="h-full flex items-center justify-end">
        <n-space>
          <NButton @click="handleCancel">取消</NButton>
          <NButton type="primary" @click="handleSubmit" :loading="state.loading">确定</NButton>
        </n-space>
      </div>
    </template>
  </n-modal>
</template>

<script lang="ts" setup>
import { reactive, toRaw, watch } from 'vue'
import { NModal, NForm, NFormItem, NInput, NSpace, NButton } from 'naive-ui'

const props = withDefaults(
  defineProps<{
    visible: boolean
    onSubmit: (data: any) => void
    onCancel: () => void
  }>(),
  {
    visible: false
  }
)

// watch(
//   () => props.visible,
//   (val) => {
//     state.showModal = val
//   }
// )

const state = reactive({
  showModal: true,
  security_type: '',
  kind: '',
  loading: false,
  form: { url: '' }
})

function handleSubmit() {
  props.onSubmit?.(toRaw(state.form))
  // state.loading = true
  setTimeout(() => {
    // state.loading = false
    // state.showModal = false
  }, 1000)
}

function handleCancel() {
  state.showModal = false
  props.onCancel?.()
}
</script>

<style lang="less" scoped></style>
