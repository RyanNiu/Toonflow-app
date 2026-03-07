import{d as u,f as C,g as p,h as f,i as B,a as t,j as h,p as J,k as L,l as X,m as R,n as V,q as v,s as $,t as q,v as D,x as E,w as a,c as N,y as z,e as H,z as G,I as U,F as K,b as _,A as Q,C as O,D as k,E as W,G as Y,r as Z,u as ee,o as d,_ as te}from"./index-Bww5yYaI.js";import{l as ae}from"./logo-BONLVdbp.js";import{M as ne,a as oe}from"./index-BSLRsruv.js";import"./index-BjezOGec.js";import"./fake-arrow-CECx1-FI.js";import"./toFinite-CO-GbYm8.js";/**
 * tdesign v1.18.2
 * (c) 2026 tdesign
 * @license MIT
 */var se=u({name:"TLayout",setup:function(){var e=C(!1),o=h(),n=p("layout"),i=f(function(){return[n.value,B({},"".concat(n.value,"--with-sider"),e.value)]});return J("layout",{hasSide:e}),function(){return t("section",{class:i.value},[o("default")])}}});/**
 * tdesign v1.18.2
 * (c) 2026 tdesign
 * @license MIT
 */var re={height:{type:String,default:""}};/**
 * tdesign v1.18.2
 * (c) 2026 tdesign
 * @license MIT
 */var ue=u({name:"THeader",props:re,setup:function(e){var o=p("layout__header"),n=h();return function(){return t("header",{class:o.value,style:e.height?{height:e.height}:{}},[n("default")])}}});/**
 * tdesign v1.18.2
 * (c) 2026 tdesign
 * @license MIT
 */var le={height:{type:String,default:""}};/**
 * tdesign v1.18.2
 * (c) 2026 tdesign
 * @license MIT
 */var ie=u({name:"TFooter",props:le,setup:function(e){var o=p("layout__footer"),n=h();return function(){return t("footer",{class:o.value,style:e.height?{height:e.height}:{}},[n("default")])}}});/**
 * tdesign v1.18.2
 * (c) 2026 tdesign
 * @license MIT
 */var ce={width:{type:String,default:""}};/**
 * tdesign v1.18.2
 * (c) 2026 tdesign
 * @license MIT
 */var de=u({name:"TAside",props:ce,setup:function(e){var o=L("layout",Object.create(null)),n=o.hasSide,i=p("layout__sider"),m=h();if(n)return X(function(){n.value=!0}),R(function(){n.value=!1}),function(){var y=e.width?{width:e.width}:{};return t("aside",{class:i.value,style:y},[m("default")])}}});/**
 * tdesign v1.18.2
 * (c) 2026 tdesign
 * @license MIT
 */var pe={content:{type:[String,Function]},default:{type:[String,Function]}};/**
 * tdesign v1.18.2
 * (c) 2026 tdesign
 * @license MIT
 */var ve=u({name:"TContent",props:pe,setup:function(){var e=p("layout__content"),o=V();return function(){return t("main",{class:e.value},[o("default","content")])}}});/**
 * tdesign v1.18.2
 * (c) 2026 tdesign
 * @license MIT
 */var _e=v(de),fe=v(se);v(ue);v(ie);var he=v(ve);const me={class:"sidebarTitle"},ye={class:"menuOps fc"},ge={key:0},Ne={key:0},Ce=u({__name:"index",setup(l){const e=$(),{isAdmin:o}=q(e),n=f(()=>[{path:"/project",label:"我的项目",icon:"folder-open"},...o.value?[{path:"/accountManage",label:"账号管理",icon:"user"}]:[]]),i=f(()=>s.value?"chevron-right":"chevron-left"),m=ee(),y=D(),S=C(y.path),s=C(!0);function T(w){const r=String(w);m.push(r),S.value=r}const M=f(()=>({display:s.value?"inline-flex":"block"}));return(w,r)=>{const g=U,A=oe,x=Q,P=ne,F=_e,I=Z("router-view"),j=he,b=fe;return d(),E(b,{class:"main"},{default:a(()=>[t(F,{class:"sidebar",width:s.value?"64px":"232px"},{default:a(()=>[t(P,{class:"sidebar-menu",theme:"light",value:S.value,collapsed:s.value,onChange:T},{logo:a(()=>[_("h1",me,[r[2]||(r[2]=_("img",{class:"logo",src:ae},null,-1)),W(_("span",null,"Robou",512),[[Y,!s.value]])])]),operations:a(()=>[_("div",ye,[t(x,{variant:"text",shape:"square",onClick:r[0]||(r[0]=c=>s.value=!s.value),style:O(M.value)},{icon:a(()=>[t(g,{name:i.value},null,8,["name"])]),default:a(()=>[s.value?k("",!0):(d(),N("span",ge,"收起"))]),_:1},8,["style"]),t(x,{variant:"text",shape:"square",onClick:r[1]||(r[1]=()=>T("/setting")),style:O(M.value)},{icon:a(()=>[t(g,{name:"setting"})]),default:a(()=>[s.value?k("",!0):(d(),N("span",Ne,"设置"))]),_:1},8,["style"])])]),default:a(()=>[(d(!0),N(K,null,z(n.value,c=>(d(),E(A,{key:c.path,value:c.path},{icon:a(()=>[t(g,{name:c.icon},null,8,["name"])]),default:a(()=>[H(" "+G(c.label),1)]),_:2},1032,["value"]))),128))]),_:1},8,["value","collapsed"])]),_:1},8,["width"]),t(b,null,{default:a(()=>[t(j,{class:"content"},{default:a(()=>[t(I)]),_:1})]),_:1})]),_:1})}}}),Ee=te(Ce,[["__scopeId","data-v-0ada66d3"]]);export{Ee as default};
