type PanelNavItem={
  href:string;
  title:string;
  description:string;
  badge?:string;
};

type PanelNavGroup={
  label:string;
  description?:string;
  items:PanelNavItem[];
};

export function PanelNavigator({
  roleLabel,
  groups
}:{
  roleLabel:string;
  groups:PanelNavGroup[];
}){
  return <div className="panelNavigator">
    <div className="panelNavigatorHead">
      <div>
        <div className="moduleEyebrow">PANEL HARİTASI</div>
        <h2>{roleLabel} çalışma alanları</h2>
        <p>Aradığınız bölüme doğrudan geçin. Modüller kullanım amacına göre ana kategoriler altında gruplanmıştır.</p>
      </div>
      <span className="panelNavigatorHint">Bölüm seç →</span>
    </div>
    <div className="panelNavigatorGroups">
      {groups.map((group,groupIndex)=><section className="panelNavigatorGroup" key={group.label}>
        <div className="panelNavigatorGroupHead">
          <span>{String(groupIndex+1).padStart(2,'0')}</span>
          <div><strong>{group.label}</strong>{group.description&&<small>{group.description}</small>}</div>
        </div>
        <div className="panelNavigatorItems">
          {group.items.map(item=><a className="panelNavigatorItem" href={item.href} key={item.href+item.title}>
            <div><strong>{item.title}</strong><p>{item.description}</p></div>
            {item.badge&&<span>{item.badge}</span>}
            <b>→</b>
          </a>)}
        </div>
      </section>)}
    </div>
  </div>;
}
