<template>
  <div class="acp-vb">
    <div class="acp-vb-title">
      {{ title }}
    </div>
    <div class="acp-vb-content">
      <input
        id="valueInput"
        v-model="value"
        class="acp-vb-content-value"
        type="text"
        @click="getCursorPos"
      >
      <div class="acp-vb-content-select">
        <p>{{ cnValue }}</p>
        <ul>
          <li
            v-for="el,i in selectList"
            :key="i"
            @click="selectCnValue(el)"
          >
            {{ `${i+1}.${el}` }}
          </li>
        </ul>
      </div>
      <div class="acp-vb-content-board">
        <div
          v-for="(el, i) in keysBoard"
          :key="i"
          v-waves
          :class="`acp-vb-content-board-key ${el.sActive ? 'active' : ''}`"
          :style="{
            width: el.w,
            lineHeight: el.sValue ? 'auto' : '40px',
            background: el.color ? el.color : '',
            color: el.color ? '#fff' : '',
          }"
          @click="keysClick(el)"
        >
          <div
            v-if="shfitActive"
            class="value"
          >
            {{ el.sValue ? el.sValue : el.value }}
          </div>
          <div
            v-if="capsActive"
            class="value"
          >
            {{
              /^[A-Za-z]*$/.test(el.value) && el.value.length === 1
                ? el.sValue
                : el.value
            }}
          </div>
          <div
            v-if="!shfitActive && !capsActive"
            class="value"
          >
            {{ el.value }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, defineComponent, nextTick, reactive, ref, watchEffect } from "vue";
import { dictionary, keys,getCursortPosition,setCaretPosition,handleClick,context } from "./dictionary.js";
const waves = {
  mounted(el, binding) {
    el.addEventListener('click', handleClick(el, binding),true)
  },
  updated(el, binding) {
      el.removeEventListener('click', el[context].removeHandle,true)
      el.addEventListener('click', handleClick(el, binding),true)
  },
  unmounted(el) {
      el.removeEventListener('click', el[context].removeHandle,true)
      el[context] = null
      delete el[context]
      el.remove()
  },
}
export default defineComponent({
  name: "VirtualKeyBoard",
  props: {
    title: {
      type: String,
      default: "输入内容",
    },
  },
  directives:{
    waves
  },
  setup() {
    /* 键盘布局 */
    const keysBoard = reactive(keys);
    /* 输入框值 */
    const value = ref("");
    /* shift激活状态 */
    const shfitActive = ref(false);
    /* caps激活状态 */
    const capsActive = ref(false);
    /* 光标当前位置 */
    const cursorIndex = ref(0)
    /* 中文待选区的遍历值 */
    const cnValue = ref('')
    /* 中文待选区列表 */
    const selectList = computed(()=>{
      return keysBoard.filter(e => e.type === "switch")[0].value==='中'?(dictionary[cnValue.value]?.split(''))||[]:[]
    })
    /* 监听shift激活状态 */
    watchEffect(() => {
      shfitActive.value =
        keysBoard.filter((e) => e.value === "Shift")[0].sActive ?? false;
    });
    /* 监听caps激活状态 */
    watchEffect(() => {
      capsActive.value =
        keysBoard.filter((e) => e.value === "Caps")[0].sActive ?? false;
    });
    /* 判断各个按键 */
    const keysClick = async (row) => {
      console.log(row)
      switch (row.value) {
        case "Shift":
          keysBoard.filter((e) => e.value === "Shift").forEach((k) => {
            k.sActive = !k.sActive;
          });
          keysBoard.filter((e) => e.value === "Caps")[0].sActive = false
          keysBoard.filter((e) => e.type === "switch")[0].value = '英'
          break;
        case "Caps":
          row.sActive = !row.sActive;
          keysBoard.filter((e) => e.value === "Shift").forEach((k) => {
            k.sActive = false;
          })
          keysBoard.filter((e) => e.type === "switch")[0].value = '英'
          break;
        case "中":
          row.value = "英";
          break;
        case "英":
          row.value = "中";
          break;
        case "Tab":
          break;
        case '删除':{
          if(cnValue.value===''||cnValue.value===null){
            let tmpValueList = value.value.split('')
            tmpValueList.splice(cursorIndex.value-1,1)
            --cursorIndex.value
            value.value = tmpValueList.join('')
            await nextTick()
            setCaretPosition(document.getElementById('valueInput'),cursorIndex.value)
          }else{
            let cnValueList = cnValue.value.split('')
            cnValueList.splice(cnValue.value.length-1,1)
            cnValue.value = cnValueList.join('')
          }
          break;
        }
        case 'Enter':
          cursorIndex.value = value.value.length
          break;
        case '确定':
          cursorIndex.value = value.value.length
          break;
        case '取消':
          break;
        case '——————':{
          if(keysBoard.filter(e=>e.type==='switch')[0].value==='中'){
            let tmpValueList = value.value.split('')
            tmpValueList.splice(cursorIndex.value,0,this.selectList[0])
            value.value = tmpValueList.join('')
            ++cursorIndex.value
            await nextTick()
            cnValue.value = ''
            setCaretPosition(document.getElementById('valueInput'),cursorIndex.value)
          }else{
            let tmpValueList = value.value.split('')
            tmpValueList.splice(cursorIndex.value,0,' ')
            value.value = tmpValueList.join('')
            ++cursorIndex.value
            await nextTick()
            setCaretPosition(document.getElementById('valueInput'),cursorIndex.value)
          }
          break;
        }
        default:{
          if(keysBoard.filter(e=>e.type==='switch')[0].value==='英'){
            let tmpValueList = value.value.split('')
            if(shfitActive.value){
              tmpValueList.splice(cursorIndex.value,0,row.sValue)
            }else if(capsActive.value&&/^[A-Za-z]*$/.test(row.value) && row.value.length === 1){
              tmpValueList.splice(cursorIndex.value,0,row.sValue)
            }else{
              tmpValueList.splice(cursorIndex.value,0,row.value)
            }
            ++cursorIndex.value
            value.value = tmpValueList.join('')
            await nextTick()
            setCaretPosition(document.getElementById('valueInput'),cursorIndex.value)
          }else{
             console.log('这里是中文输入')
             if(/^[A-Za-z]*$/.test(row.value) && row.value.length === 1){
               cnValue.value+=row.value
             }else{
               value.value+=row.value
             }
          }
          break;
        }
      }
    };
    /* 点击input框时获取光标位置 */
    const getCursorPos = ()=>{
      cursorIndex.value = getCursortPosition(document.getElementById('valueInput'))
    }
    /* 待选区选择中文时，添加到输入框内 */
    const selectCnValue = async text =>{
      let tmpValueList = value.value.split('')
      tmpValueList.splice(cursorIndex.value,0,text)
      value.value = tmpValueList.join('')
      ++cursorIndex.value
      await nextTick()
      cnValue.value = ''
      setCaretPosition(document.getElementById('valueInput'),cursorIndex.value)
    }
    return {
      value,
      keysBoard,
      keysClick,
      shfitActive,
      capsActive,
      getCursorPos,
      selectList,
      cnValue,
      selectCnValue
    };
  },
});
</script>
<style lang="scss">
@import "./virtualkeyboard.scss";
</style>
