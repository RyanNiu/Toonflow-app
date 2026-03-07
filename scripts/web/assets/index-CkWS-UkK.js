import{d as u,f as C,g as d,h,i as J,a as t,j as f,p as L,k as X,l as R,m as V,n as $,q as v,s as q,t as D,v as z,x as k,w as a,c as N,y as H,e as G,z as U,I as K,F as Q,b as _,A as W,C as E,D as O,E as Y,G as Z,r as ee,u as te,o as p,_ as ae}from"./index-AugRXutB.js";import{l as ne}from"./logo-BONLVdbp.js";import{M as oe,a as se}from"./index-CRY5_ji9.js";import"./index-3zdSVX-Q.js";import"./fake-arrow-Dpg6yDDj.js";import"./toFinite-Cmwxfxl-.js";/**
 * tdesign v1.18.2
 * (c) 2026 tdesign
 * @license MIT
 */var re=u({name:"TLayout",setup:function(){var e=C(!1),o=f(),n=d("layout"),i=h(function(){return[n.value,J({},"".concat(n.value,"--with-sider"),e.value)]});return L("layout",{hasSide:e}),function(){return t("section",{class:i.value},[o("default")])}}});/**
 * tdesign v1.18.2
 * (c) 2026 tdesign
 * @license MIT
 */var ue={height:{type:String,default:""}};/**
 * tdesign v1.18.2
 * (c) 2026 tdesign
 * @license MIT
 */var le=u({name:"THeader",props:ue,setup:function(e){var o=d("layout__header"),n=f();return function(){return t("header",{class:o.value,style:e.height?{height:e.height}:{}},[n("default")])}}});/**
 * tdesign v1.18.2
 * (c) 2026 tdesign
 * @license MIT
 */var ie={height:{type:String,default:""}};/**
 * tdesign v1.18.2
 * (c) 2026 tdesign
 * @license MIT
 */var ce=u({name:"TFooter",props:ie,setup:function(e){var o=d("layout__footer"),n=f();return function(){return t("footer",{class:o.value,style:e.height?{height:e.height}:{}},[n("default")])}}});/**
 * tdesign v1.18.2
 * (c) 2026 tdesign
 * @license MIT
 */var pe={width:{type:String,default:""}};/**
 * tdesign v1.18.2
 * (c) 2026 tdesign
 * @license MIT
 */var de=u({name:"TAside",props:pe,setup:function(e){var o=X("layout",Object.create(null)),n=o.hasSide,i=d("layout__sider"),m=f();if(n)return R(function(){n.value=!0}),V(function(){n.value=!1}),function(){var y=e.width?{width:e.width}:{};return t("aside",{class:i.value,style:y},[m("default")])}}});/**
 * tdesign v1.18.2
 * (c) 2026 tdesign
 * @license MIT
 */var ve={content:{type:[String,Function]},default:{type:[String,Function]}};/**
 * tdesign v1.18.2
 * (c) 2026 tdesign
 * @license MIT
 */var _e=u({name:"TContent",props:ve,setup:function(){var e=d("layout__content"),o=$();return function(){return t("main",{class:e.value},[o("default","content")])}}});/**
 * tdesign v1.18.2
 * (c) 2026 tdesign
 * @license MIT
 */var he=v(de),fe=v(re);v(le);v(ce);var me=v(_e);const ye={class:"sidebarTitle"},ge={class:"menuOps fc"},Ne={key:0},Ce={key:0},Se=u({__name:"index",setup(l){const e=q(),{isAdmin:o}=D(e),n=[{path:"/project",label:"我的项目",icon:"folder-open"},{path:"/project-permissions",label:"权限管理",icon:"lock-on"},{path:"/project-cost",label:"成本跟踪",icon:"money"},{path:"/project-monitor",label:"监控报表",icon:"chart"}],i=h(()=>[...n,...o.value?[{path:"/accountManage",label:"账号管理",icon:"user"}]:[]]),m=h(()=>s.value?"chevron-right":"chevron-left"),y=te(),A=z(),S=C(A.path),s=C(!0);function T(b){const r=String(b);y.push(r),S.value=r}const M=h(()=>({display:s.value?"inline-flex":"block"}));return(b,r)=>{const g=K,j=se,w=W,I=oe,P=he,F=ee("router-view"),B=me,x=fe;return p(),k(x,{class:"main"},{default:a(()=>[t(P,{class:"sidebar",width:s.value?"64px":"232px"},{default:a(()=>[t(I,{class:"sidebar-menu",theme:"light",value:S.value,collapsed:s.value,onChange:T},{logo:a(()=>[_("h1",ye,[r[2]||(r[2]=_("img",{class:"logo",src:ne},null,-1)),Y(_("span",null,"Robou",512),[[Z,!s.value]])])]),operations:a(()=>[_("div",ge,[t(w,{variant:"text",shape:"square",onClick:r[0]||(r[0]=c=>s.value=!s.value),style:E(M.value)},{icon:a(()=>[t(g,{name:m.value},null,8,["name"])]),default:a(()=>[s.value?O("",!0):(p(),N("span",Ne,"收起"))]),_:1},8,["style"]),t(w,{variant:"text",shape:"square",onClick:r[1]||(r[1]=()=>T("/setting")),style:E(M.value)},{icon:a(()=>[t(g,{name:"setting"})]),default:a(()=>[s.value?O("",!0):(p(),N("span",Ce,"设置"))]),_:1},8,["style"])])]),default:a(()=>[(p(!0),N(Q,null,H(i.value,c=>(p(),k(j,{key:c.path,value:c.path},{icon:a(()=>[t(g,{name:c.icon},null,8,["name"])]),default:a(()=>[G(" "+U(c.label),1)]),_:2},1032,["value"]))),128))]),_:1},8,["value","collapsed"])]),_:1},8,["width"]),t(x,null,{default:a(()=>[t(B,{class:"content"},{default:a(()=>[t(F)]),_:1})]),_:1})]),_:1})}}}),Ee=ae(Se,[["__scopeId","data-v-55e8abd6"]]);export{Ee as default};
