// Screen-local focus navigation; selections use the same click handlers as a mouse.
export function focusMove(groups,active,code){
 const rows=groups.map(row=>row.filter(b=>b&&!b.disabled&&!b.hidden)).filter(row=>row.length);
 if(!rows.length)return null;
 let row=rows.findIndex(items=>items.includes(active)),column;
 if(row<0){row=0;column=Math.max(0,rows[0].findIndex(b=>b.getAttribute('aria-pressed')==='true'));}
 else column=rows[row].indexOf(active);
 const horizontal=code==='ArrowLeft'||code==='ArrowRight';
 if(horizontal)column=(column+(code==='ArrowRight'?1:-1)+rows[row].length)%rows[row].length;
 else if(code==='ArrowUp'||code==='ArrowDown'){row=(row+(code==='ArrowDown'?1:-1)+rows.length)%rows.length;const selected=rows[row].findIndex(b=>b.getAttribute('aria-pressed')==='true');column=selected>=0?selected:Math.min(column,rows[row].length-1);}
 const button=rows[row][column];return {button,select:horizontal&&button.getAttribute('aria-pressed')!==null};
}
