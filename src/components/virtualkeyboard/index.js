import Vb from './src/Virtualkeyboard.vue'
Vb.install = App => {
    App.component(Vb.name,Vb)
}
export default Vb